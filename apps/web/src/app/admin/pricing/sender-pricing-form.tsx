"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export function SenderPricingForm() {
  const router =
    useRouter();

  const [
    provider,
    setProvider,
  ] = useState(
    "infobip",
  );

  const [
    countryCode,
    setCountryCode,
  ] = useState(
    "GH",
  );

  const [
    channel,
    setChannel,
  ] = useState(
    "SMS",
  );

  const [
    senderType,
    setSenderType,
  ] = useState(
    "DEDICATED",
  );

  const [
    providerCost,
    setProviderCost,
  ] = useState(
    "5",
  );

  const [
    providerCostCurrency,
    setProviderCostCurrency,
  ] = useState(
    "EUR",
  );

  const [
    retailPrice,
    setRetailPrice,
  ] = useState("");

  const [
    currency,
    setCurrency,
  ] = useState(
    "GHS",
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

  async function submit(
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
          "/api/admin/pricing/sender-registrations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                provider,

                countryCode:
                  countryCode
                    .trim()
                    .toUpperCase(),

                channel,

                senderType,

                providerCost:
                  Number(
                    providerCost,
                  ),

                providerCostCurrency:
                  providerCostCurrency
                    .trim()
                    .toUpperCase(),

                retailPrice:
                  Number(
                    retailPrice,
                  ),

                currency:
                  currency
                    .trim()
                    .toUpperCase(),
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
            "Unable to create pricing",
        );
      }

      setSuccess(
        "Sender registration pricing created.",
      );

      setRetailPrice("");

      router.refresh();
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create pricing",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Add sender registration pricing
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure provider cost
          and the customer-facing
          registration fee.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Provider
          </span>

          <input
            value={
              provider
            }
            onChange={(
              event,
            ) =>
              setProvider(
                event.target
                  .value,
              )
            }
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Country
          </span>

          <select
            value={
              countryCode
            }
            onChange={(
              event,
            ) => {
              const next =
                event.target
                  .value;

              setCountryCode(
                next,
              );

              setCurrency(
                next ===
                  "NG"
                  ? "NGN"
                  : "GHS",
              );
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="GH">
              Ghana
            </option>

            <option value="NG">
              Nigeria
            </option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Channel
          </span>

          <select
            value={
              channel
            }
            onChange={(
              event,
            ) =>
              setChannel(
                event.target
                  .value,
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="SMS">
              SMS
            </option>

            <option value="WHATSAPP">
              WhatsApp
            </option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Sender type
          </span>

          <select
            value={
              senderType
            }
            onChange={(
              event,
            ) =>
              setSenderType(
                event.target
                  .value,
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="DEDICATED">
              Dedicated
            </option>

            <option value="SHARED">
              Shared
            </option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Provider cost
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              providerCost
            }
            onChange={(
              event,
            ) =>
              setProviderCost(
                event.target
                  .value,
              )
            }
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Provider currency
          </span>

          <input
            value={
              providerCostCurrency
            }
            maxLength={
              3
            }
            onChange={(
              event,
            ) =>
              setProviderCostCurrency(
                event.target
                  .value
                  .toUpperCase(),
              )
            }
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Customer price
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              retailPrice
            }
            onChange={(
              event,
            ) =>
              setRetailPrice(
                event.target
                  .value,
              )
            }
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Customer currency
          </span>

          <input
            value={
              currency
            }
            maxLength={
              3
            }
            onChange={(
              event,
            ) =>
              setCurrency(
                event.target
                  .value
                  .toUpperCase(),
              )
            }
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase"
          />
        </label>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            saving
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Create pricing"}
        </button>
      </div>
    </form>
  );
}