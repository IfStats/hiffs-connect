import Link from "next/link";

import {
  getServerSession,
} from "next-auth";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

import {
  SenderReviewControls,
} from "./sender-review-controls";

type SenderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type SenderRegistration = {
  id: string;

  channel: string;
  senderType: string;
  senderValue: string;

  countryCode: string;

  destinationCountry:
    | string
    | null;

  provider:
    | string
    | null;

  providerReference:
    | string
    | null;

  status: SenderStatus;

  useCase:
    | string
    | null;

  estimatedMonthlyVolume:
    | number
    | null;

  rejectionReason:
    | string
    | null;

  submittedAt:
    | string
    | null;

  approvedAt:
    | string
    | null;

  rejectedAt:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  business: {
    id: string;
    name: string;
    countryCode: string;
    email:
      | string
      | null;
    phone:
      | string
      | null;
    website:
      | string
      | null;
  };
};

function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function StatusBadge({
  status,
}: {
  status: SenderStatus;
}) {
  const classes =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "REJECTED" ||
          status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : status === "SUBMITTED" ||
            status === "PENDING"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

export default async function AdminSenderPage({
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
    redirect("/login");
  }

  if (
    session.user.platformRole !==
    "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const accessToken =
    session.user.accessToken;

  if (!accessToken) {
    redirect("/login");
  }

  const {
    id,
  } = await params;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/${encodeURIComponent(
        id,
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  if (
    response.status ===
    404
  ) {
    notFound();
  }

  if (!response.ok) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/senders"
          className="text-sm font-semibold text-blue-600"
        >
          ← Sender IDs
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load Sender ID
          </p>

          <p className="mt-2 text-sm text-red-700">
            The administration API
            returned an error while
            loading this registration.
          </p>
        </div>
      </div>
    );
  }

  const sender =
    (await response.json()) as SenderRegistration;

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/senders"
          className="text-sm font-semibold text-blue-600"
        >
          ← Sender IDs
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {
                  sender.senderValue
                }
              </h1>

              <StatusBadge
                status={
                  sender.status
                }
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {
                sender.business.name
              }
              {" · "}
              {
                sender.channel
              }
              {" · "}
              {
                sender.senderType
              }
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Sender ID:{" "}
              <span className="font-mono">
                {
                  sender.id
                }
              </span>
            </p>
          </div>

          <Link
            href={`/admin/businesses/${sender.business.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
          >
            View business
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Status
          </p>

          <div className="mt-4">
            <StatusBadge
              status={
                sender.status
              }
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Origin
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {
              sender.countryCode
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Destination
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {
              sender.destinationCountry ??
              "Any"
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Monthly volume
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {sender.estimatedMonthlyVolume?.toLocaleString() ??
              "—"}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Registration details
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sender ID
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  sender.senderValue
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Use case
              </dt>

              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {
                  sender.useCase ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submitted
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.submittedAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approved
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.approvedAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rejected
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.rejectedAt,
                )}
              </dd>
            </div>

            {sender.rejectionReason && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Rejection reason
                </dt>

                <dd className="mt-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {
                    sender.rejectionReason
                  }
                </dd>
              </div>
            )}
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Business
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Name
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  sender.business.name
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Country
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {
                  sender.business.countryCode
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </dt>

              <dd className="mt-1 break-all text-sm text-slate-700">
                {
                  sender.business.email ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {
                  sender.business.phone ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Website
              </dt>

              <dd className="mt-1 break-all text-sm text-slate-700">
                {
                  sender.business.website ??
                  "—"
                }
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Review controls
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Manage the approval
            lifecycle for this Sender
            ID.
          </p>
        </div>

        <div className="mt-6">
          <SenderReviewControls
            senderId={
              sender.id
            }
            currentStatus={
              sender.status
            }
            currentProviderReference={
              sender.providerReference
            }
          />
        </div>
      </section>
    </div>
  );
}