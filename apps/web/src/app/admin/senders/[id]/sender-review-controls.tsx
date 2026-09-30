"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type SenderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type Props = {
  senderId: string;
  currentStatus: SenderStatus;
  currentProviderReference:
    | string
    | null;
};

export function SenderReviewControls({
  senderId,
  currentStatus,
  currentProviderReference,
}: Props) {
  const router =
    useRouter();

  const [
    providerReference,
    setProviderReference,
  ] = useState(
    currentProviderReference ??
      "",
  );

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null,
    );

  async function changeStatus(
    status:
      | "DRAFT"
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "SUSPENDED",
  ) {
    setError(null);
    setSuccess(null);

    if (
      status ===
        "REJECTED" &&
      !rejectionReason.trim()
    ) {
      setError(
        "Enter a rejection reason.",
      );

      return;
    }

    if (
      status ===
        "APPROVED" &&
      !window.confirm(
        "Approve this Sender ID for message delivery?",
      )
    ) {
      return;
    }

    if (
      status ===
        "SUSPENDED" &&
      !window.confirm(
        "Suspend this approved Sender ID?",
      )
    ) {
      return;
    }

    setLoading(status);

    try {
      const response =
        await fetch(
          `/api/admin/senders/${encodeURIComponent(
            senderId,
          )}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,

                providerReference:
                  providerReference.trim() ||
                  undefined,

                rejectionReason:
                  status ===
                  "REJECTED"
                    ? rejectionReason.trim()
                    : undefined,
              }),
          },
        );

      const payload =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            "Unable to update Sender ID",
        );
      }

      setSuccess(
        `Sender ID updated to ${status}.`,
      );

      setRejectionReason("");

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to update Sender ID",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="provider-reference"
          className="text-sm font-medium text-slate-700"
        >
          Registration reference
        </label>

        <input
          id="provider-reference"
          value={
            providerReference
          }
          onChange={(event) =>
            setProviderReference(
              event.target.value,
            )
          }
          placeholder="Optional internal registration reference"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
        />

        <p className="mt-2 text-xs text-slate-500">
          Internal only. Customers
          do not see this value.
        </p>
      </div>

      {currentStatus ===
        "PENDING" && (
        <div>
          <label
            htmlFor="rejection-reason"
            className="text-sm font-medium text-slate-700"
          >
            Rejection reason
          </label>

          <textarea
            id="rejection-reason"
            rows={4}
            value={
              rejectionReason
            }
            onChange={(event) =>
              setRejectionReason(
                event.target.value,
              )
            }
            placeholder="Required only when rejecting"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {currentStatus ===
          "SUBMITTED" && (
          <button
            type="button"
            disabled={
              loading !== null
            }
            onClick={() =>
              changeStatus(
                "PENDING",
              )
            }
            className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ===
            "PENDING"
              ? "Starting..."
              : "Start review"}
          </button>
        )}

        {currentStatus ===
          "PENDING" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeStatus(
                  "APPROVED",
                )
              }
              className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ===
              "APPROVED"
                ? "Approving..."
                : "Approve"}
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              {loading ===
              "REJECTED"
                ? "Rejecting..."
                : "Reject"}
            </button>
          </>
        )}

        {currentStatus ===
          "APPROVED" && (
          <button
            type="button"
            disabled={
              loading !== null
            }
            onClick={() =>
              changeStatus(
                "SUSPENDED",
              )
            }
            className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Suspend Sender ID
          </button>
        )}

        {currentStatus ===
          "SUSPENDED" && (
          <button
            type="button"
            disabled={
              loading !== null
            }
            onClick={() =>
              changeStatus(
                "APPROVED",
              )
            }
            className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Restore approval
          </button>
        )}

        {currentStatus ===
          "REJECTED" && (
          <button
            type="button"
            disabled={
              loading !== null
            }
            onClick={() =>
              changeStatus(
                "DRAFT",
              )
            }
            className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Return to draft
          </button>
        )}
      </div>
    </div>
  );
}