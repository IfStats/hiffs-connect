import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

import {
  NewCampaignForm,
} from "./new-campaign-form";

type SenderRegistration = {
  id: string;
  channel: string;
  senderValue: string;
  status: string;
};

export default async function NewCampaignPage() {
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

        cache:
          "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load approved senders",
    );
  }

  const registrations =
    (await response.json()) as SenderRegistration[];

  const senders =
    registrations.filter(
      (sender) =>
        sender.channel ===
          "SMS" &&
        sender.status ===
          "APPROVED",
    );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/dashboard/campaigns"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Campaigns
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Bulk messaging
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          New campaign
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Create an SMS campaign
          using an approved sender
          identity and one or more
          international recipients.
        </p>
      </section>

      <NewCampaignForm
        businessId={businessId}
        accessToken={accessToken}
        senders={senders}
      />
    </div>
  );
}