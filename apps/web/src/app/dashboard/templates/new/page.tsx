"use client";

import Link from "next/link";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useSession,
} from "next-auth/react";

function gsm7Length(
  text: string,
) {
  const basic =
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

  const extension =
    "^{}\\[~]|€";

  let units = 0;

  for (const character of text) {
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
    gsm7Length(text);

  if (gsmUnits !== null) {
    return {
      encoding: "GSM-7",
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
    encoding: "Unicode",
    characters:
      text.length,
    pages:
      text.length === 0
        ? 0
        : text.length <= 70
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

export default function NewTemplatePage() {
  const router =
    useRouter();

  const {
    data: session,
  } = useSession();

  const [
    name,
    setName,
  ] = useState("");

  const [
    content,
    setContent,
  ] = useState("");

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

  const businessId =
    session?.user
      ?.businessId;

  const accessToken =
    session?.user
      ?.accessToken;

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
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

    const apiUrl =
      process.env
        .NEXT_PUBLIC_HIFFS_API_URL;

    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );

      return;
    }

    if (!name.trim()) {
      setError(
        "Template name is required.",
      );

      return;
    }

    if (
      !content.trim()
    ) {
      setError(
        "Template content is required.",
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/businesses/${businessId}/templates`,
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
              JSON.stringify({
                name:
                  name.trim(),

                channel:
                  "SMS",

                content:
                  content.trim(),
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
          Array.isArray(
            payload?.message,
          )
            ? payload.message.join(
                ", ",
              )
            : payload?.message ??
                "Unable to create template",
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
          : "Unable to create template",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/dashboard/templates"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Templates
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Messaging content
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create template
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Build reusable SMS content
          with optional dynamic
          placeholders.
        </p>
      </section>

      <form
        onSubmit={
          handleSubmit
        }
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
      >
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
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              required
              maxLength={120}
              placeholder="Order ready"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium"
            >
              Channel
            </label>

            <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
              SMS
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
              required
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
              placeholder="Hello {{firstName}}, your order is ready."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use placeholders such as{" "}
              {"{{firstName}}"} or{" "}
              {"{{orderNumber}}"}.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/templates"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                loading
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create template"}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold">
              SMS preview
            </p>

            <div className="mt-4 rounded-xl bg-slate-100 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {content ||
                  "Your message preview will appear here."}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold">
              SMS usage
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Characters
                </dt>

                <dd className="font-semibold">
                  {
                    usage.characters
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">
                  Encoding
                </dt>

                <dd className="font-semibold">
                  {
                    usage.encoding
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-4">
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
                  (variable) => (
                    <span
                      key={
                        variable
                      }
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                    >
                      {"{{"}
                      {variable}
                      {"}}"}
                    </span>
                  ),
                )}
              </div>
            )}
          </article>
        </aside>
      </form>
    </div>
  );
}