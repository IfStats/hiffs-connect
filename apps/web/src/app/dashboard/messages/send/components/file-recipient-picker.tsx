"use client";

import {
  ChangeEvent,
  useMemo,
  useState,
} from "react";

type Props = {
  value: string[];
  onChange: (recipients: string[]) => void;
  maxRecipients?: number;
};

type ParsedRecipient = {
  value: string;
  valid: boolean;
};

const PHONE_PATTERN =
  /^\+[1-9]\d{7,14}$/;

function normalizeValue(
  value: string,
) {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\s()-]/g, "");
}

function extractRecipients(
  text: string,
): ParsedRecipient[] {
  const cells = text
    .split(/[\r\n,;\t]+/)
    .map(normalizeValue)
    .filter(Boolean);

  const likelyPhones =
    cells.filter(
      (cell) =>
        cell.startsWith("+") ||
        /^\d{8,15}$/.test(cell),
    );

  const unique = [
    ...new Set(likelyPhones),
  ];

  return unique.map((phone) => ({
    value: phone,
    valid:
      PHONE_PATTERN.test(phone),
  }));
}

export function FileRecipientPicker({
  value,
  onChange,
  maxRecipients = 100,
}: Props) {
  const [fileName, setFileName] =
    useState("");

  const [parsed, setParsed] =
    useState<ParsedRecipient[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const validRecipients =
    useMemo(
      () =>
        parsed
          .filter(
            (item) => item.valid,
          )
          .map(
            (item) => item.value,
          ),
      [parsed],
    );

  const invalidRecipients =
    useMemo(
      () =>
        parsed.filter(
          (item) => !item.valid,
        ),
      [parsed],
    );

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    setError(null);
    setParsed([]);
    onChange([]);

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      extension !== "csv" &&
      extension !== "txt"
    ) {
      setError(
        "Upload a CSV or TXT file. XLSX support will be added separately.",
      );
      return;
    }

    try {
      const text =
        await file.text();

      const recipients =
        extractRecipients(text);

      if (
        recipients.length === 0
      ) {
        setError(
          "No phone numbers were detected in this file.",
        );
        return;
      }

      setParsed(recipients);

      const valid =
        recipients
          .filter(
            (item) =>
              item.valid,
          )
          .map(
            (item) =>
              item.value,
          );

      if (
        valid.length >
        maxRecipients
      ) {
        setError(
          `This file contains ${valid.length} valid recipients. The current batch limit is ${maxRecipients}.`,
        );

        return;
      }

      onChange(valid);
    } catch {
      setError(
        "Unable to read this file.",
      );
    }
  }

  function clearFile() {
    setFileName("");
    setParsed([]);
    setError(null);
    onChange([]);
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="recipient-file"
          className="mb-2 block text-sm font-medium"
        >
          Recipient file
        </label>

        <input
          id="recipient-file"
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={handleFile}
          className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Upload CSV or TXT.
          Numbers must use
          international E.164
          format, for example
          +233XXXXXXXXX.
          Uploaded recipients are
          not saved to Contacts.
        </p>
      </div>

      {fileName && (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-950">
                {fileName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {
                  validRecipients.length
                }{" "}
                valid ·{" "}
                {
                  invalidRecipients.length
                }{" "}
                invalid
              </p>
            </div>

            <button
              type="button"
              onClick={clearFile}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {parsed.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>
              Recipient
            </span>

            <span>
              Status
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {parsed.map(
              (recipient) => (
                <div
                  key={
                    recipient.value
                  }
                  className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="break-all">
                    {
                      recipient.value
                    }
                  </span>

                  <span
                    className={
                      recipient.valid
                        ? "font-medium text-emerald-700"
                        : "font-medium text-red-700"
                    }
                  >
                    {recipient.valid
                      ? "Valid"
                      : "Invalid"}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {value.length}{" "}
            recipient
            {value.length === 1
              ? ""
              : "s"}{" "}
            ready
          </p>

          <p className="mt-1 text-xs text-emerald-800">
            Only valid,
            deduplicated numbers
            will be submitted.
          </p>
        </div>
      )}
    </div>
  );
}