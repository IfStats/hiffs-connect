import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/dashboard/developers"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Developer access
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          API documentation
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Hiffs Connect API
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Integrate messaging capabilities into your applications using the
          Hiffs Connect REST API.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Authentication
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Authenticate server-side requests using your API key in the
          X-API-Key request header.
        </p>

        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm text-slate-100">
{`X-API-Key: hiffs_xxxxxxxx.your-secret`}
        </pre>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
          POST
        </p>

        <h2 className="mt-2 text-lg font-semibold">
          /messaging/sms
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Send an SMS using an approved sender registration.
        </p>

        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm text-slate-100">
{`{
  "to": "+233XXXXXXXXX",
  "text": "Your message",
  "sender": "HIFFS",
  "senderRegistrationId": "sender-registration-id"
}`}
        </pre>
      </section>
    </div>
  );
}