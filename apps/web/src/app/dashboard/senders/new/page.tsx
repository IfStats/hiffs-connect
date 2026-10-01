"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useSession,
} from "next-auth/react";

type SenderRequirement = {
  id: string;
  provider: string;
  countryCode: string;
  channel: "SMS" | "WHATSAPP";
  senderType:
    | "SHARED"
    | "DEDICATED";
  key: string;
  name: string;
  description: string | null;
  required: boolean;
  fieldKey: string | null;
  documentType: string | null;
  validationRule: unknown;
};

export default function NewSenderPage() {
  const router =
    useRouter();

  const {
    data: session,
  } = useSession();

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
    countryCode,
    setCountryCode,
  ] = useState("GH");

  const [
    senderType,
    setSenderType,
  ] =
    useState<
      "SHARED" | "DEDICATED"
    >("DEDICATED");

  const [
    requirements,
    setRequirements,
  ] =
    useState<
      SenderRequirement[]
    >([]);

  const [
    requirementsLoading,
    setRequirementsLoading,
  ] = useState(false);

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  useEffect(() => {
    if (
      !accessToken ||
      countryCode.length !== 2
    ) {
      return;
    }

    const apiUrl =
      process.env
        .NEXT_PUBLIC_HIFFS_API_URL;

    if (!apiUrl) {
      return;
    }

    const controller =
      new AbortController();

    async function loadRequirements() {
      setRequirementsLoading(
        true,
      );

      try {
        const response =
          await fetch(
            `${apiUrl}/sender-registrations/requirements?provider=infobip&countryCode=${countryCode}&channel=SMS&senderType=${senderType}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              signal:
                controller.signal,
            },
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load sender requirements.",
          );
        }

        const data =
          (await response.json()) as SenderRequirement[];

        setRequirements(data);
      } catch (
        caughtError
      ) {
        if (
          caughtError instanceof
            DOMException &&
          caughtError.name ===
            "AbortError"
        ) {
          return;
        }

        setRequirements([]);
      } finally {
        setRequirementsLoading(
          false,
        );
      }
    }

    void loadRequirements();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    countryCode,
    senderType,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !businessId ||
      !accessToken
    ) {
      setError(
        "Your authenticated business session is unavailable.",
      );

      return;
    }

    const form =
      new FormData(
        event.currentTarget,
      );

    const senderValue =
      String(
        form.get(
          "senderValue",
        ) ?? "",
      ).trim();

    const normalizedCountryCode =
      String(
        form.get(
          "countryCode",
        ) ?? "",
      )
        .trim()
        .toUpperCase();

    const destinationCountry =
      String(
        form.get(
          "destinationCountry",
        ) ?? "",
      )
        .trim()
        .toUpperCase();

    const useCase =
      String(
        form.get(
          "useCase",
        ) ?? "",
      ).trim();

    const volumeValue =
      String(
        form.get(
          "estimatedMonthlyVolume",
        ) ?? "",
      ).trim();

    if (!senderValue) {
      setError(
        "Sender ID is required.",
      );
      return;
    }

    if (
      normalizedCountryCode.length !==
      2
    ) {
      setError(
        "Origin country must be a 2-letter country code.",
      );
      return;
    }

    const payload = {
      channel:
        String(
          form.get(
            "channel",
          ) ?? "SMS",
        ),

      senderType:
        String(
          form.get(
            "senderType",
          ) ?? "DEDICATED",
        ),

      senderValue,

      countryCode:
        normalizedCountryCode,

      destinationCountry:
        destinationCountry ||
        undefined,

      useCase:
        useCase ||
        undefined,

      estimatedMonthlyVolume:
        volumeValue
          ? Number(
              volumeValue,
            )
          : undefined,
    };

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
      /*
       * Step 1:
       * Create the registration
       * as DRAFT.
       */
      const createResponse =
        await fetch(
          `${apiUrl}/sender-registrations/business/${businessId}`,
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

      const created =
        await createResponse
          .json()
          .catch(
            () => null,
          );

      if (
        !createResponse.ok
      ) {
        throw new Error(
          Array.isArray(
            created?.message,
          )
            ? created.message.join(
                ", ",
              )
            : created?.message ??
                "Unable to create sender registration.",
        );
      }

      if (!created?.id) {
        throw new Error(
          "Sender registration was created without an ID.",
        );
      }

      /*
       * Step 2:
       * Submit it for review.
       */
      const submitResponse =
        await fetch(
          `${apiUrl}/sender-registrations/business/${businessId}/${created.id}/submit`,
          {
            method:
              "PATCH",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        );

      const submitted =
        await submitResponse
          .json()
          .catch(
            () => null,
          );

      if (
        !submitResponse.ok
      ) {
        throw new Error(
          Array.isArray(
            submitted?.message,
          )
            ? submitted.message.join(
                ", ",
              )
            : submitted?.message ??
                "Sender registration was saved as a draft but could not be submitted for review.",
        );
      }

      router.push(
        "/dashboard/senders",
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to register sender ID.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <Link
          href="/dashboard/senders"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Sender IDs
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Sender registration
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Register sender ID
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Submit a sender identity
          for review before it can
          be used for messaging.
        </p>
      </section>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="channel"
              className="mb-2 block text-sm font-medium"
            >
              Channel
            </label>

            <select
              id="channel"
              name="channel"
              defaultValue="SMS"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="SMS">
                SMS
              </option>

              <option value="WHATSAPP">
                WhatsApp
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="senderType"
              className="mb-2 block text-sm font-medium"
            >
              Sender type
            </label>

            <select
              id="senderType"
              name="senderType"
              value={
                senderType
              }
              onChange={(
                event,
              ) =>
                setSenderType(
                  event.target
                    .value as
                    | "SHARED"
                    | "DEDICATED",
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="DEDICATED">
                Dedicated
              </option>

              <option value="SHARED">
                Shared
              </option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="senderValue"
            className="mb-2 block text-sm font-medium"
          >
            Sender ID
          </label>

          <input
            id="senderValue"
            name="senderValue"
            type="text"
            required
            maxLength={50}
            placeholder="Example: HIFFS"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the business
            identity recipients
            should see as the
            message sender.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="countryCode"
              className="mb-2 block text-sm font-medium"
            >
              Origin country
            </label>

            <input
              id="countryCode"
              name="countryCode"
              type="text"
              required
              maxLength={2}
              value={
                countryCode
              }
              onChange={(
                event,
              ) =>
                setCountryCode(
                  event.target.value
                    .toUpperCase()
                    .slice(
                      0,
                      2,
                    ),
                )
              }
              placeholder="GH"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="destinationCountry"
              className="mb-2 block text-sm font-medium"
            >
              Destination country
            </label>

            <input
              id="destinationCountry"
              name="destinationCountry"
              type="text"
              maxLength={2}
              placeholder="GH"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm uppercase outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="useCase"
            className="mb-2 block text-sm font-medium"
          >
            Messaging use case
          </label>

          <textarea
            id="useCase"
            name="useCase"
            required
            rows={5}
            placeholder="Describe the type of messages your business intends to send."
            className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="estimatedMonthlyVolume"
            className="mb-2 block text-sm font-medium"
          >
            Estimated monthly
            volume
          </label>

          <input
            id="estimatedMonthlyVolume"
            name="estimatedMonthlyVolume"
            type="number"
            min="0"
            placeholder="10000"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Registration
                requirements
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Infobip requirements
                for{" "}
                {countryCode ||
                  "the selected country"}.
              </p>
            </div>

            {requirementsLoading && (
              <span className="text-xs font-medium text-slate-500">
                Loading...
              </span>
            )}
          </div>

          {!requirementsLoading &&
            requirements.length ===
              0 && (
              <p className="mt-4 text-sm text-slate-500">
                No active
                requirements were
                found for this
                country and sender
                type.
              </p>
            )}

          {!requirementsLoading &&
            requirements.length >
              0 && (
              <div className="mt-4 space-y-3">
                {requirements.map(
                  (
                    requirement,
                  ) => (
                    <div
                      key={
                        requirement.id
                      }
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            requirement.name
                          }
                        </p>

                        {requirement.required && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Required
                          </span>
                        )}
                      </div>

                      {requirement.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {
                            requirement.description
                          }
                        </p>
                      )}

                      {requirement.documentType && (
                        <p className="mt-2 text-xs font-medium text-slate-600">
                          Document:{" "}
                          {
                            requirement.documentType
                          }
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Approval required
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            Submitted sender IDs
            must be reviewed and
            approved before they
            become available for
            message delivery.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/senders"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting..."
              : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}