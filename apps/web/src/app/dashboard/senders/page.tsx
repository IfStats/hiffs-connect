import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import {
  redirect,
} from "next/navigation";

import { authOptions } from "@/auth";

type SenderRegistration = {
  id: string;
  channel: string;
  senderType: string;
  senderValue: string;
  countryCode: string;
  destinationCountry:
    | string
    | null;

  status:
    | "DRAFT"
    | "SUBMITTED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED";

  useCase: string | null;

  estimatedMonthlyVolume:
    | number
    | null;

  rejectionReason:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

function StatusBadge({
  status,
}: {
  status: SenderRegistration["status"];
}) {
  const classes =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "REJECTED" ||
          status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : status === "PENDING" ||
            status === "SUBMITTED"
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

export default async function SendersPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
    redirect("/login");
  }

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    redirect("/dashboard");
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/business/${businessId}`,
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

  const approved =
    senders.filter(
      (sender) =>
        sender.status ===
        "APPROVED",
    ).length;

  const pending =
    senders.filter(
      (sender) =>
        sender.status ===
          "SUBMITTED" ||
        sender.status ===
          "PENDING",
    ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Sender ID management
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Sender IDs
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Register and manage sender
            identities used for business
            messaging.
          </p>
        </div>

        <Link
          href="/dashboard/senders/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Register sender ID
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total senders
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {senders.length}
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

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Awaiting review
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {pending}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {senders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">
              No sender IDs yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Register your first sender
              identity before sending SMS.
            </p>

            <Link
              href="/dashboard/senders/new"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Register sender ID
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Sender
                  </th>

                  <th className="px-6 py-4">
                    Channel
                  </th>

                  <th className="px-6 py-4">
                    Country
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Created
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

                        {sender.rejectionReason && (
                          <p className="mt-1 max-w-xs text-xs text-red-600">
                            {
                              sender.rejectionReason
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          sender.channel
                        }
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          sender.countryCode
                        }

                        {sender.destinationCountry
                          ? ` → ${sender.destinationCountry}`
                          : ""}
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          sender.senderType
                        }
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={
                            sender.status
                          }
                        />
                      </td>

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          sender.createdAt,
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/dashboard/senders/${sender.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
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
        )}
      </section>
    </div>
  );
}