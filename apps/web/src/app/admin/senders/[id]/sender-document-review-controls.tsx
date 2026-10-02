"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type DocumentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

type Props = {
  senderId: string;
  documentId: string;
  currentStatus: DocumentStatus;
};

export function SenderDocumentReviewControls({
  senderId,
  documentId,
  currentStatus,
}: Props) {
  const router =
    useRouter();

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

  async function updateStatus(
    status:
      | "ACCEPTED"
      | "REJECTED",
  ) {
    setError(null);

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

    setLoading(status);

    try {
      const response =
        await fetch(
          `/api/admin/senders/${encodeURIComponent(
            senderId,
          )}/documents/${encodeURIComponent(
            documentId,
          )}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,

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
            "Unable to update document status.",
        );
      }

      setRejectionReason("");

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to update document status.",
      );
    } finally {
      setLoading(null);
    }
  }

  if (
    currentStatus ===
    "ACCEPTED"
  ) {
    return (
      <span className="text-xs font-semibold text-emerald-700">
        Accepted
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {currentStatus ===
        "REJECTED" && (
        <p className="text-xs font-semibold text-red-700">
          Rejected
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={
            loading !== null
          }
          onClick={() =>
            updateStatus(
              "ACCEPTED",
            )
          }
          className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {loading ===
          "ACCEPTED"
            ? "Accepting..."
            : "Accept"}
        </button>

        <button
          type="button"
          disabled={
            loading !== null
          }
          onClick={() =>
            updateStatus(
              "REJECTED",
            )
          }
          className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          {loading ===
          "REJECTED"
            ? "Rejecting..."
            : "Reject"}
        </button>
      </div>

      <input
        type="text"
        value={
          rejectionReason
        }
        onChange={(event) =>
          setRejectionReason(
            event.target.value,
          )
        }
        placeholder="Rejection reason"
        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-red-400"
      />

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}