import Link from "next/link";

export default function SendMessagePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/dashboard/messages"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Messages
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          New message
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Send SMS
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Compose and send a transactional SMS through your approved sender
          identity.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="sender"
                className="mb-2 block text-sm font-medium"
              >
                Sender
              </label>

              <select
                id="sender"
                name="senderRegistrationId"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
                defaultValue=""
              >
                <option value="" disabled>
                  Select approved sender
                </option>
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Only approved sender identities can be used for delivery.
              </p>
            </div>

            <div>
              <label
                htmlFor="recipient"
                className="mb-2 block text-sm font-medium"
              >
                Recipient
              </label>

              <input
                id="recipient"
                name="to"
                type="tel"
                placeholder="+233XXXXXXXXX"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use international E.164 format.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="message"
                  className="text-sm font-medium"
                >
                  Message
                </label>

                <span className="text-xs text-slate-400">
                  0 / 1600
                </span>
              </div>

              <textarea
                id="message"
                name="text"
                rows={8}
                maxLength={1600}
                placeholder="Enter your message..."
                className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/messages"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send message
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold">
              Delivery
            </p>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Channel
                </dt>
                <dd className="font-medium">
                  SMS
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Provider
                </dt>
                <dd className="font-medium">
                  Automatic routing
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Sender status
                </dt>
                <dd className="font-medium">
                  Required
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-950">
              Secure sending
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Message submission will be handled server-side so API
              credentials are never exposed to the browser.
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}