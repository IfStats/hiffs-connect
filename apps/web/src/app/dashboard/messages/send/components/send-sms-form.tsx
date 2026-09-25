"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

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

type SendResult = {
  id?: string;
  status?: string;
  provider?: string;
  providerMessageId?: string | null;
  segmentCount?: number | null;
  customerPrice?: string | number | null;
  currency?: string | null;
};

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
    useState<SendResult | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      new FormData(
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

    const text = String(
      form.get("text") ?? "",
    );

    if (
      !senderRegistrationId
    ) {
      setError(
        "Select an approved sender.",
      );
      return;
    }

    if (!to) {
      setError(
        "Recipient phone number is required.",
      );
      return;
    }

    if (!text.trim()) {
      setError(
        "Message text is required.",
      );
      return;
    }

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
    setResult(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/messaging/business/${businessId}/sms`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              senderRegistrationId,
              to,
              text,
            }),
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

      setResult(
        data as SendResult,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
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
          Only approved SMS sender
          identities can be used for
          delivery.
        </p>

        {senders.length === 0 && (
          <p className="mt-2 text-xs text-amber-700">
            You need an approved SMS
            sender before messages can
            be submitted.
          </p>
        )}
      </div>

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
          Use international E.164
          format.
        </p>
      </div>

      <SmsComposer />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            SMS submitted
          </p>

          <dl className="mt-3 space-y-2 text-sm text-emerald-800">
            {result.status && (
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="font-medium">
                  {result.status}
                </dd>
              </div>
            )}

            {result.provider && (
              <div className="flex justify-between gap-4">
                <dt>Provider</dt>
                <dd className="font-medium">
                  {result.provider}
                </dd>
              </div>
            )}

            {result.segmentCount !=
              null && (
              <div className="flex justify-between gap-4">
                <dt>
                  SMS pages
                </dt>
                <dd className="font-medium">
                  {
                    result.segmentCount
                  }
                </dd>
              </div>
            )}

            {result.customerPrice !=
              null &&
              result.currency && (
                <div className="flex justify-between gap-4">
                  <dt>Charge</dt>
                  <dd className="font-medium">
                    {
                      result.currency
                    }{" "}
                    {
                      result.customerPrice
                    }
                  </dd>
                </div>
              )}
          </dl>
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
            : "Send SMS"}
        </button>
      </div>
    </form>
  );
}