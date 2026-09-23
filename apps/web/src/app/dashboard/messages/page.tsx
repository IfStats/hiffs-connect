import Link from "next/link";

const recentMessages = [
  {
    id: "—",
    recipient: "No messages yet",
    sender: "—",
    channel: "SMS",
    status: "—",
    time: "—",
  },
];

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Messaging
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Messages
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Send business messages, monitor delivery activity and review
            communication history from one workspace.
          </p>
        </div>

        <Link
          href="/dashboard/messages/send"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Send message
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total messages", "0"],
          ["Delivered", "0"],
          ["Pending", "0"],
          ["Failed", "0"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Message history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent SMS and messaging activity.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              All channels
            </button>

            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              All statuses
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Recipient</th>
                <th className="px-5 py-4 font-medium">Sender</th>
                <th className="px-5 py-4 font-medium">Channel</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Time</th>
                <th className="px-5 py-4 font-medium" />
              </tr>
            </thead>

            <tbody>
              {recentMessages.map((message) => (
                <tr
                  key={`${message.id}-${message.recipient}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-5 py-5 font-medium">
                    {message.recipient}
                  </td>

                  <td className="px-5 py-5 text-slate-500">
                    {message.sender}
                  </td>

                  <td className="px-5 py-5">
                    {message.channel}
                  </td>

                  <td className="px-5 py-5 text-slate-500">
                    {message.status}
                  </td>

                  <td className="px-5 py-5 text-slate-500">
                    {message.time}
                  </td>

                  <td className="px-5 py-5 text-right">
                    <span className="text-slate-400">
                      →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}