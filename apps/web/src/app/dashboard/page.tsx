const metrics = [
  {
    label: "Messages sent",
    value: "0",
    detail: "Current billing period",
  },
  {
    label: "Delivery rate",
    value: "—",
    detail: "No delivery data yet",
  },
  {
    label: "Active senders",
    value: "0",
    detail: "Approved sender identities",
  },
  {
    label: "Wallet balance",
    value: "—",
    detail: "Available messaging balance",
  },
];

const quickActions = [
  ["Send message", "/dashboard/messages"],
  ["Create campaign", "/dashboard/campaigns"],
  ["Add contacts", "/dashboard/contacts"],
  ["Manage sender IDs", "/dashboard/senders"],
];

import Link from "next/link";

export default function DashboardPage() {
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
          Monitor messaging activity, manage your communication infrastructure
          and access the tools required to operate Hiffs Connect.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {metric.value}
            </p>

            <p className="mt-3 text-xs text-slate-400">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Recent messaging activity
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Delivery activity will appear here as messages are processed.
              </p>
            </div>

            <Link
              href="/dashboard/reports"
              className="text-sm font-medium text-blue-600"
            >
              View reports
            </Link>
          </div>

          <div className="mt-10 rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No activity yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Send your first message to begin generating delivery data.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold">
            Quick actions
          </p>

          <div className="mt-5 space-y-3">
            {quickActions.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-sm font-medium transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{label}</span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}