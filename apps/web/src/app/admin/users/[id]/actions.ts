'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { authOptions } from '@/auth';

export type AccountStatus =
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED';

export type PlatformRoleValue =
  | 'SUPER_ADMIN'
  | 'OPERATIONS'
  | 'SUPPORT'
  | 'FINANCE'
  | 'COMPLIANCE'
  | null;

type ActionResult = {
  ok: boolean;
  message: string;
};

async function getSuperAdminSession() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (
    !session ||
    session.user.platformRole !==
      'SUPER_ADMIN' ||
    !session.user.accessToken
  ) {
    return null;
  }

  return session;
}

export async function updateUserStatus(
  userId: string,
  status: AccountStatus,
): Promise<ActionResult> {
  const session =
    await getSuperAdminSession();

  if (!session) {
    return {
      ok: false,
      message:
        'Super Admin authentication is required.',
    };
  }

  const allowedStatuses:
    AccountStatus[] = [
      'ACTIVE',
      'RESTRICTED',
      'SUSPENDED',
    ];

  if (
    !allowedStatuses.includes(
      status,
    )
  ) {
    return {
      ok: false,
      message:
        'Invalid account status.',
    };
  }

  const apiBaseUrl =
    process.env.HIFFS_API_URL ??
    'http://localhost:4000';

  const response =
    await fetch(
      `${apiBaseUrl}/admin/users/${encodeURIComponent(
        userId,
      )}/status`,
      {
        method: 'PATCH',

        headers: {
          Authorization:
            `Bearer ${session.user.accessToken}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          status,
        }),

        cache: 'no-store',
      },
    );

  const payload = (await response
    .json()
    .catch(() => null)) as {
    message?:
      | string
      | string[];
  } | null;

  if (!response.ok) {
    return {
      ok: false,

      message:
        Array.isArray(
          payload?.message,
        )
          ? payload.message.join(
              ', ',
            )
          : payload?.message ??
            'Unable to update account status.',
    };
  }

  revalidatePath(
    `/admin/users/${userId}`,
  );

  revalidatePath(
    '/admin/users',
  );

  return {
    ok: true,
    message:
      `Account status changed to ${status}.`,
  };
}

export async function updateUserPlatformRole(
  userId: string,
  platformRole: PlatformRoleValue,
): Promise<ActionResult> {
  const session =
    await getSuperAdminSession();

  if (!session) {
    return {
      ok: false,
      message:
        'Super Admin authentication is required.',
    };
  }

  const allowedRoles:
    PlatformRoleValue[] = [
      null,
      'SUPER_ADMIN',
      'OPERATIONS',
      'SUPPORT',
      'FINANCE',
      'COMPLIANCE',
    ];

  if (
    !allowedRoles.includes(
      platformRole,
    )
  ) {
    return {
      ok: false,
      message:
        'Invalid platform role.',
    };
  }

  const apiBaseUrl =
    process.env.HIFFS_API_URL ??
    'http://localhost:4000';

  const response =
    await fetch(
      `${apiBaseUrl}/admin/users/${encodeURIComponent(
        userId,
      )}/platform-role`,
      {
        method: 'PATCH',

        headers: {
          Authorization:
            `Bearer ${session.user.accessToken}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          platformRole,
        }),

        cache: 'no-store',
      },
    );

  const payload = (await response
    .json()
    .catch(() => null)) as {
    message?:
      | string
      | string[];
  } | null;

  if (!response.ok) {
    return {
      ok: false,

      message:
        Array.isArray(
          payload?.message,
        )
          ? payload.message.join(
              ', ',
            )
          : payload?.message ??
            'Unable to update platform role.',
    };
  }

  revalidatePath(
    `/admin/users/${userId}`,
  );

  revalidatePath(
    '/admin/users',
  );

  return {
    ok: true,

    message:
      platformRole
        ? `Platform role changed to ${platformRole}.`
        : 'Platform role removed.',
  };
}