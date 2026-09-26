import Link from 'next/link';
import { getServerSession } from 'next-auth';
import {
  notFound,
  redirect,
} from 'next/navigation';

import { authOptions } from '@/auth';
import { UserStatusControls } from './user-status-controls';
import { PlatformRoleControls } from './platform-role-controls';

type AccountStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'RESTRICTED';

type Membership = {
  id: string;
  role: string;
  active: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;

  business: {
    id: string;
    name: string;
    countryCode: string;
    email: string | null;
    website: string | null;
  };
};

type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;

  status: AccountStatus;

  platformRole:
    | 'SUPER_ADMIN'
    | 'OPERATIONS'
    | 'SUPPORT'
    | 'FINANCE'
    | 'COMPLIANCE'
    | null;

  emailVerified: string | null;
  phoneVerified: string | null;

  createdAt: string;
  updatedAt: string;

  memberships: Membership[];
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  );
}

function StatusBadge({
  status,
}: {
  status: AccountStatus;
}) {
  const classes =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'SUSPENDED'
        ? 'bg-red-50 text-red-700'
        : 'bg-amber-50 text-amber-700';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

function VerificationBadge({
  verified,
}: {
  verified: boolean;
}) {
  return (
    <span
      className={
        verified
          ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
          : 'inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700'
      }
    >
      {verified
        ? 'Verified'
        : 'Pending'}
    </span>
  );
}

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session) {
    redirect('/login');
  }

  if (
    session.user.platformRole !==
    'SUPER_ADMIN'
  ) {
    redirect('/dashboard');
  }

  const accessToken =
    session.user.accessToken;

  if (!accessToken) {
    redirect('/login');
  }

  const { id } =
    await params;

  const apiBaseUrl =
    process.env.HIFFS_API_URL ??
    'http://localhost:4000';

  const response =
    await fetch(
      `${apiBaseUrl}/admin/users/${encodeURIComponent(
        id,
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: 'no-store',
      },
    );

  if (
    response.status === 404
  ) {
    notFound();
  }

  if (!response.ok) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-blue-600"
        >
          ← Back to users
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load user
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            The administration API returned an error
            while loading this user.
          </p>
        </div>
      </div>
    );
  }

  const user =
    (await response.json()) as AdminUser;

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-blue-600"
        >
          ← Users
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {user.name ??
                  'Unnamed user'}
              </h1>

              <StatusBadge
                status={user.status}
              />
            </div>

            <p className="mt-3 break-all text-sm text-slate-500">
              {user.email}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              User ID:{' '}
              <span className="font-mono">
                {user.id}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Platform role
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {user.platformRole ??
                'Standard user'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Email verification
          </p>

          <div className="mt-4">
            <VerificationBadge
              verified={Boolean(
                user.emailVerified,
              )}
            />
          </div>

          {user.emailVerified && (
            <p className="mt-3 text-xs text-slate-400">
              {formatDate(
                user.emailVerified,
              )}
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Phone verification
          </p>

          <div className="mt-4">
            <VerificationBadge
              verified={Boolean(
                user.phoneVerified,
              )}
            />
          </div>

          {user.phoneVerified && (
            <p className="mt-3 text-xs text-slate-400">
              {formatDate(
                user.phoneVerified,
              )}
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Workspaces
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {
              user.memberships
                .length
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Account status
          </p>

          <div className="mt-4">
            <StatusBadge
              status={user.status}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Identity
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Name
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {user.name ??
                  '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </dt>

              <dd className="mt-1 break-all text-sm font-medium text-slate-800">
                {user.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {user.phone ??
                  '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Created
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(
                  user.createdAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last updated
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(
                  user.updatedAt,
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Platform access
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Account status
              </dt>

              <dd className="mt-2">
                <StatusBadge
                  status={
                    user.status
                  }
                />
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Platform role
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {user.platformRole ??
                  'None'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email ownership
              </dt>

              <dd className="mt-2">
                <VerificationBadge
                  verified={Boolean(
                    user.emailVerified,
                  )}
                />
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone ownership
              </dt>

              <dd className="mt-2">
                <VerificationBadge
                  verified={Boolean(
                    user.phoneVerified,
                  )}
                />
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Business memberships
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Workspaces this user
            belongs to and their
            assigned business role.
          </p>
        </div>

        {user.memberships
          .length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            This user has no
            business memberships.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {user.memberships.map(
              (membership) => (
                <div
                  key={
                    membership.id
                  }
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr]"
                >
                  <div>
                    <Link
                      href={`/admin/businesses/${membership.business.id}`}
                      className="font-semibold text-slate-900 transition hover:text-blue-600"
                    >
                      {
                        membership
                          .business
                          .name
                      }
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        membership
                          .business
                          .countryCode
                      }
                    </p>

                    {membership
                      .business
                      .email && (
                      <p className="mt-1 break-all text-xs text-slate-400">
                        {
                          membership
                            .business
                            .email
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Role
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {
                        membership.role
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Active
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {membership.active
                        ? 'Yes'
                        : 'No'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Joined
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {formatDate(
                        membership.createdAt,
                      )}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <UserStatusControls
  userId={user.id}
  currentStatus={
    user.status
  }
  isCurrentUser={
    session.user.id ===
    user.id
  }
/>

<PlatformRoleControls
  userId={user.id}
  currentRole={
    user.platformRole
  }
  isCurrentUser={
    session.user.id ===
    user.id
  }
/>
    </div>
  );
}