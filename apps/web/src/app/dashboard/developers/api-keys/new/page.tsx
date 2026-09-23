import Link from "next/link";

export default function NewApiKeyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <Link
          href="/dashboard/developers"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Developer access
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Credentials
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create API key
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Generate a new credential for server-to-server access to Hiffs
          Connect.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <form className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Key name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              minLength={2}
              maxLength={100}
              placeholder="Example: Production API"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs text-slate-500">
              Use a clear name that identifies the application or environment.
            </p>
          </div>

          <div>
            <label
              htmlFor="expiresAt"
              className="mb-2 block text-sm font-medium"
            >
              Expiration date
            </label>

            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs text-slate-500">
              Optional. Leave blank for a non-expiring key.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              The secret is shown once
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              When a key is created, the full secret will only be displayed
              once. Store it securely because Hiffs Connect does not retain the
              raw secret.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/developers"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create API key
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}