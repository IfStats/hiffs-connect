'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { authOptions } from '@/auth';

export type AccountStatus =
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED';

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function updateUserStatus(
  userId: string,
  status: AccountStatus,
): Promise<ActionResult> {
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
    const message =
      Array.isArray(
        payload?.message,
      )
        ? payload.message.join(
            ', ',
          )
        : payload?.message ??
          'Unable to update account status.';

    return {
      ok: false,
      message,
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