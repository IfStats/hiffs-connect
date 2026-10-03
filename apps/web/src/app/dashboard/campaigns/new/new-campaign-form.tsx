"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Sender = {
  id: string;
  senderValue: string;
};

type Props = {
  businessId: string;
  accessToken: string;
  senders: Sender[];
};

export function NewCampaignForm({
  businessId,
  accessToken,
  senders,
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
    recipientCount,
    setRecipientCount,
  ] = useState(0);

  function parseRecipients(
    value: string,
  ) {
    return Array.from(
      new Set(
        value
          .split(
            /[\n,\s]+/,
          )
          .map(
            (recipient) =>
              recipient.trim(),
          )
          .filter(Boolean),
      ),
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget,
      );

    const name =
      String(
        form.get("name") ??
          "",
      ).trim();

    const senderRegistrationId =
      String(
        form.get(
          "senderRegistrationId",
        ) ?? "",
      ).trim();

    const content =
      String(
        form.get("content") ??
          "",
      ).trim();

    const recipients =
      parseRecipients(
        String(
          form.get(
            "recipients",
          ) ?? "",
        ),
      );

    const scheduledAtRaw =
      String(
        form.get(
          "scheduledAt",
        ) ?? "",
      ).trim();

    if (!name) {
      setError(
        "Campaign name is required.",
      );

      return;
    }

    if (
      !senderRegistrationId
    ) {
      setError(
        "Select an approved sender.",
      );

      return;
    }

    if (!content) {
      setError(
        "Campaign message is required.",
      );

      return;
    }

    if (
      recipients.length ===
      0
    ) {
      setError(
        "Add at least one recipient.",
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

    const payload = {
      clientRequestId:
        crypto.randomUUID(),

      name,

      senderRegistrationId,

      content,

      recipients,

      scheduledAt:
        scheduledAtRaw
          ? new Date(
              scheduledAtRaw,
            ).toISOString()
          : undefined,
    };

    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/campaigns/business/${businessId}`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
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
                "Unable to create campaign.",
        );
      }

      if (!result?.id) {
        throw new Error(
          "Campaign was created without an ID.",
        );
      }

      router.push(
        `/dashboard/campaigns/${result.id}`,
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to create campaign.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium"
        >
          Campaign name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          placeholder="October customer update"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="senderRegistrationId"
          className="mb-2 block text-sm font-medium"
        >
          Sender
        </label>

        <select
          id="senderRegistrationId"
          name="senderRegistrationId"
          required
          defaultValue=""
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
        >
          <option
            value=""
            disabled
          >
            Select approved sender
          </option>

          {senders.map(
            (sender) => (
              <option
                key={
                  sender.id
                }
                value={
                  sender.id
                }
              >
                {
                  sender.senderValue
                }
              </option>
            ),
          )}
        </select>

        {senders.length ===
          0 && (
          <p className="mt-2 text-sm text-amber-700">
            No approved SMS
            sender is available.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium"
        >
          Message
        </label>

        <textarea
          id="content"
          name="content"
          required
          maxLength={1600}
          rows={7}
          placeholder="Enter the SMS message..."
          className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="recipients"
            className="block text-sm font-medium"
          >
            Recipients
          </label>

          <span className="text-xs text-slate-500">
            {recipientCount.toLocaleString()}{" "}
            unique recipients
          </span>
        </div>

        <textarea
          id="recipients"
          name="recipients"
          required
          rows={10}
          placeholder={
            "+233555000001\n+233555000002\n+2348012345678"
          }
          onChange={(
            event,
          ) => {
            setRecipientCount(
              parseRecipients(
                event.target
                  .value,
              ).length,
            );
          }}
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 font-mono text-sm outline-none focus:border-slate-400"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Enter international
          phone numbers beginning
          with +. Separate numbers
          with spaces, commas or
          new lines.
        </p>
      </div>

      <div>
        <label
          htmlFor="scheduledAt"
          className="mb-2 block text-sm font-medium"
        >
          Schedule
        </label>

        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />

        <p className="mt-2 text-xs text-slate-500">
          Leave empty to create
          the campaign as a draft.
          Scheduled campaigns are
          not sent until the worker
          system is enabled.
        </p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-950">
          Campaign creation
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          Creating this campaign
          stores the campaign and
          recipients only. SMS unit
          reservation and queue
          execution will be added
          in the campaign launch
          workflow.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            loading ||
            senders.length ===
              0
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : "Create campaign"}
        </button>
      </div>
    </form>
  );
}