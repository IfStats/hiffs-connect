import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

type Message = {
  id: string;
  recipient: string;
  sender: string;
  status: string;
  createdAt: string;
};

type SenderRegistration = {
  id: string;
  channel: string;
  status: string;
};

type Wallet = {
  balance: string | number;
  currency: string;
  smsUnits: number;
};

type SmsUnitTransaction = {
  id: string;
  type:
    | "ADMIN_CREDIT"
    | "ADMIN_DEBIT"
    | "MESSAGE_DEBIT"
    | "REFUND"
    | "ADJUSTMENT";
  status: string;
  units: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  reference: string | null;
  createdAt: string;

  message: {
    id: string;
    recipient: string;
    status: string;
    segmentCount: number | null;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const session =
    await getServerSession(authOptions);

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

  const headers = {
    Authorization:
      `Bearer ${accessToken}`,
  };

  const [
  messagesResponse,
  sendersResponse,
  walletResponse,
  smsUnitsResponse,
] = await Promise.all([
  fetch(
    `${apiUrl}/messaging/business/${businessId}/messages`,
    {
      headers,
      cache: "no-store",
    },
  ),

  fetch(
    `${apiUrl}/sender-registrations/business/${businessId}`,
    {
      headers,
      cache: "no-store",
    },
  ),

  fetch(
    `${apiUrl}/wallets/${businessId}`,
    {
      headers,
      cache: "no-store",
    },
  ),

  fetch(
    `${apiUrl}/wallets/${businessId}/sms-units/transactions`,
    {
      headers,
      cache: "no-store",
    },
  ),
]);

  if (
    !messagesResponse.ok ||
    !sendersResponse.ok ||
    !walletResponse.ok  ||
    !smsUnitsResponse.ok
  ) {
    throw new Error(
      "Unable to load dashboard data",
    );
  }

  const smsUnitTransactions =
  (await smsUnitsResponse.json()) as SmsUnitTransaction[];

const recentSmsUnitTransactions =
  smsUnitTransactions.slice(
    0,
    8,
  );

  const messages =
    (await messagesResponse.json()) as Message[];

  const senders =
    (await sendersResponse.json()) as SenderRegistration[];

  const wallet =
    (await walletResponse.json()) as Wallet;

  const delivered =
    messages.filter(
      (message) =>
        message.status === "DELIVERED",
    ).length;

  const activeSenders =
    senders.filter(
      (sender) =>
        sender.channel === "SMS" &&
        sender.status === "APPROVED",
    ).length;

  const deliveryRate =
    messages.length > 0
      ? (
          (delivered /
            messages.length) *
          100
        ).toFixed(1)
      : null;

  const recentMessages =
    messages.slice(0, 5);

  const metrics = [
    {
      label: "Recent messages",
      value:
        messages.length.toString(),
      detail:
        "Latest recorded messaging activity",
    },

    {
      label: "Delivery rate",
      value:
        deliveryRate !== null
          ? `${deliveryRate}%`
          : "—",
      detail:
        deliveryRate !== null
          ? `${delivered} delivered`
          : "No delivery data yet",
    },

    {
      label: "Active senders",
      value:
        activeSenders.toString(),
      detail:
        "Approved SMS sender identities",
    },

    {
  label: "SMS units",
  value:
    wallet.smsUnits.toLocaleString(),
  detail:
    "Available messaging units",
},
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Overview
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Messaging operations
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Monitor messaging activity,
          manage communication
          infrastructure and access
          the tools required to operate
          your workspace.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(
          (metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">
                {metric.label}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {metric.value}
              </p>

              <p className="mt-3 text-xs text-slate-400">
                {metric.detail}
              </p>
            </article>
          ),
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                Recent messaging activity
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Latest message delivery
                activity in your workspace.
              </p>
            </div>

            <Link
              href="/dashboard/messages"
              className="text-sm font-medium text-blue-600"
            >
              View messages
            </Link>
          </div>

          {recentMessages.length ===
          0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No activity yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Send your first
                message to begin
                generating delivery
                data.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {recentMessages.map(
                (message) => (
                  <div
                    key={message.id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {
                          message.recipient
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        From{" "}
                        {
                          message.sender
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                        {
                          message.status
                        }
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(
                          message.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold">
            Quick actions
          </p>

          <div className="mt-5 space-y-3">
            {[
              [
                "Send message",
                "/dashboard/messages/send",
              ],

              [
                "Add contact",
                "/dashboard/contacts/new",
              ],

              [
                "Manage contacts",
                "/dashboard/contacts",
              ],

              [
                "View reports",
                "/dashboard/reports",
              ],

              [
                "Manage sender IDs",
                "/dashboard/senders",
              ],
            ].map(
              ([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-sm font-medium transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>
                    {label}
                  </span>

                  <span>
                    →
                  </span>
                </Link>
              ),
            )}
          </div>
        </article>
      </section>
      
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
  <div className="border-b border-slate-200 px-6 py-5">
    <h2 className="font-semibold text-slate-950">
      SMS unit activity
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Recent credits, message usage
      and refunds.
    </p>
  </div>

  {recentSmsUnitTransactions.length ===
  0 ? (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      No SMS unit activity yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-4 font-medium">
              Activity
            </th>

            <th className="px-6 py-4 font-medium">
              Units
            </th>

            <th className="px-6 py-4 font-medium">
              Balance
            </th>

            <th className="px-6 py-4 font-medium">
              Details
            </th>

            <th className="px-6 py-4 font-medium">
              Time
            </th>
          </tr>
        </thead>

        <tbody>
          {recentSmsUnitTransactions.map(
            (transaction) => (
              <tr
                key={
                  transaction.id
                }
                className="border-t border-slate-100"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {transaction.type ===
                  "MESSAGE_DEBIT"
                    ? "SMS sent"
                    : transaction.type ===
                        "ADMIN_CREDIT"
                      ? "Units added"
                      : transaction.type ===
                          "ADMIN_DEBIT"
                        ? "Units deducted"
                        : transaction.type ===
                            "REFUND"
                          ? "Units refunded"
                          : "Adjustment"}
                </td>

                <td
                  className={`px-6 py-4 font-semibold ${
                    transaction.units >
                    0
                      ? "text-emerald-700"
                      : "text-slate-900"
                  }`}
                >
                  {transaction.units >
                  0
                    ? "+"
                    : ""}
                  {transaction.units.toLocaleString()}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {transaction.balanceAfter.toLocaleString()}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {transaction.message
                    ? `SMS to ${transaction.message.recipient}`
                    : transaction.description ??
                      "—"}
                </td>

                <td className="px-6 py-4 text-slate-500">
                  {formatDate(
                    transaction.createdAt,
                  )}
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