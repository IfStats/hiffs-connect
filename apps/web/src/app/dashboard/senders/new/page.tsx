import Link from "next/link";

export default function NewSenderPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <Link
          href="/dashboard/senders"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Sender identities
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Sender registration
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Register sender identity
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Submit a sender identity for review and provider registration before
          it can be used for message delivery.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <form className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="channel"
                className="mb-2 block text-sm font-medium"
              >
                Channel
              </label>

              <select
                id="channel"
                name="channel"
                defaultValue="SMS"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
              >
                <option value="SMS">
                  SMS
                </option>

                <option value="WHATSAPP">
                  WhatsApp
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="senderType"
                className="mb-2 block text-sm font-medium"
              >
                Sender type
              </label>

              <select
                id="senderType"
                name="senderType"
                defaultValue="DEDICATED"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
              >
                <option value="DEDICATED">
                  Dedicated
                </option>

                <option value="SHARED">
                  Shared
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="senderValue"
              className="mb-2 block text-sm font-medium"
            >
              Sender name / identity
            </label>

            <input
              id="senderValue"
              name="senderValue"
              type="text"
              placeholder="Example: HIFFS"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs text-slate-500">
              The final allowed format depends on country and provider rules.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="countryCode"
                className="mb-2 block text-sm font-medium"
              >
                Origin country
              </label>

              <input
                id="countryCode"
                name="countryCode"
                type="text"
                placeholder="GH"
                maxLength={2}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="destinationCountry"
                className="mb-2 block text-sm font-medium"
              >
                Destination country
              </label>

              <input
                id="destinationCountry"
                name="destinationCountry"
                type="text"
                placeholder="GH"
                maxLength={2}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="useCase"
              className="mb-2 block text-sm font-medium"
            >
              Messaging use case
            </label>

            <textarea
              id="useCase"
              name="useCase"
              rows={5}
              placeholder="Describe the type of messages your business intends to send."
              className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="estimatedMonthlyVolume"
              className="mb-2 block text-sm font-medium"
            >
              Estimated monthly volume
            </label>

            <input
              id="estimatedMonthlyVolume"
              name="estimatedMonthlyVolume"
              type="number"
              min="0"
              placeholder="10000"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Registration required
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Sender identities must be reviewed and approved before they are
              eligible for message routing.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/senders"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit registration
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}