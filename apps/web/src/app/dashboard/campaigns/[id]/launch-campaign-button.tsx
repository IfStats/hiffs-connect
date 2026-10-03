"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  businessId: string;
  campaignId: string;
  accessToken: string;
};

export function LaunchCampaignButton({
  businessId,
  campaignId,
  accessToken,
}: Props) {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  async function launchCampaign() {
    const apiUrl =
      process.env
        .NEXT_PUBLIC_HIFFS_API_URL;

    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/campaigns/business/${businessId}/${campaignId}/launch`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            result?.message,
          )
            ? result.message.join(
                ", ",
              )
            : result?.message ??
                "Unable to launch campaign.",
        );
      }

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to launch campaign.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={
          launchCampaign
        }
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Launching..."
          : "Launch campaign"}
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}