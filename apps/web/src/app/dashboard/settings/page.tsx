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
  SettingsForm,
} from "./settings-form";

type BusinessAccount = {
  id: string;
  name: string;
  countryCode: string;
  billingCurrency: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default async function SettingsPage() {
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
      `${apiUrl}/businesses/${encodeURIComponent(
        businessId,
      )}/account`,
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
      "Unable to load business settings",
    );
  }

  const account =
    (await response.json()) as BusinessAccount;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Settings
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Workspace settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Manage your business profile
          and billing preferences.
        </p>
      </section>

      <SettingsForm
        initialAccount={
          account
        }
      />
    </div>
  );
}