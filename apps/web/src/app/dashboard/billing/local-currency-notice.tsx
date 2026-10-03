"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  walletCurrency: string;
};

type LocalCurrencyResponse = {
  countryCode:
    | string
    | null;

  currency:
    | string
    | null;

  source:
    | "ip"
    | "unavailable";
};

type FxQuote = {
  id: string;

  status:
    | "QUOTED"
    | "EXPIRED"
    | "COMPLETED"
    | string;

  fromCurrency: string;
  toCurrency: string;

  sourceAmount:
    | string
    | number;

  targetAmount:
    | string
    | number;

  marketRate:
    | string
    | number;

  appliedRate:
    | string
    | number;

  feeAmount:
    | string
    | number
    | null;

  feeCurrency:
    | string
    | null;

  provider: string;

  expiresAt: string;
};

function formatMoney(
  value:
    | string
    | number,
  currency: string,
) {
  const amount =
    Number(value);

  if (
    Number.isNaN(amount)
  ) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat(
    "en",
    {
      style:
        "currency",

      currency,
    },
  ).format(amount);
}

function getErrorMessage(
  payload: unknown,
  fallback: string,
) {
  if (
    payload &&
    typeof payload ===
      "object" &&
    "message" in payload
  ) {
    const message =
      (
        payload as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }

    if (
      Array.isArray(
        message,
      )
    ) {
      return message.join(
        ", ",
      );
    }
  }

  return fallback;
}

export function LocalCurrencyNotice({
  walletCurrency,
}: Props) {
  const router =
    useRouter();

  const [
    localCurrency,
    setLocalCurrency,
  ] =
    useState<LocalCurrencyResponse | null>(
      null,
    );

  const [
    quote,
    setQuote,
  ] =
    useState<FxQuote | null>(
      null,
    );

  const [
    loadingQuote,
    setLoadingQuote,
  ] =
    useState(false);

  const [
    confirming,
    setConfirming,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const controller =
      new AbortController();

    async function load() {
      try {
        const response =
          await fetch(
            "/api/dashboard/local-currency",
            {
              cache:
                "no-store",

              signal:
                controller.signal,
            },
          );

        if (!response.ok) {
          return;
        }

        const result =
          (await response.json()) as LocalCurrencyResponse;

        setLocalCurrency(
          result,
        );
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
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, []);

  async function requestQuote() {
    if (
      !localCurrency?.currency
    ) {
      return;
    }

    setLoadingQuote(
      true,
    );

    setError(
      null,
    );

    setQuote(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/dashboard/wallet/fx/quote",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                toCurrency:
                  localCurrency.currency,
              }),
          },
        );

      const payload:
        unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok
      ) {
        throw new Error(
          getErrorMessage(
            payload,
            "Unable to create FX quote",
          ),
        );
      }

      setQuote(
        payload as FxQuote,
      );
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to create FX quote",
      );
    } finally {
      setLoadingQuote(
        false,
      );
    }
  }

  async function confirmConversion() {
    if (!quote) {
      return;
    }

    setConfirming(
      true,
    );

    setError(
      null,
    );

    try {
      const response =
        await fetch(
          `/api/dashboard/wallet/fx/${encodeURIComponent(
            quote.id,
          )}/confirm`,
          {
            method:
              "POST",
          },
        );

      const payload:
        unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (
        !response.ok
      ) {
        throw new Error(
          getErrorMessage(
            payload,
            "Unable to complete FX conversion",
          ),
        );
      }

      setQuote(
        null,
      );

      /*
       * Reload the server-rendered
       * wallet and transaction data.
       */
      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to complete FX conversion",
      );
    } finally {
      setConfirming(
        false,
      );
    }
  }

  if (
    !localCurrency?.currency ||
    localCurrency.currency ===
      walletCurrency
  ) {
    return null;
  }

  const quoteExpired =
    quote
      ? new Date(
          quote.expiresAt,
        ).getTime() <=
        Date.now()
      : false;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div>
        <p className="font-semibold text-amber-950">
          Local currency differs
          from your wallet
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Your wallet is currently
          denominated in{" "}
          <strong>
            {walletCurrency}
          </strong>
          , while your current
          location suggests{" "}
          <strong>
            {
              localCurrency.currency
            }
          </strong>
          {localCurrency.countryCode
            ? ` (${localCurrency.countryCode})`
            : ""}
          .
        </p>

        <p className="mt-2 text-xs leading-5 text-amber-700">
          Your balance will never
          be converted automatically.
          A live FX quote and your
          confirmation are required.
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!quote ? (
        <div className="mt-5">
          <button
            type="button"
            disabled={
              loadingQuote
            }
            onClick={
              requestQuote
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingQuote
              ? "Getting FX quote..."
              : `Get ${walletCurrency} → ${localCurrency.currency} quote`}
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current balance
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(
                  quote.sourceAmount,
                  quote.fromCurrency,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Converted balance
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(
                  quote.targetAmount,
                  quote.toCurrency,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Market rate
              </p>

              <p className="mt-1 text-sm font-medium text-slate-950">
                1{" "}
                {
                  quote.fromCurrency
                }{" "}
                ={" "}
                {Number(
                  quote.marketRate,
                ).toLocaleString(
                  "en",
                  {
                    maximumFractionDigits:
                      8,
                  },
                )}{" "}
                {
                  quote.toCurrency
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Applied rate
              </p>

              <p className="mt-1 text-sm font-medium text-slate-950">
                1{" "}
                {
                  quote.fromCurrency
                }{" "}
                ={" "}
                {Number(
                  quote.appliedRate,
                ).toLocaleString(
                  "en",
                  {
                    maximumFractionDigits:
                      8,
                  },
                )}{" "}
                {
                  quote.toCurrency
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                FX fee
              </p>

              <p className="mt-1 text-sm font-medium text-slate-950">
                {quote.feeAmount !==
                  null &&
                quote.feeCurrency
                  ? formatMoney(
                      quote.feeAmount,
                      quote.feeCurrency,
                    )
                  : "None"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Quote expires
              </p>

              <p className="mt-1 text-sm font-medium text-slate-950">
                {new Intl.DateTimeFormat(
                  "en-GH",
                  {
                    dateStyle:
                      "medium",

                    timeStyle:
                      "medium",
                  },
                ).format(
                  new Date(
                    quote.expiresAt,
                  ),
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            Confirming will change
            your monetary wallet from{" "}
            <strong>
              {
                quote.fromCurrency
              }
            </strong>{" "}
            to{" "}
            <strong>
              {
                quote.toCurrency
              }
            </strong>
            . Your SMS units will not
            be converted or changed.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {quoteExpired ? (
              <button
                type="button"
                onClick={
                  requestQuote
                }
                disabled={
                  loadingQuote
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Get new quote
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  confirmConversion
                }
                disabled={
                  confirming
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming
                  ? "Converting..."
                  : `Confirm conversion to ${quote.toCurrency}`}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setQuote(
                  null,
                );

                setError(
                  null,
                );
              }}
              disabled={
                confirming
              }
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}