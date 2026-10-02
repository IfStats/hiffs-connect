"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  pricingId: string;
  providerCost: string;
  providerCostCurrency: string;
  retailPrice: string;
  currency: string;
};

export function ReplacePricingForm({
  pricingId,
  providerCost: initialProviderCost,
  providerCostCurrency:
    initialProviderCostCurrency,
  retailPrice: initialRetailPrice,
  currency: initialCurrency,
}: Props) {
  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    providerCost,
    setProviderCost,
  ] = useState(
    initialProviderCost,
  );

  const [
    providerCostCurrency,
    setProviderCostCurrency,
  ] = useState(
    initialProviderCostCurrency,
  );

  const [
    retailPrice,
    setRetailPrice,
  ] = useState(
    initialRetailPrice,
  );

  const [
    currency,
    setCurrency,
  ] = useState(
    initialCurrency,
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

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/pricing/sender-registrations/${encodeURIComponent(
            pricingId,
          )}/replace`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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
        throw new Error(
          Array.isArray(
            body?.message,
          )
            ? body.message.join(
                ", ",
              )
            : body?.message ||
                "Unable to replace pricing",
        );
      }

      setOpen(false);

      router.refresh();
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to replace pricing",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        Replace
      </button>
    );
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="min-w-[260px] space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
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
          className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
          placeholder="Provider cost"
          required
        />

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
          className="h-9 rounded-lg border border-slate-200 px-2 text-xs uppercase"
          required
        />

        <input
          type="number"
          step="0.01"
          min="0"
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
          className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
          placeholder="Retail price"
          required
        />

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
          className="h-9 rounded-lg border border-slate-200 px-2 text-xs uppercase"
          required
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={
            saving
          }
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save replacement"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}