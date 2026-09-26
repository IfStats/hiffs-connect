import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';

type Membership = {
  id: string;
  role: string;
  active: boolean;
  businessId: string;

  business: {
    id: string;
    name: string;
    countryCode: string;
  };
};

type AdminUser = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;

  status:
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'RESTRICTED';

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      dateStyle: 'medium',
    },
  ).format(new Date(value));
}

function VerificationBadge({
  verified,
}: {
  verified: boolean;
}) {
  return verified ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Verified
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminUser['status'];
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

export default async function AdminUsersPage() {
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

  const apiBaseUrl =
    process.env.HIFFS_API_URL ??
    'http://localhost:4000';

  const response =
    await fetch(
      `${apiBaseUrl}/admin/users`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: 'no-store',
      },
    );

  if (!response.ok) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-sm font-semibold text-blue-600">
            User administration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Users
          </h1>
        </section>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load users
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            The platform administration API returned
            an error. Check the API deployment,
            authentication token and Super Admin
            permissions.
          </p>
        </div>
      </div>
    );
  }

  const users =
    (await response.json()) as AdminUser[];

  const verifiedEmailCount =
    users.filter((user) =>
      Boolean(
        user.emailVerified,
      ),
    ).length;

  const verifiedPhoneCount =
    users.filter((user) =>
      Boolean(
        user.phoneVerified,
      ),
    ).length;

  const activeCount =
    users.filter(
      (user) =>
        user.status ===
        'ACTIVE',
    ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            User administration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Users
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Review Hiffs Connect user identities,
            verification state, account access,
            platform privileges and workspace
            memberships.
          </p>
        </div>

        <div className="text-sm text-slate-500">
          {users.length}{' '}
          {users.length === 1
            ? 'user'
            : 'users'}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total users
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {users.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Active accounts
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {activeCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Email verified
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {verifiedEmailCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Phone verified
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {verifiedPhoneCount}
          </p>
        </article>
      </section>

      {users.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-slate-800">
            No users found
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Registered Hiffs Connect users will
            appear here.
          </p>
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'User',
                      'Phone',
                      'Email',
                      'Phone verification',
                      'Status',
                      'Platform role',
                      'Business',
                      'Created',
                      '',
                    ].map(
                      (
                        heading,
                        index,
                      ) => (
                        <th
                          key={`${heading}-${index}`}
                          className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map(
                    (user) => {
                      const primaryMembership =
                        user.memberships.find(
                          (
                            membership,
                          ) =>
                            membership.active,
                        );

                      return (
                        <tr
                          key={user.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-5 align-top">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="font-semibold text-slate-900 transition hover:text-blue-600"
                            >
                              {user.name ??
                                'Unnamed user'}
                            </Link>

                            <p className="mt-1 text-sm text-slate-500">
                              {user.email}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {user.phone ??
                              '—'}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <VerificationBadge
                              verified={Boolean(
                                user.emailVerified,
                              )}
                            />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <VerificationBadge
                              verified={Boolean(
                                user.phoneVerified,
                              )}
                            />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <StatusBadge
                              status={
                                user.status
                              }
                            />
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {user.platformRole ??
                              '—'}
                          </td>

                          <td className="px-5 py-5 align-top">
                            {primaryMembership ? (
                              <>
                                <Link
                                  href={`/admin/businesses/${primaryMembership.business.id}`}
                                  className="text-sm font-medium text-slate-900 transition hover:text-blue-600"
                                >
                                  {
                                    primaryMembership
                                      .business
                                      .name
                                  }
                                </Link>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    primaryMembership.role
                                  }
                                  {' · '}
                                  {
                                    primaryMembership
                                      .business
                                      .countryCode
                                  }
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No workspace
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-500">
                            {formatDate(
                              user.createdAt,
                            )}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {users.map(
              (user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-semibold text-slate-950 transition hover:text-blue-600"
                      >
                        {user.name ??
                          'Unnamed user'}
                      </Link>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        user.status
                      }
                    />
                  </div>

                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Phone
                      </dt>

                      <dd className="mt-1 font-medium text-slate-800">
                        {user.phone ??
                          '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Platform role
                      </dt>

                      <dd className="mt-1 font-medium text-slate-800">
                        {user.platformRole ??
                          '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Email verification
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
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Phone verification
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

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                      Created{' '}
                      {formatDate(
                        user.createdAt,
                      )}
                    </p>

                    {user.memberships.length >
                      0 && (
                      <div className="mt-3 space-y-2">
                        {user.memberships.map(
                          (
                            membership,
                          ) => (
                            <Link
                              key={
                                membership.id
                              }
                              href={`/admin/businesses/${membership.business.id}`}
                              className="block rounded-xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                            >
                              <p className="text-sm font-medium text-slate-800">
                                {
                                  membership
                                    .business
                                    .name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  membership.role
                                }
                                {' · '}
                                {
                                  membership
                                    .business
                                    .countryCode
                                }
                              </p>
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/users/${user.id}`}
                    className="mt-5 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    View user
                  </Link>
                </article>
              ),
            )}
          </section>
        </>
      )}
    </div>
  );
}