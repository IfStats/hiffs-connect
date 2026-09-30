"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ContactsRecipientPicker,
  type ContactRecipient,
} from "./contacts-recipient-picker";

import {
  FileRecipientPicker,
} from "./file-recipient-picker";

import {
  SmsComposer,
  type SmsUsage,
} from "./sms-composer";

type SenderRegistration = {
  id: string;
  senderValue: string;
  countryCode: string;
  destinationCountry:
    | string
    | null;
};

type SmsTemplate = {
  id: string;
  name: string;
  content: string;
  variables: string[];
};

type Props = {
  businessId: string;
  accessToken: string;

  senders:
    SenderRegistration[];

  templates:
    SmsTemplate[];

  smsUnits: number;
};

type SingleSendResult = {
  id?: string;
  status?: string;

  segmentCount?:
    | number
    | null;

  customerPrice?:
    | string
    | number
    | null;

  currency?:
    | string
    | null;
};

type BatchItemResult = {
  contactId?: string;

  to: string;
  success: boolean;

  id?: string;
  status?: string;

  segmentCount?:
    | number
    | null;

  customerPrice?:
    | string
    | number
    | null;

  currency?:
    | string
    | null;

  error?: string;
};

type BatchSendResult = {
  templateId?: string;

  submitted: number;
  successful: number;
  failed: number;

  requiredSmsUnits?: number;

  results:
    BatchItemResult[];
};

type SendResult =
  | {
      mode:
        "single";

      data:
        SingleSendResult;
    }
  | {
      mode:
        "batch";

      data:
        BatchSendResult;
    };

type RecipientMode =
  | "single"
  | "multiple"
  | "contacts"
  | "upload";

export function SendSmsForm({
  businessId,
  accessToken,
  senders,
  templates,
  smsUnits,
}: Props) {
  const router =
    useRouter();

  const availableSmsUnits =
    smsUnits;

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    result,
    setResult,
  ] =
    useState<
      SendResult | null
    >(null);

  const [
    smsUsage,
    setSmsUsage,
  ] =
    useState<SmsUsage>({
      encoding:
        "GSM7",

      characterCount:
        0,

      unitsUsed:
        0,

      segmentCount:
        0,
    });

  const [
    manualRecipientCount,
    setManualRecipientCount,
  ] =
    useState(0);

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
  ] =
    useState<
      ContactRecipient[]
    >([]);

  const [
    uploadedRecipients,
    setUploadedRecipients,
  ] =
    useState<string[]>(
      [],
    );

  const [
    messageText,
    setMessageText,
  ] =
    useState("");

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] =
    useState("");

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL ??
    "";

  const selectedTemplate =
    templates.find(
      (template) =>
        template.id ===
        selectedTemplateId,
    ) ?? null;

  const hasTemplateVariables =
    Boolean(
      selectedTemplate &&
        selectedTemplate
          .variables
          .length > 0,
    );

  /*
   * Personalized template sending
   * only applies to contacts because
   * the backend needs contact IDs to
   * resolve firstName, displayName,
   * email, etc.
   */
  const personalizedTemplateMode =
    recipientMode ===
      "contacts" &&
    hasTemplateVariables;

  const recipientCount =
    recipientMode ===
    "single"
      ? 1
      : recipientMode ===
          "multiple"
        ? manualRecipientCount
        : recipientMode ===
            "contacts"
          ? selectedContacts
              .length
          : uploadedRecipients
              .length;

  /*
   * For normal messages this is
   * authoritative enough for the
   * client preflight.
   *
   * For personalized templates the
   * backend calculates every rendered
   * recipient independently.
   */
  const requiredSmsUnits =
    smsUsage.segmentCount *
    recipientCount;

  const insufficientSmsUnits =
    requiredSmsUnits >
    availableSmsUnits;

  function changeRecipientMode(
    mode:
      RecipientMode,
  ) {
    setRecipientMode(
      mode,
    );

    setError(null);
    setResult(null);
  }

  function handleTemplateChange(
    templateId: string,
  ) {
    setSelectedTemplateId(
      templateId,
    );

    setError(null);
    setResult(null);

    if (!templateId) {
      return;
    }

    const template =
      templates.find(
        (item) =>
          item.id ===
          templateId,
      );

    if (!template) {
      return;
    }

    setMessageText(
      template.content,
    );

    /*
     * Variables such as
     * {{firstName}} require contact
     * records rather than raw phone
     * numbers.
     */
    if (
      template.variables
        .length > 0
    ) {
      setRecipientMode(
        "contacts",
      );
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setResult(null);

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

    const to =
      String(
        form.get(
          "to",
        ) ?? "",
      ).trim();

    const rawRecipients =
      String(
        form.get(
          "recipients",
        ) ?? "",
      );

    const manualRecipients =
      recipientMode ===
      "multiple"
        ? [
            ...new Set(
              rawRecipients
                .split(
                  /[\n,;]+/,
                )
                .map(
                  (
                    value,
                  ) =>
                    value.trim(),
                )
                .filter(
                  Boolean,
                ),
            ),
          ]
        : [];

    const recipients =
      recipientMode ===
      "contacts"
        ? [
            ...new Set(
              selectedContacts
                .map(
                  (
                    contact,
                  ) =>
                    contact.phone.trim(),
                )
                .filter(
                  Boolean,
                ),
            ),
          ]
        : recipientMode ===
            "upload"
          ? [
              ...new Set(
                uploadedRecipients
                  .map(
                    (
                      value,
                    ) =>
                      value.trim(),
                  )
                  .filter(
                    Boolean,
                  ),
              ),
            ]
          : manualRecipients;

    const text =
      messageText;

    if (
      !senderRegistrationId
    ) {
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
      recipients.length ===
        0
    ) {
      setError(
        recipientMode ===
          "contacts"
          ? "Select at least one contact."
          : recipientMode ===
              "upload"
            ? "Upload a file containing at least one valid recipient."
            : "Enter at least one recipient.",
      );

      return;
    }

    if (
      recipientMode !==
        "single" &&
      recipients.length >
        100
    ) {
      setError(
        "A maximum of 100 recipients can be submitted at once.",
      );

      return;
    }

    /*
     * Templates containing contact
     * variables cannot safely be sent
     * to arbitrary phone numbers.
     */
    if (
      hasTemplateVariables &&
      recipientMode !==
        "contacts"
    ) {
      setError(
        "Templates containing contact variables must be sent using Contacts & Groups.",
      );

      return;
    }

    if (
      !text.trim()
    ) {
      setError(
        "Message text is required.",
      );

      return;
    }

    const submissionRecipientCount =
      recipientMode ===
      "single"
        ? 1
        : recipients.length;

    const submissionRequiredUnits =
      smsUsage.segmentCount *
      submissionRecipientCount;

    /*
     * Personalized messages may have
     * different final lengths for
     * different contacts.
     *
     * The dedicated backend endpoint
     * performs the authoritative unit
     * preflight in that case.
     */
    if (
      !personalizedTemplateMode &&
      submissionRequiredUnits >
        availableSmsUnits
    ) {
      setError(
        `Insufficient SMS units. This send requires ${submissionRequiredUnits.toLocaleString()} units but only ${availableSmsUnits.toLocaleString()} are available.`,
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

    try {
      const isBatch =
        recipientMode !==
        "single";

      const endpoint =
        personalizedTemplateMode
          ? `${apiUrl}/messaging/business/${businessId}/sms/template-batch`
          : isBatch
            ? `${apiUrl}/messaging/business/${businessId}/sms/batch`
            : `${apiUrl}/messaging/business/${businessId}/sms`;

      const body =
        personalizedTemplateMode
          ? {
              senderRegistrationId,

              templateId:
                selectedTemplateId,

              contactIds:
                selectedContacts.map(
                  (
                    contact,
                  ) =>
                    contact.id,
                ),
            }
          : isBatch
            ? {
                senderRegistrationId,
                recipients,
                text,
              }
            : {
                senderRegistrationId,
                to,
                text,
              };

      const response =
        await fetch(
          endpoint,
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
                body,
              ),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok
      ) {
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
          mode:
            "batch",

          data:
            data as BatchSendResult,
        });
      } else {
        setResult({
          mode:
            "single",

          data:
            data as SingleSendResult,
        });
      }

      /*
       * Refresh server components so
       * the displayed SMS-unit wallet
       * reflects the debit.
       */
      router.refresh();
    } catch (
      caughtError
    ) {
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
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      {/* Sender */}
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
            senders.length ===
            0
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
        >
          <option
            value=""
            disabled
          >
            {senders.length ===
            0
              ? "No approved SMS sender available"
              : "Select approved sender"}
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
          sender identities can
          be used for delivery.
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

      {/* Template */}
      <div>
        <label
          htmlFor="template"
          className="mb-2 block text-sm font-medium"
        >
          Template

          <span className="ml-1 font-normal text-slate-400">
            Optional
          </span>
        </label>

        <select
          id="template"
          value={
            selectedTemplateId
          }
          onChange={(
            event,
          ) =>
            handleTemplateChange(
              event.target
                .value,
            )
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
        >
          <option value="">
            No template — write
            manually
          </option>

          {templates.map(
            (
              template,
            ) => (
              <option
                key={
                  template.id
                }
                value={
                  template.id
                }
              >
                {
                  template.name
                }
              </option>
            ),
          )}
        </select>

        {templates.length ===
          0 && (
          <p className="mt-2 text-xs text-slate-500">
            No active SMS
            templates are
            available.
          </p>
        )}

        {selectedTemplate &&
          selectedTemplate
            .variables
            .length > 0 && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">
              Personalized
              template
            </p>

            <p className="mt-2 text-xs leading-5 text-blue-800">
              Variables:{" "}
              {selectedTemplate.variables
                .map(
                  (
                    variable,
                  ) =>
                    `{{${variable}}}`,
                )
                .join(
                  ", ",
                )}
            </p>

            <p className="mt-2 text-xs leading-5 text-blue-800">
              Contacts & Groups
              has been selected
              because Hiffs
              Connect needs the
              recipient contact
              data to resolve
              these variables.
            </p>
          </div>
        )}
      </div>

      {/* Recipients */}
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
              disabled={
                hasTemplateVariables
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
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
              disabled={
                hasTemplateVariables
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
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

            <button
              type="button"
              onClick={() =>
                changeRecipientMode(
                  "upload",
                )
              }
              disabled={
                hasTemplateVariables
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                recipientMode ===
                "upload"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Upload File
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
              onChange={(
                event,
              ) => {
                const values = [
                  ...new Set(
                    event.target
                      .value
                      .split(
                        /[\n,;]+/,
                      )
                      .map(
                        (
                          value,
                        ) =>
                          value.trim(),
                      )
                      .filter(
                        Boolean,
                      ),
                  ),
                ];

                setManualRecipientCount(
                  values.length,
                );
              }}
              placeholder={
                "+233XXXXXXXXX\n+234XXXXXXXXXX\n+233XXXXXXXXX"
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter one number
              per line, or
              separate numbers
              with commas or
              semicolons.
              Duplicate numbers
              are removed
              automatically.
              Maximum 100
              recipients per
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
                apiUrl={
                  apiUrl
                }
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

        {recipientMode ===
          "upload" && (
          <FileRecipientPicker
            value={
              uploadedRecipients
            }
            onChange={
              setUploadedRecipients
            }
            maxRecipients={
              100
            }
          />
        )}
      </div>

      {/* Message composer */}
      <SmsComposer
        value={
          messageText
        }
        onChange={(
          nextText,
        ) => {
          setMessageText(
            nextText,
          );

          /*
           * Editing template text
           * converts the message into
           * a normal manual message.
           *
           * This prevents us from
           * claiming that the original
           * stored template is still
           * being sent.
           */
          if (
            selectedTemplate &&
            nextText !==
              selectedTemplate.content
          ) {
            setSelectedTemplateId(
              "",
            );
          }
        }}
        onUsageChange={
          setSmsUsage
        }
      />

      {/* Unit estimate */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Available units
          </p>

          <p className="mt-1 text-lg font-semibold">
            {availableSmsUnits.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            Recipients
          </p>

          <p className="mt-1 text-lg font-semibold">
            {recipientCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">
            {personalizedTemplateMode
              ? "Estimated units"
              : "Required units"}
          </p>

          <p className="mt-1 text-lg font-semibold">
            {requiredSmsUnits.toLocaleString()}
          </p>
        </div>
      </div>

      {personalizedTemplateMode && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          Personalized message
          lengths can differ by
          recipient. The final SMS
          unit requirement will be
          calculated server-side
          before delivery begins.
        </div>
      )}

      {!personalizedTemplateMode &&
        insufficientSmsUnits &&
        requiredSmsUnits >
          0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Insufficient SMS units.
          This send requires{" "}
          <strong>
            {requiredSmsUnits.toLocaleString()}
          </strong>{" "}
          units but only{" "}
          <strong>
            {availableSmsUnits.toLocaleString()}
          </strong>{" "}
          are available.
        </div>
      )}

      {/* API errors */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          {result.mode ===
          "single" ? (
            <>
              <p className="text-sm font-semibold text-emerald-900">
                SMS submitted
              </p>

              <dl className="mt-3 space-y-2 text-sm text-emerald-800">
                <div className="flex justify-between gap-4">
                  <dt>
                    Status
                  </dt>

                  <dd className="font-medium">
                    {result.data
                      .status ??
                      "Submitted"}
                  </dd>
                </div>

                {result.data
                  .segmentCount !==
                  undefined &&
                  result.data
                    .segmentCount !==
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
                  .customerPrice !==
                  undefined &&
                  result.data
                    .customerPrice !==
                    null && (
                  <div className="flex justify-between gap-4">
                    <dt>
                      Charge
                    </dt>

                    <dd className="font-medium">
                      {result.data
                        .currency ??
                        ""}{" "}
                      {
                        result.data
                          .customerPrice
                      }
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-emerald-900">
                Batch processed
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

                {result.data
                  .requiredSmsUnits !==
                  undefined && (
                  <div className="flex justify-between gap-4">
                    <dt>
                      Required SMS
                      units
                    </dt>

                    <dd className="font-medium">
                      {result.data
                        .requiredSmsUnits
                        .toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>

              {result.data
                .failed >
                0 && (
                <div className="mt-4 border-t border-emerald-200 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                    Failed
                    recipients
                  </p>

                  <div className="mt-2 space-y-2">
                    {result.data
                      .results
                      .filter(
                        (
                          item,
                        ) =>
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
                            {
                              item.to
                            }

                            {item.error
                              ? ` — ${item.error}`
                              : ""}
                          </div>
                        ),
                      )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Actions */}
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
            senders.length ===
              0 ||
            availableSmsUnits ===
              0 ||
            (
              !personalizedTemplateMode &&
              insufficientSmsUnits
            )
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
                ? personalizedTemplateMode
                  ? `Send personalized SMS to ${selectedContacts.length} contact${
                      selectedContacts.length ===
                      1
                        ? ""
                        : "s"
                    }`
                  : `Send to ${selectedContacts.length} contact${
                      selectedContacts.length ===
                      1
                        ? ""
                        : "s"
                    }`
                : recipientMode ===
                    "upload"
                  ? `Send to ${uploadedRecipients.length} recipient${
                      uploadedRecipients.length ===
                      1
                        ? ""
                        : "s"
                    }`
                  : `Send to ${manualRecipientCount} recipient${
                      manualRecipientCount ===
                      1
                        ? ""
                        : "s"
                    }`}
        </button>
      </div>
    </form>
  );
}