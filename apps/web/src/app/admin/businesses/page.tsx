import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';

type AdminBusiness = {
  id: string;
  name: string;

  status:
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'RESTRICTED';

  countryCode: string;

  website: string | null;
  email: string | null;
  phone: string | null;

  createdAt: string;
  updatedAt: string;

  wallet: {
    id: string;
    currency: string;
    balance: string;
  } | null;

  _count: {
    memberships: number;
    messages: number;
    senderIdentities: number;
    apiKeys: number;
  };
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      dateStyle: 'medium',
    },
  ).format(
    new Date(value),
  );
}

function formatBalance(
  balance: string,
  currency: string,
) {
  const numeric =
    Number(balance);

  if (
    Number.isNaN(numeric)
  ) {
    return `${balance} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency}`;
  }
}

function StatusBadge({
  status,
}: {
  status: AdminBusiness['status'];
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

export default async function AdminBusinessesPage() {
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
      `${apiBaseUrl}/admin/businesses`,
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
            Business administration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Businesses
          </h1>
        </section>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load businesses
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

  const businesses =
    (await response.json()) as AdminBusiness[];

  const activeBusinesses =
    businesses.filter(
      (business) =>
        business.status ===
        'ACTIVE',
    ).length;

  const totalMembers =
    businesses.reduce(
      (total, business) =>
        total +
        business._count.memberships,
      0,
    );

  const totalMessages =
    businesses.reduce(
      (total, business) =>
        total +
        business._count.messages,
      0,
    );

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Business administration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Businesses
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Review registered organizations,
            account status, contact information,
            wallet balances and platform activity.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          {businesses.length}{' '}
          {businesses.length === 1
            ? 'business'
            : 'businesses'}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total businesses
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {businesses.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Active businesses
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {activeBusinesses}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total members
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {totalMembers}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Messages processed
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {totalMessages}
          </p>
        </article>
      </section>

      {businesses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-slate-800">
            No businesses found
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Registered customer businesses will
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
                      'Business',
                      'Contact',
                      'Status',
                      'Wallet',
                      'Members',
                      'Messages',
                      'Senders',
                      'API keys',
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
                  {businesses.map(
                    (business) => (
                      <tr
                        key={
                          business.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-5 align-top">
                          <p className="font-semibold text-slate-900">
                            {
                              business.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              business.countryCode
                            }
                          </p>

                          {business.website && (
                            <p className="mt-1 max-w-48 truncate text-xs text-blue-600">
                              {
                                business.website
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="text-sm text-slate-700">
                            {
                              business.email ??
                              '—'
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              business.phone ??
                              '—'
                            }
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge
                            status={
                              business.status
                            }
                          />
                        </td>

                        <td className="px-5 py-5 align-top text-sm font-medium text-slate-800">
                          {business.wallet
                            ? formatBalance(
                                business
                                  .wallet
                                  .balance,
                                business
                                  .wallet
                                  .currency,
                              )
                            : '—'}
                        </td>

                        <td className="px-5 py-5 align-top text-sm text-slate-700">
                          {
                            business
                              ._count
                              .memberships
                          }
                        </td>

                        <td className="px-5 py-5 align-top text-sm text-slate-700">
                          {
                            business
                              ._count
                              .messages
                          }
                        </td>

                        <td className="px-5 py-5 align-top text-sm text-slate-700">
                          {
                            business
                              ._count
                              .senderIdentities
                          }
                        </td>

                        <td className="px-5 py-5 align-top text-sm text-slate-700">
                          {
                            business
                              ._count
                              .apiKeys
                          }
                        </td>

                        <td className="px-5 py-5 align-top text-sm text-slate-500">
                          {formatDate(
                            business.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <Link
                            href={`/admin/businesses/${business.id}`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {businesses.map(
              (business) => (
                <article
                  key={
                    business.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {
                          business.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          business.countryCode
                        }
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        business.status
                      }
                    />
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Email
                      </dt>

                      <dd className="mt-1 break-all text-sm font-medium text-slate-800">
                        {
                          business.email ??
                          '—'
                        }
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Phone
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {
                          business.phone ??
                          '—'
                        }
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Wallet
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {business.wallet
                          ? formatBalance(
                              business
                                .wallet
                                .balance,
                              business
                                .wallet
                                .currency,
                            )
                          : '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">
                        Created
                      </dt>

                      <dd className="mt-1 text-sm font-medium text-slate-800">
                        {formatDate(
                          business.createdAt,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                    <div>
                      <p className="text-lg font-semibold">
                        {
                          business
                            ._count
                            .memberships
                        }
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Members
                      </p>
                    </div>

                    <div>
                      <p className="text-lg font-semibold">
                        {
                          business
                            ._count
                            .messages
                        }
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Messages
                      </p>
                    </div>

                    <div>
                      <p className="text-lg font-semibold">
                        {
                          business
                            ._count
                            .senderIdentities
                        }
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Senders
                      </p>
                    </div>

                    <div>
                      <p className="text-lg font-semibold">
                        {
                          business
                            ._count
                            .apiKeys
                        }
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Keys
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/businesses/${business.id}`}
                    className="mt-5 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View business
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