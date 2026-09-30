'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

type Props = {
  businessId: string;
  initialSmsUnits: number;
};

type Action =
  | 'credit'
  | 'debit';

export default function SmsUnitActions({
  businessId,
  initialSmsUnits,
}: Props) {
  const router =
    useRouter();

  const [units, setUnits] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [loading, setLoading] =
    useState<Action | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [success, setSuccess] =
    useState<string | null>(
      null,
    );

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nativeEvent =
      event.nativeEvent as SubmitEvent;

    const submitter =
      nativeEvent.submitter as
        | HTMLButtonElement
        | null;

    const action: Action =
      submitter?.value ===
      'debit'
        ? 'debit'
        : 'credit';

    const parsedUnits =
      Number(units);

    const trimmedReason =
      reason.trim();

    setError(null);
    setSuccess(null);

    if (
      !Number.isInteger(
        parsedUnits,
      ) ||
      parsedUnits <= 0
    ) {
      setError(
        'Enter a valid number of SMS units.',
      );

      return;
    }

    if (!trimmedReason) {
      setError(
        'Reason is required.',
      );

      return;
    }

    if (
      action === 'debit' &&
      parsedUnits >
        initialSmsUnits
    ) {
      setError(
        `Cannot deduct ${parsedUnits.toLocaleString()} units. Current balance is ${initialSmsUnits.toLocaleString()}.`,
      );

      return;
    }

    if (
      action === 'debit' &&
      !window.confirm(
        `Deduct ${parsedUnits.toLocaleString()} SMS units from this business?`,
      )
    ) {
      return;
    }

    setLoading(action);

    try {
      const response =
        await fetch(
          `/api/admin/businesses/${encodeURIComponent(
            businessId,
          )}/sms-units`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                action,
                units:
                  parsedUnits,
                reason:
                  trimmedReason,
              }),
          },
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Unable to update SMS units',
        );
      }

      setSuccess(
        action === 'credit'
          ? `${parsedUnits.toLocaleString()} SMS units credited.`
          : `${parsedUnits.toLocaleString()} SMS units deducted.`,
      );

      setUnits('');
      setReason('');

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : 'Unable to update SMS units',
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Current balance
        </p>

        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {initialSmsUnits.toLocaleString()}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          SMS units
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={
          handleSubmit
        }
      >
        <div>
          <label
            htmlFor="sms-units"
            className="text-sm font-medium text-slate-700"
          >
            Units
          </label>

          <input
            id="sms-units"
            type="number"
            min="1"
            step="1"
            required
            value={units}
            onChange={(
              event,
            ) =>
              setUnits(
                event.target
                  .value,
              )
            }
            placeholder="1000"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div>
          <label
            htmlFor="sms-unit-reason"
            className="text-sm font-medium text-slate-700"
          >
            Reason
          </label>

          <textarea
            id="sms-unit-reason"
            required
            value={reason}
            onChange={(
              event,
            ) =>
              setReason(
                event.target
                  .value,
              )
            }
            placeholder="Purchased messaging package"
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            value="credit"
            disabled={
              loading !== null
            }
            className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ===
            'credit'
              ? 'Crediting...'
              : 'Credit units'}
          </button>

          <button
            type="submit"
            value="debit"
            disabled={
              loading !== null
            }
            className="h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ===
            'debit'
              ? 'Debiting...'
              : 'Debit units'}
          </button>
        </div>
      </form>
    </div>
  );
}