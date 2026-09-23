import Link from "next/link";

const apiKeys = [
  {
    id: "placeholder",
    name: "Production API",
    prefix: "hiffs_••••••••",
    lastFour: "••••",
    status: "ACTIVE",
    lastUsed: "Never",
    created: "—",
  },
];

export default function DevelopersPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Developers
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            API access
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage credentials and developer access for integrating Hiffs
            Connect with your applications and business systems.
          </p>
        </div>

        <Link
          href="/dashboard/developers/api-keys/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Create API key
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Active keys", "1"],
          ["Requests today", "0"],
          ["Last API activity", "—"],
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
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              API keys
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Credentials used to authenticate requests to the Hiffs Connect
              API.
            </p>
          </div>

          <Link
            href="/dashboard/developers/docs"
            className="text-sm font-medium text-blue-600"
          >
            API documentation →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Key</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Last used</th>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium" />
              </tr>
            </thead>

            <tbody>
              {apiKeys.map((key) => (
                <tr
                  key={key.id}
                  className="border-t border-slate-100"
                >
                  <td className="px-5 py-5 font-medium">
                    {key.name}
                  </td>

                  <td className="px-5 py-5 font-mono text-xs text-slate-500">
                    {key.prefix}.{key.lastFour}
                  </td>

                  <td className="px-5 py-5">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {key.status}
                    </span>
                  </td>

                  <td className="px-5 py-5 text-slate-500">
                    {key.lastUsed}
                  </td>

                  <td className="px-5 py-5 text-slate-500">
                    {key.created}
                  </td>

                  <td className="px-5 py-5 text-right">
                    <button
                      type="button"
                      disabled
                      className="text-sm font-medium text-red-600 disabled:opacity-40"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-950">
          Keep API keys private
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800">
          API keys should only be used from trusted server environments. Do
          not expose them in browser-side JavaScript, mobile applications or
          public repositories.
        </p>
      </section>
    </div>
  );
}