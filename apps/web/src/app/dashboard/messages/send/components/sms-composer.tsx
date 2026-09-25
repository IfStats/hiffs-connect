"use client";

import {
  ChangeEvent,
  useMemo,
  useState,
} from "react";

type SmsEncoding =
  | "GSM7"
  | "UCS2";

type SmsUsage = {
  encoding: SmsEncoding;
  characterCount: number;
  unitsUsed: number;
  segmentCount: number;
};

const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const GSM7_EXTENSION =
  "^{}\\[~]|€";

function calculateGsm7Units(
  text: string,
): number | null {
  let units = 0;

  for (const character of text) {
    if (
      GSM7_BASIC.includes(character)
    ) {
      units += 1;
      continue;
    }

    if (
      GSM7_EXTENSION.includes(
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

function calculateSmsUsage(
  text: string,
): SmsUsage {
  const gsm7Units =
    calculateGsm7Units(text);

  if (gsm7Units !== null) {
    return {
      encoding: "GSM7",

      characterCount:
        text.length,

      unitsUsed:
        gsm7Units,

      segmentCount:
        gsm7Units === 0
          ? 0
          : gsm7Units <= 160
            ? 1
            : Math.ceil(
                gsm7Units / 153,
              ),
    };
  }

  const unitsUsed =
    text.length;

  return {
    encoding: "UCS2",

    characterCount:
      text.length,

    unitsUsed,

    segmentCount:
      unitsUsed === 0
        ? 0
        : unitsUsed <= 70
          ? 1
          : Math.ceil(
              unitsUsed / 67,
            ),
  };
}

export function SmsComposer() {
  const [text, setText] =
    useState("");

  const usage =
    useMemo(
      () =>
        calculateSmsUsage(text),
      [text],
    );

  function handleChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setText(
      event.target.value,
    );
  }

  const pageLabel =
    usage.segmentCount === 1
      ? "SMS page"
      : "SMS pages";

  const encodingLabel =
    usage.encoding === "GSM7"
      ? "GSM-7"
      : "Unicode";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label
          htmlFor="message"
          className="text-sm font-medium"
        >
          Message
        </label>

        <span className="text-xs text-slate-400">
          {usage.characterCount} / 1600
        </span>
      </div>

      <textarea
        id="message"
        name="text"
        rows={8}
        maxLength={1600}
        value={text}
        onChange={handleChange}
        placeholder="Enter your message..."
        className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Characters
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {usage.characterCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Encoding
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {encodingLabel}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            SMS usage
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {usage.segmentCount}{" "}
            {pageLabel}
          </p>
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        GSM-7 messages use up to 160
        characters for one SMS page and
        153 units per page when
        concatenated. Unicode messages
        use up to 70 characters for one
        page and 67 units per page when
        concatenated.
      </p>

      {usage.encoding ===
        "UCS2" &&
        text.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            This message contains
            Unicode characters. Unicode
            SMS has a lower per-page
            capacity and may therefore
            use more billable SMS pages.
          </div>
        )}
    </div>
  );
}