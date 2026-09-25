"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

type ParsedContact = {
  phone: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  source?: string;
};

type ImportSummary = {
  total: number;
  created: number;
  skipped: number;
  invalid: number;
  suppressed: number;
  duplicatesInFile: number;
};

function parseCsvLine(
  line: string,
): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (character === '"') {
      if (
        quoted &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      character === "," &&
      !quoted
    ) {
      values.push(
        current.trim(),
      );

      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}

function normalizeHeader(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      "",
    );
}

function parseCsv(
  text: string,
): ParsedContact[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(
      (line) =>
        line.trim().length > 0,
    );

  if (lines.length < 2) {
    throw new Error(
      "CSV must contain a header row and at least one contact.",
    );
  }

  const headers =
    parseCsvLine(lines[0]).map(
      normalizeHeader,
    );

  const phoneIndex =
    headers.findIndex(
      (header) =>
        header === "phone" ||
        header ===
          "phonenumber" ||
        header === "mobile",
    );

  if (phoneIndex === -1) {
    throw new Error(
      "CSV must include a phone column.",
    );
  }

  const column = (
    ...names: string[]
  ) =>
    headers.findIndex(
      (header) =>
        names.includes(header),
    );

  const firstNameIndex =
    column(
      "firstname",
      "first",
    );

  const lastNameIndex =
    column(
      "lastname",
      "last",
      "surname",
    );

  const displayNameIndex =
    column(
      "displayname",
      "name",
      "fullname",
    );

  const emailIndex =
    column("email");

  const sourceIndex =
    column("source");

  return lines
    .slice(1)
    .map((line) => {
      const values =
        parseCsvLine(line);

      const value = (
        index: number,
      ) =>
        index >= 0
          ? values[index]?.trim()
          : undefined;

      return {
        phone:
          value(phoneIndex) ??
          "",

        firstName:
          value(firstNameIndex) ||
          undefined,

        lastName:
          value(lastNameIndex) ||
          undefined,

        displayName:
          value(
            displayNameIndex,
          ) || undefined,

        email:
          value(emailIndex) ||
          undefined,

        source:
          value(sourceIndex) ||
          "CSV_IMPORT",
      };
    })
    .filter(
      (contact) =>
        Object.values(contact).some(
          Boolean,
        ),
    );
}

export default function ImportContactsPage() {
  const { data: session } =
    useSession();

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  const [contacts, setContacts] =
    useState<ParsedContact[]>(
      [],
    );

  const [fileName, setFileName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [summary, setSummary] =
    useState<ImportSummary | null>(
      null,
    );

  const preview = useMemo(
    () => contacts.slice(0, 10),
    [contacts],
  );

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    setContacts([]);
    setSummary(null);
    setError(null);

    if (!file) {
      setFileName("");
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a CSV file.",
      );
      return;
    }

    try {
      const text =
        await file.text();

      const parsed =
        parseCsv(text);

      if (
        parsed.length === 0
      ) {
        throw new Error(
          "No contacts were found in the CSV.",
        );
      }

      setFileName(
        file.name,
      );

      setContacts(
        parsed,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to parse CSV",
      );
    }
  }

  async function handleImport() {
    if (
      !businessId ||
      !accessToken
    ) {
      setError(
        "Your authenticated business session is unavailable.",
      );
      return;
    }

    if (
      contacts.length === 0
    ) {
      setError(
        "Choose a CSV file first.",
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
    setSummary(null);

    try {
      const response =
        await fetch(
          `${apiUrl}/businesses/${businessId}/contacts/import`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              contacts,
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
                "Contact import failed",
        );
      }

      setSummary(
        data as ImportSummary,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Contact import failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Contacts
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Audience
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Import contacts
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Upload contacts from CSV.
          Existing phone numbers are
          skipped, and unsubscribed or
          blocked contacts remain
          suppressed.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              void handleFile(
                event,
              )
            }
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white"
          />

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Required column:
            <strong>
              {" "}
              phone
            </strong>
            . Optional columns:
            firstName, lastName,
            displayName, email,
            source.
          </p>

          {fileName && (
            <p className="mt-3 text-sm font-medium text-slate-700">
              {fileName} ·{" "}
              {
                contacts.length
              }{" "}
              row
              {contacts.length ===
              1
                ? ""
                : "s"}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {contacts.length >
          0 && (
          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Preview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  First{" "}
                  {
                    preview.length
                  }{" "}
                  rows from the
                  uploaded file.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleImport()
                }
                disabled={
                  loading
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Importing..."
                  : `Import ${contacts.length} contacts`}
              </button>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Phone
                    </th>
                    <th className="px-4 py-3">
                      First name
                    </th>
                    <th className="px-4 py-3">
                      Last name
                    </th>
                    <th className="px-4 py-3">
                      Display name
                    </th>
                    <th className="px-4 py-3">
                      Email
                    </th>
                    <th className="px-4 py-3">
                      Source
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {preview.map(
                    (
                      contact,
                      index,
                    ) => (
                      <tr
                        key={`${contact.phone}-${index}`}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {
                            contact.phone
                          }
                        </td>
                        <td className="px-4 py-3">
                          {contact.firstName ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          {contact.lastName ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          {contact.displayName ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          {contact.email ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">
                          {contact.source ??
                            "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {summary && (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-semibold text-emerald-950">
              Import complete
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Result
                label="Total"
                value={
                  summary.total
                }
              />

              <Result
                label="Created"
                value={
                  summary.created
                }
              />

              <Result
                label="Skipped"
                value={
                  summary.skipped
                }
              />

              <Result
                label="Suppressed"
                value={
                  summary.suppressed
                }
              />

              <Result
                label="Invalid"
                value={
                  summary.invalid
                }
              />

              <Result
                label="File duplicates"
                value={
                  summary.duplicatesInFile
                }
              />
            </div>

            <Link
              href="/dashboard/contacts"
              className="mt-5 inline-flex text-sm font-medium text-emerald-800"
            >
              View contacts →
            </Link>
          </section>
        )}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-950">
          Suppression protection
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Existing blocked or
          unsubscribed phone numbers are
          never reactivated by a CSV
          import. This protects opt-out
          status across future audience
          uploads.
        </p>
      </section>
    </div>
  );
}

function Result({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <p className="text-xs text-emerald-700">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-emerald-950">
        {value}
      </p>
    </div>
  );
}