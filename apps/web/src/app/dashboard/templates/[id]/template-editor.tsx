"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type TemplateStatus =
  | "ACTIVE"
  | "ARCHIVED";

type MessageTemplate = {
  id: string;
  name: string;
  channel:
    | "SMS"
    | "WHATSAPP";
  content: string;
  variables: string[];
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  businessId: string;
  accessToken: string;
  initialTemplate:
    MessageTemplate;
  canManage: boolean;
};

function gsm7Length(
  text: string,
) {
  const basic =
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

  const extension =
    "^{}\\[~]|€";

  let units = 0;

  for (
    const character
    of text
  ) {
    if (
      basic.includes(
        character,
      )
    ) {
      units += 1;
      continue;
    }

    if (
      extension.includes(
        character,
      )
    ) {
      units += 2;
      continue;
    }

    return null;
  }

  return units;
}

function calculateUsage(
  text: string,
) {
  const gsmUnits =
    gsm7Length(
      text,
    );

  if (
    gsmUnits !== null
  ) {
    return {
      encoding:
        "GSM-7",

      characters:
        text.length,

      pages:
        gsmUnits === 0
          ? 0
          : gsmUnits <=
              160
            ? 1
            : Math.ceil(
                gsmUnits /
                  153,
              ),
    };
  }

  return {
    encoding:
      "Unicode",

    characters:
      text.length,

    pages:
      text.length === 0
        ? 0
        : text.length <=
            70
          ? 1
          : Math.ceil(
              text.length /
                67,
            ),
  };
}

function extractVariables(
  text: string,
) {
  const values =
    new Set<string>();

  const pattern =
    /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g;

  let match:
    | RegExpExecArray
    | null;

  while (
    (match =
      pattern.exec(
        text,
      )) !== null
  ) {
    values.add(
      match[1],
    );
  }

  return [
    ...values,
  ];
}

export function TemplateEditor({
  businessId,
  accessToken,
  initialTemplate,
  canManage,
}: Props) {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState(
    initialTemplate.name,
  );

  const [
    content,
    setContent,
  ] = useState(
    initialTemplate.content,
  );

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

  const usage =
    useMemo(
      () =>
        calculateUsage(
          content,
        ),
      [content],
    );

  const variables =
    useMemo(
      () =>
        extractVariables(
          content,
        ),
      [content],
    );

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL ??
    "";

  async function updateTemplate(
    body: Record<
      string,
      unknown
    >,
    action: string,
  ) {
    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );

      return false;
    }

    setLoading(
      action,
    );

    setError(null);
    setSuccess(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/businesses/${businessId}/templates/${initialTemplate.id}`,
          {
            method:
              "PATCH",

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

      const payload =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            payload?.message,
          )
            ? payload.message.join(
                ", ",
              )
            : payload?.message ??
                "Unable to update template",
        );
      }

      router.refresh();

      return true;
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to update template",
      );

      return false;
    } finally {
      setLoading(null);
    }
  }

  async function saveChanges() {
    if (!name.trim()) {
      setError(
        "Template name is required.",
      );
      return;
    }

    if (!content.trim()) {
      setError(
        "Template content is required.",
      );
      return;
    }

    const updated =
      await updateTemplate(
        {
          name:
            name.trim(),

          channel:
            initialTemplate.channel,

          content:
            content.trim(),
        },
        "save",
      );

    if (updated) {
      setSuccess(
        "Template changes saved.",
      );
    }
  }

  async function archiveTemplate() {
    const updated =
      await updateTemplate(
        {
          status:
            "ARCHIVED",
        },
        "archive",
      );

    if (updated) {
      setSuccess(
        "Template archived.",
      );
    }
  }

  async function restoreTemplate() {
    const updated =
      await updateTemplate(
        {
          status:
            "ACTIVE",
        },
        "restore",
      );

    if (updated) {
      setSuccess(
        "Template restored.",
      );
    }
  }

  async function deleteTemplate() {
    if (
      !window.confirm(
        "Permanently delete this template? This cannot be undone.",
      )
    ) {
      return;
    }

    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );
      return;
    }

    setLoading(
      "delete",
    );

    setError(null);
    setSuccess(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/businesses/${businessId}/templates/${initialTemplate.id}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
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
            "Unable to delete template",
        );
      }

      router.push(
        "/dashboard/templates",
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to delete template",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label
            htmlFor="template-name"
            className="mb-2 block text-sm font-medium"
          >
            Template name
          </label>

          <input
            id="template-name"
            value={name}
            disabled={
              !canManage
            }
            onChange={(
              event,
            ) =>
              setName(
                event.target
                  .value,
              )
            }
            maxLength={120}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Channel
          </label>

          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium">
            {
              initialTemplate.channel
            }
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="template-content"
              className="text-sm font-medium"
            >
              Message
            </label>

            <span className="text-xs text-slate-400">
              {
                content.length
              }{" "}
              / 1600
            </span>
          </div>

          <textarea
            id="template-content"
            rows={10}
            maxLength={1600}
            disabled={
              !canManage
            }
            value={
              content
            }
            onChange={(
              event,
            ) =>
              setContent(
                event.target
                  .value,
              )
            }
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          />

          <p className="mt-2 text-xs text-slate-500">
            Variables use the{" "}
            {"{{variableName}}"}{" "}
            format.
          </p>
        </div>

        {!canManage && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Your workspace role has
            read-only access to
            templates.
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

        {canManage && (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={
                loading !==
                null
              }
              onClick={
                saveChanges
              }
              className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ===
              "save"
                ? "Saving..."
                : "Save changes"}
            </button>

            {initialTemplate.status ===
            "ACTIVE" ? (
              <button
                type="button"
                disabled={
                  loading !==
                  null
                }
                onClick={
                  archiveTemplate
                }
                className="h-11 rounded-xl border border-amber-200 px-5 text-sm font-semibold text-amber-700 disabled:opacity-50"
              >
                {loading ===
                "archive"
                  ? "Archiving..."
                  : "Archive"}
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  loading !==
                  null
                }
                onClick={
                  restoreTemplate
                }
                className="h-11 rounded-xl border border-emerald-200 px-5 text-sm font-semibold text-emerald-700 disabled:opacity-50"
              >
                {loading ===
                "restore"
                  ? "Restoring..."
                  : "Restore"}
              </button>
            )}

            <button
              type="button"
              disabled={
                loading !==
                null
              }
              onClick={
                deleteTemplate
              }
              className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              {loading ===
              "delete"
                ? "Deleting..."
                : "Delete permanently"}
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold">
            Preview
          </p>

          <div className="mt-4 rounded-xl bg-slate-100 p-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
              {content ||
                "Empty template"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold">
            SMS usage
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">
                Characters
              </dt>

              <dd className="font-semibold">
                {
                  usage.characters
                }
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">
                Encoding
              </dt>

              <dd className="font-semibold">
                {
                  usage.encoding
                }
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">
                SMS pages
              </dt>

              <dd className="font-semibold">
                {
                  usage.pages
                }
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold">
            Variables
          </p>

          {variables.length ===
          0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No variables detected.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {variables.map(
                (
                  variable,
                ) => (
                  <span
                    key={
                      variable
                    }
                    className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                  >
                    {"{{"}
                    {
                      variable
                    }
                    {"}}"}
                  </span>
                ),
              )}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
          <p className="font-semibold">
            Template status
          </p>

          <p className="mt-3 text-slate-500">
            {
              initialTemplate.status
            }
          </p>
        </article>
      </aside>
    </div>
  );
}