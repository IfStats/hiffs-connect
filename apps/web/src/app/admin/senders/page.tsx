import Link from "next/link";

import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

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

  business: {
    id: string;
    name: string;
    countryCode: string;
  };
};

function formatDate(
  value: string | null,
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

export default async function AdminSendersPage() {
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

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/admin/senders`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load sender registrations",
    );
  }

  const senders =
    (await response.json()) as SenderRegistration[];

  const submitted =
    senders.filter(
      (sender) =>
        sender.status ===
        "SUBMITTED",
    ).length;

  const pending =
    senders.filter(
      (sender) =>
        sender.status ===
        "PENDING",
    ).length;

  const approved =
    senders.filter(
      (sender) =>
        sender.status ===
        "APPROVED",
    ).length;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Messaging compliance
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Sender IDs
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Review customer sender ID
          registrations and manage their
          approval lifecycle.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {senders.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Submitted
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {submitted}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            In review
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {pending}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {approved}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {senders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            No sender registrations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Sender
                  </th>

                  <th className="px-6 py-4">
                    Business
                  </th>

                  <th className="px-6 py-4">
                    Route
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Volume
                  </th>

                  <th className="px-6 py-4">
                    Submitted
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {senders.map(
                  (sender) => (
                    <tr
                      key={
                        sender.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {
                            sender.senderValue
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            sender.channel
                          }
                          {" · "}
                          {
                            sender.senderType
                          }
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/businesses/${sender.business.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {
                            sender.business.name
                          }
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            sender.business.countryCode
                          }
                        </p>
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          sender.countryCode
                        }

                        {sender.destinationCountry
                          ? ` → ${sender.destinationCountry}`
                          : ""}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={
                            sender.status
                          }
                        />
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {sender.estimatedMonthlyVolume?.toLocaleString() ??
                          "—"}
                      </td>

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          sender.submittedAt,
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/senders/${sender.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}