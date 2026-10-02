"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type SenderValidationStatus =
  | "PENDING"
  | "INTERNAL_REVIEW"
  | "DOCUMENTS_REQUIRED"
  | "READY_FOR_PROVIDER"
  | "PROVIDER_SUBMITTED"
  | "PROVIDER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type Props = {
  senderId: string;
  currentStatus: SenderValidationStatus;
  currentProviderReference:
    | string
    | null;

  documentsReady: boolean;
};

export function SenderValidationControls({
  senderId,
  currentStatus,
  currentProviderReference,
  documentsReady,
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
    reviewNotes,
    setReviewNotes,
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

  async function changeValidationStatus(
    status: SenderValidationStatus,
  ) {
    setError(null);
    setSuccess(null);

    if (
      status ===
        "REJECTED" &&
      !reviewNotes.trim()
    ) {
      setError(
        "Enter review notes explaining the rejection.",
      );

      return;
    }

    setLoading(status);

    try {
      const response =
        await fetch(
          `/api/admin/senders/${encodeURIComponent(
            senderId,
          )}/validation-status`,
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

                providerReference:
                  providerReference.trim() ||
                  undefined,

                reviewNotes:
                  reviewNotes.trim() ||
                  undefined,
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
            "Unable to update validation status.",
        );
      }

      setSuccess(
        `Validation updated to ${status}.`,
      );

      if (
        status ===
        "REJECTED"
      ) {
        setReviewNotes("");
      }

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to update validation status.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="validation-provider-reference"
          className="text-sm font-medium text-slate-700"
        >
          Provider reference
        </label>

        <input
          id="validation-provider-reference"
          value={
            providerReference
          }
          onChange={(event) =>
            setProviderReference(
              event.target.value,
            )
          }
          placeholder="Infobip registration reference"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="validation-review-notes"
          className="text-sm font-medium text-slate-700"
        >
          Review notes
        </label>

        <textarea
          id="validation-review-notes"
          rows={4}
          value={
            reviewNotes
          }
          onChange={(event) =>
            setReviewNotes(
              event.target.value,
            )
          }
          placeholder="Internal review notes or provider feedback"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </div>

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
          "PENDING" && (
          <button
            type="button"
            disabled={
              loading !== null
            }
            onClick={() =>
              changeValidationStatus(
                "INTERNAL_REVIEW",
              )
            }
            className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Start internal review
          </button>
        )}

        {currentStatus ===
          "INTERNAL_REVIEW" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "DOCUMENTS_REQUIRED",
                )
              }
              className="h-11 rounded-xl border border-amber-200 px-5 text-sm font-semibold text-amber-700 disabled:opacity-50"
            >
              Request documents
            </button>

            <button
  type="button"
  disabled={
    loading !== null ||
    !documentsReady
  }
  onClick={() =>
    changeValidationStatus(
      "READY_FOR_PROVIDER",
    )
  }
  title={
    documentsReady
      ? undefined
      : "All required documents must be accepted first"
  }
  className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
>
  Ready for provider
</button>

{!documentsReady && (
  <p className="basis-full text-xs text-amber-700">
    Required compliance documents are still missing, pending review, or rejected.
  </p>
)}

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus ===
          "DOCUMENTS_REQUIRED" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "INTERNAL_REVIEW",
                )
              }
              className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Resume review
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus ===
          "READY_FOR_PROVIDER" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "PROVIDER_SUBMITTED",
                )
              }
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Mark provider submitted
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus ===
          "PROVIDER_SUBMITTED" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "PROVIDER_PENDING",
                )
              }
              className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Provider pending
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "APPROVED",
                )
              }
              className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus ===
          "PROVIDER_PENDING" && (
          <>
            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "APPROVED",
                )
              }
              className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Approve
            </button>

            <button
              type="button"
              disabled={
                loading !== null
              }
              onClick={() =>
                changeValidationStatus(
                  "REJECTED",
                )
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Reject
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
              changeValidationStatus(
                "SUSPENDED",
              )
            }
            className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Suspend validation
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
              changeValidationStatus(
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
              changeValidationStatus(
                "INTERNAL_REVIEW",
              )
            }
            className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            Reopen review
          </button>
        )}
      </div>
    </div>
  );
}