"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export function DeactivatePricingButton({
  pricingId,
}: {
  pricingId: string;
}) {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function deactivate() {
    const confirmed =
      window.confirm(
        "Deactivate this sender registration price?",
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `/api/admin/pricing/sender-registrations/${encodeURIComponent(
            pricingId,
          )}/deactivate`,
          {
            method:
              "PATCH",
          },
        );

      const body =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.message ??
            "Unable to deactivate pricing",
        );
      }

      router.refresh();
    } catch (
      caught
    ) {
      window.alert(
        caught instanceof Error
          ? caught.message
          : "Unable to deactivate pricing",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={
        loading
      }
      onClick={
        deactivate
      }
      className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading
        ? "Deactivating..."
        : "Deactivate"}
    </button>
  );
}