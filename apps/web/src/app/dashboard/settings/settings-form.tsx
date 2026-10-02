"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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

export function SettingsForm({
  initialAccount,
}: {
  initialAccount: BusinessAccount;
}) {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState(
    initialAccount.name,
  );

  const [
    email,
    setEmail,
  ] = useState(
    initialAccount.email ??
      "",
  );

  const [
    phone,
    setPhone,
  ] = useState(
    initialAccount.phone ??
      "",
  );

  const [
    website,
    setWebsite,
  ] = useState(
    initialAccount.website ??
      "",
  );

  const [
    billingCurrency,
    setBillingCurrency,
  ] = useState(
    initialAccount.billingCurrency,
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    success,
    setSuccess,
  ] = useState<
    string | null
  >(null);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response =
        await fetch(
          "/api/dashboard/settings",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                email:
                  email.trim() ||
                  undefined,

                phone:
                  phone.trim() ||
                  undefined,

                website:
                  website.trim() ||
                  undefined,

                billingCurrency,
              }),
          },
        );

      const body =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const message =
          Array.isArray(
            body?.message,
          )
            ? body.message.join(
                ", ",
              )
            : body?.message;

        throw new Error(
          message ||
            "Unable to update settings",
        );
      }

      setSuccess(
        "Settings updated successfully.",
      );

      router.refresh();
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update settings",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Business profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Information associated
            with your Hiffs Connect
            workspace.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Business name
            </span>

            <input
              value={
                name
              }
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Country
            </span>

            <input
              value={
                initialAccount.countryCode
              }
              disabled
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Business email
            </span>

            <input
              type="email"
              value={
                email
              }
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Phone
            </span>

            <input
              value={
                phone
              }
              onChange={(
                event,
              ) =>
                setPhone(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Website
            </span>

            <input
              type="url"
              placeholder="https://example.com"
              value={
                website
              }
              onChange={(
                event,
              ) =>
                setWebsite(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Billing preferences
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure the preferred
          billing currency for this
          workspace.
        </p>

        <div className="mt-6 max-w-sm">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Billing currency
            </span>

            <select
              value={
                billingCurrency
              }
              onChange={(
                event,
              ) =>
                setBillingCurrency(
                  event.target
                    .value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
            >
              <option value="GHS">
                GHS — Ghanaian Cedi
              </option>

              <option value="NGN">
                NGN — Nigerian Naira
              </option>

              <option value="USD">
                USD — US Dollar
              </option>

              <option value="EUR">
                EUR — Euro
              </option>

              <option value="GBP">
                GBP — British Pound
              </option>
            </select>
          </label>

          <p className="mt-3 text-xs leading-5 text-amber-700">
            Changing this preference
            does not convert the
            balance of an existing
            wallet.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            saving
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Save settings"}
        </button>
      </div>
    </form>
  );
}