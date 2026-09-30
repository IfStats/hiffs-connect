import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import {
  SendSmsForm,
} from "./components/send-sms-form";

type SenderRegistration = {
  id: string;
  channel: string;
  senderValue: string;
  countryCode: string;
  destinationCountry:
    | string
    | null;
  status: string;
};

type Wallet = {
  currency: string;
  balance: string | number;
  smsUnits: number;
};

type MessageTemplate = {
  id: string;
  name: string;
  channel: string;
  content: string;
  variables: string[];
  status: string;
};

export default async function SendMessagePage() {
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

 const [
  sendersResponse,
  walletResponse,
  templatesResponse,
] = await Promise.all([
  fetch(
    `${apiUrl}/sender-registrations/business/${businessId}`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  ),

  fetch(
    `${apiUrl}/wallets/${businessId}`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  ),

  fetch(
    `${apiUrl}/businesses/${businessId}/templates?status=ACTIVE`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  ),
]);

if (
  !sendersResponse.ok ||
  !walletResponse.ok  ||
  !templatesResponse.ok 
) {
  throw new Error(
    "Unable to load messaging account",
  );
}

const templates =
  (
    (await templatesResponse.json()) as
      MessageTemplate[]
  ).filter(
    (template) =>
      template.channel === "SMS" &&
      template.status === "ACTIVE",
  );

const registrations =
  (await sendersResponse.json()) as SenderRegistration[];

const wallet =
  (await walletResponse.json()) as Wallet;
  const senders =
    registrations
      .filter(
        (registration) =>
          registration.channel ===
            "SMS" &&
          registration.status ===
            "APPROVED",
      )
      .map(
        (registration) => ({
          id:
            registration.id,

          senderValue:
            registration.senderValue,

          countryCode:
            registration.countryCode,

          destinationCountry:
            registration.destinationCountry,
        }),
      );

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
          Send a transactional SMS
          through an approved Hiffs
          Connect sender identity.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <SendSmsForm
            businessId={
              businessId
            }
            accessToken={
              accessToken
            }
            senders={senders}
            templates={templates}
            smsUnits={wallet.smsUnits}
          />
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
                  Approved senders
                </dt>

                <dd className="font-medium">
                  {senders.length}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
  <p className="text-sm font-semibold text-blue-950">
    SMS units
  </p>

  <p className="mt-3 text-3xl font-semibold text-blue-950">
    {wallet.smsUnits.toLocaleString()}
  </p>

  <p className="mt-1 text-sm text-blue-800">
    Available units
  </p>

  <p className="mt-4 text-sm leading-6 text-blue-800">
    Each billable SMS page
    consumes one SMS unit.
    Longer or Unicode messages
    may consume multiple units.
  </p>
</article>
        </aside>
      </div>
    </div>
  );
}