import Link from 'next/link';
import { getServerSession } from 'next-auth';
import {
  notFound,
  redirect,
} from 'next/navigation';

import { authOptions } from '@/auth';

type BusinessStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'RESTRICTED';

type BusinessMember = {
  id: string;
  role: string;
  active: boolean;
  createdAt: string;

  user: {
    id: string;
    email: string;
    phone: string | null;
    name: string | null;

    platformRole: string | null;

    emailVerified:
      | string
      | null;

    phoneVerified:
      | string
      | null;
  };
};

type AdminBusiness = {
  id: string;
  name: string;
  status: BusinessStatus;

  countryCode: string;

  website: string | null;
  email: string | null;
  phone: string | null;

  createdAt: string;
  updatedAt: string;

  wallet: {
    id: string;
    currency: string;
    balance:
      | string
      | number;

    updatedAt: string;
  } | null;

  memberships: BusinessMember[];

  _count: {
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
      timeStyle: 'short',
    },
  ).format(
    new Date(value),
  );
}

function formatBalance(
  balance:
    | string
    | number,
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
    return `${numeric.toFixed(
      2,
    )} ${currency}`;
  }
}

function StatusBadge({
  status,
}: {
  status: BusinessStatus;
}) {
  const classes =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700'
      : status ===
          'SUSPENDED'
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

export default async function AdminBusinessPage({
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
    session.user
      .platformRole !==
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
      `${apiBaseUrl}/admin/businesses/${encodeURIComponent(
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
          href="/admin/businesses"
          className="text-sm font-semibold text-blue-600"
        >
          ← Back to businesses
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load
            business
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            The administration
            API returned an error
            while loading this
            business.
          </p>
        </div>
      </div>
    );
  }

  const business =
    (await response.json()) as AdminBusiness;

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/businesses"
          className="text-sm font-semibold text-blue-600"
        >
          ← Businesses
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {
                  business.name
                }
              </h1>

              <StatusBadge
                status={
                  business.status
                }
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Business ID:{' '}
              <span className="font-mono">
                {
                  business.id
                }
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Country
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {
                business.countryCode
              }
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Wallet balance
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight">
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
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Available messaging
            balance
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Members
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {
              business
                .memberships
                .length
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Messages
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {
              business._count
                .messages
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Sender identities
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {
              business._count
                .senderIdentities
            }
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Business profile
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Business email
              </dt>

              <dd className="mt-1 break-all text-sm font-medium text-slate-800">
                {business.email ??
                  '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Business phone
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {business.phone ??
                  '—'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Website
              </dt>

              <dd className="mt-1">
                {business.website ? (
                  <a
                    href={
                      business.website
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {
                      business.website
                    }
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">
                    —
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Created
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(
                  business.createdAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last updated
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(
                  business.updatedAt,
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Platform resources
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                API keys
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  business._count
                    .apiKeys
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Senders
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  business._count
                    .senderIdentities
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Messages
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  business._count
                    .messages
                }
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Members
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  business
                    .memberships
                    .length
                }
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Business members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Users with active
            membership in this
            workspace.
          </p>
        </div>

        {business.memberships
          .length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No active members.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {business.memberships.map(
              (membership) => (
                <div
                  key={
                    membership.id
                  }
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr]"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {membership
                        .user
                        .name ??
                        'Unnamed user'}
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      {
                        membership
                          .user
                          .email
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {membership
                        .user
                        .phone ??
                        'No phone'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Verification
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <VerificationBadge
                        verified={Boolean(
                          membership
                            .user
                            .emailVerified,
                        )}
                      />

                      <VerificationBadge
                        verified={Boolean(
                          membership
                            .user
                            .phoneVerified,
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Business role
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {
                        membership.role
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Platform role
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {membership
                        .user
                        .platformRole ??
                        '—'}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Administrative actions
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Wallet adjustments,
          account suspension and
          other privileged actions
          will be added here with
          explicit confirmation and
          audit information.
        </p>
      </section>
    </div>
  );
}