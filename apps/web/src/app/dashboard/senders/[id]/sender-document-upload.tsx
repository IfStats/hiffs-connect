"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Requirement = {
  id: string;
  name: string;
  description:
    | string
    | null;
  required: boolean;
  documentType:
    | string
    | null;
};

type ExistingDocument = {
  id: string;
  documentType: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED";
};

type Props = {
  senderId: string;
  requirements: Requirement[];
  documents: ExistingDocument[];
};

export function SenderDocumentUpload({
  senderId,
  requirements,
  documents,
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

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null,
    );

  const documentRequirements =
  useMemo(() => {
    const seen =
      new Set<string>();

    return requirements.filter(
      (requirement) => {
        const documentType =
          requirement.documentType;

        if (!documentType) {
          return false;
        }

        if (
          seen.has(
            documentType,
          )
        ) {
          return false;
        }

        seen.add(
          documentType,
        );

        const existing =
          documents.filter(
            (document) =>
              document.documentType ===
              documentType,
          );

        const hasAccepted =
          existing.some(
            (document) =>
              document.status ===
              "ACCEPTED",
          );

        const hasPending =
          existing.some(
            (document) =>
              document.status ===
              "PENDING",
          );

        /*
         * Accepted documents need
         * no further upload.
         *
         * Pending documents are
         * already awaiting review.
         *
         * Rejected documents remain
         * available for re-upload.
         */
        return (
          !hasAccepted &&
          !hasPending
        );
      },
    );
  }, [
    requirements,
    documents,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const documentType =
      String(
        formData.get(
          "documentType",
        ) ?? "",
      ).trim();

    const file =
      formData.get(
        "file",
      );

    if (!documentType) {
      setError(
        "Select a document type.",
      );
      return;
    }

    if (
      !(file instanceof File) ||
      file.size === 0
    ) {
      setError(
        "Select a document to upload.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          `/api/dashboard/senders/${encodeURIComponent(
            senderId,
          )}/documents`,
          {
            method:
              "POST",

            body:
              formData,
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
            "Unable to upload document.",
        );
      }

      setSuccess(
        "Document uploaded successfully and is awaiting review.",
      );

      form.reset();

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to upload document.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (
  documentRequirements.length ===
  0
) {
  const hasPending =
    documents.some(
      (document) =>
        document.status ===
        "PENDING",
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">
        {hasPending
          ? "Your uploaded documents are awaiting review."
          : "All requested documents have been supplied."}
      </p>
    </div>
  );
}

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="documentType"
          className="text-sm font-medium text-slate-700"
        >
          Document type
        </label>

        <select
          id="documentType"
          name="documentType"
          required
          defaultValue=""
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
        >
          <option
            value=""
            disabled
          >
            Select document
          </option>

          {documentRequirements.map(
            (
              requirement,
            ) => (
              <option
                key={
                  requirement.id
                }
                value={
                  requirement.documentType ??
                  ""
                }
              >
                {
                  requirement.name
                }
                {requirement.required
                  ? " — Required"
                  : " — Optional"}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label
          htmlFor="sender-document"
          className="text-sm font-medium text-slate-700"
        >
          File
        </label>

        <input
          id="sender-document"
          name="file"
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />

        <p className="mt-2 text-xs text-slate-500">
          PDF, JPG or PNG.
          Maximum size: 10 MB.
        </p>
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

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Uploading..."
          : "Upload document"}
      </button>
    </form>
  );
}