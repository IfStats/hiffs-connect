"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import { ContactsRecipientPicker } from "./contacts-recipient-picker";
import { SmsComposer } from "./sms-composer";

type SenderRegistration = {
  id: string;
  senderValue: string;
  countryCode: string;
  destinationCountry: string | null;
};

type Props = {
  businessId: string;
  accessToken: string;
  senders: SenderRegistration[];
};

type SingleSendResult = {
  id?: string;
  status?: string;
  segmentCount?: number | null;
  customerPrice?: string | number | null;
  currency?: string | null;
};

type BatchItemResult = {
  to: string;
  success: boolean;
  id?: string;
  status?: string;
  segmentCount?: number | null;
  customerPrice?: string | number | null;
  currency?: string | null;
  error?: string;
};

type BatchSendResult = {
  submitted: number;
  successful: number;
  failed: number;
  results: BatchItemResult[];
};

type SendResult =
  | {
      mode: "single";
      data: SingleSendResult;
    }
  | {
      mode: "batch";
      data: BatchSendResult;
    };

type RecipientMode =
  | "single"
  | "multiple"
  | "contacts";

export function SendSmsForm({
  businessId,
  accessToken,
  senders,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<SendResult | null>(
      null,
    );

  const [
    recipientMode,
    setRecipientMode,
  ] =
    useState<RecipientMode>(
      "single",
    );

  const [
    selectedContacts,
    setSelectedContacts,
  ] = useState<string[]>([]);

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL ??
    "";

  function changeRecipientMode(
    mode: RecipientMode,
  ) {
    setRecipientMode(mode);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget,
    );

    const senderRegistrationId =
      String(
        form.get(
          "senderRegistrationId",
        ) ?? "",
      ).trim();

    const to = String(
      form.get("to") ?? "",
    ).trim();

    const rawRecipients = String(
      form.get("recipients") ?? "",
    );

    const manualRecipients =
      recipientMode === "multiple"
        ? [
            ...new Set(
              rawRecipients
                .split(/[\n,;]+/)
                .map((value) =>
                  value.trim(),
                )
                .filter(Boolean),
            ),
          ]
        : [];

    const recipients =
      recipientMode === "contacts"
        ? [
            ...new Set(
              selectedContacts
                .map((value) =>
                  value.trim(),
                )
                .filter(Boolean),
            ),
          ]
        : manualRecipients;

    const text = String(
      form.get("text") ?? "",
    );

    if (!senderRegistrationId) {
      setError(
        "Select an approved sender.",
      );
      return;
    }

    if (
      recipientMode ===
        "single" &&
      !to
    ) {
      setError(
        "Recipient phone number is required.",
      );
      return;
    }

    if (
      recipientMode !==
        "single" &&
      recipients.length === 0
    ) {
      setError(
        recipientMode ===
          "contacts"
          ? "Select at least one contact."
          : "Enter at least one recipient.",
      );
      return;
    }

    if (
      recipientMode !==
        "single" &&
      recipients.length > 100
    ) {
      setError(
        "A maximum of 100 recipients can be submitted at once.",
      );
      return;
    }

    if (!text.trim()) {
      setError(
        "Message text is required.",
      );
      return;
    }

    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const isBatch =
        recipientMode !==
        "single";

      const response =
        await fetch(
          isBatch
            ? `${apiUrl}/messaging/business/${businessId}/sms/batch`
            : `${apiUrl}/messaging/business/${businessId}/sms`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              isBatch
                ? {
                    senderRegistrationId,
                    recipients,
                    text,
                  }
                : {
                    senderRegistrationId,
                    to,
                    text,
                  },
            ),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            data?.message,
          )
            ? data.message.join(
                ", ",
              )
            : data?.message ??
                "Failed to send SMS",
        );
      }

      if (isBatch) {
        setResult({
          mode: "batch",
          data:
            data as BatchSendResult,
        });
      } else {
        setResult({
          mode: "single",
          data:
            data as SingleSendResult,
        });
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to send SMS",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="sender"
          className="mb-2 block text-sm font-medium"
        >
          Sender
        </label>

        <select
          id="sender"
          name="senderRegistrationId"
          required
          defaultValue=""
          disabled={
            senders.length === 0
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
        >
          <option
            value=""
            disabled
          >
            {senders.length === 0
              ? "No approved SMS sender available"
              : "Select approved sender"}
          </option>

          {senders.map(
            (sender) => (
              <option
                key={sender.id}
                value={sender.id}
              >
                {
                  sender.senderValue
                }{" "}
                (
                {
                  sender.countryCode
                }
                )
              </option>
            ),
          )}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          Only approved SMS
          sender identities can be
          used for delivery.
        </p>

        {senders.length ===
          0 && (
          <p className="mt-2 text-xs text-amber-700">
            You need an approved
            SMS sender before
            messages can be
            submitted.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 block text-sm font-medium">
            Recipients
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                changeRecipientMode(
                  "single",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                recipientMode ===
                "single"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Single
            </button>

            <button
              type="button"
              onClick={() =>
                changeRecipientMode(
                  "multiple",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                recipientMode ===
                "multiple"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Multiple
            </button>

            <button
              type="button"
              onClick={() =>
                changeRecipientMode(
                  "contacts",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                recipientMode ===
                "contacts"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Contacts & Groups
            </button>
          </div>
        </div>

        {recipientMode ===
          "single" && (
          <div>
            <label
              htmlFor="recipient"
              className="mb-2 block text-sm font-medium"
            >
              Recipient
            </label>

            <input
              id="recipient"
              name="to"
              type="tel"
              required
              placeholder="+233XXXXXXXXX"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs text-slate-500">
              Use international
              E.164 format.
            </p>
          </div>
        )}

        {recipientMode ===
          "multiple" && (
          <div>
            <label
              htmlFor="recipients"
              className="mb-2 block text-sm font-medium"
            >
              Phone numbers
            </label>

            <textarea
              id="recipients"
              name="recipients"
              required
              rows={7}
              placeholder={
                "+233XXXXXXXXX\n+234XXXXXXXXXX\n+233XXXXXXXXX"
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter one number per
              line, or separate
              numbers with commas or
              semicolons. Duplicate
              numbers are removed
              automatically. Maximum
              100 recipients per
              batch.
            </p>
          </div>
        )}

        {recipientMode ===
          "contacts" && (
          <>
            {!apiUrl ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                API URL is not
                configured.
              </div>
            ) : (
              <ContactsRecipientPicker
                apiUrl={apiUrl}
                businessId={
                  businessId
                }
                accessToken={
                  accessToken
                }
                value={
                  selectedContacts
                }
                onChange={
                  setSelectedContacts
                }
                maxRecipients={
                  100
                }
              />
            )}
          </>
        )}
      </div>

      <SmsComposer />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result?.mode ===
        "single" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            SMS submitted
          </p>

          <dl className="mt-3 space-y-2 text-sm text-emerald-800">
            {result.data
              .status && (
              <div className="flex justify-between gap-4">
                <dt>
                  Status
                </dt>

                <dd className="font-medium">
                  {
                    result.data
                      .status
                  }
                </dd>
              </div>
            )}

            {result.data
              .segmentCount !=
              null && (
              <div className="flex justify-between gap-4">
                <dt>
                  SMS pages
                </dt>

                <dd className="font-medium">
                  {
                    result.data
                      .segmentCount
                  }
                </dd>
              </div>
            )}

            {result.data
              .customerPrice !=
              null &&
              result.data
                .currency && (
                <div className="flex justify-between gap-4">
                  <dt>
                    Charge
                  </dt>

                  <dd className="font-medium">
                    {
                      result.data
                        .currency
                    }{" "}
                    {
                      result.data
                        .customerPrice
                    }
                  </dd>
                </div>
              )}
          </dl>
        </div>
      )}

      {result?.mode ===
        "batch" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            Batch submitted
          </p>

          <dl className="mt-3 space-y-2 text-sm text-emerald-800">
            <div className="flex justify-between gap-4">
              <dt>
                Recipients
              </dt>

              <dd className="font-medium">
                {
                  result.data
                    .submitted
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt>
                Accepted
              </dt>

              <dd className="font-medium">
                {
                  result.data
                    .successful
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt>
                Failed
              </dt>

              <dd className="font-medium">
                {
                  result.data
                    .failed
                }
              </dd>
            </div>
          </dl>

          {result.data.failed >
            0 && (
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Failed recipients
              </p>

              <div className="mt-2 space-y-2">
                {result.data.results
                  .filter(
                    (item) =>
                      !item.success,
                  )
                  .map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.to}-${index}`}
                        className="text-xs text-red-700"
                      >
                        {item.to}

                        {item.error
                          ? ` — ${item.error}`
                          : ""}
                      </div>
                    ),
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/messages"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            loading ||
            senders.length === 0
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? "Sending..."
            : recipientMode ===
                "single"
              ? "Send SMS"
              : recipientMode ===
                  "contacts"
                ? `Send to ${selectedContacts.length} contact${
                    selectedContacts.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : "Send batch SMS"}
        </button>
      </div>
    </form>
  );
}