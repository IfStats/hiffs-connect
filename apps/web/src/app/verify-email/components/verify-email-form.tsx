'use client';

import Link from 'next/link';
import {
  FormEvent,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  email: string;
};

export function VerifyEmailForm({
  email,
}: Props) {
  const router = useRouter();

  const [code, setCode] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_HIFFS_API_URL ??
    'http://localhost:4000';

  async function handleVerify(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError(
        'Enter the 6-digit verification code.',
      );
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/verify-email`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email,
            code,
          }),
        },
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            payload?.message,
          )
            ? payload.message.join(
                ', ',
              )
            : payload?.message ??
                'Verification failed',
        );
      }

      router.push(
        '/login?verified=true',
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to verify email',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/resend-verification`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          'Unable to resend verification code',
        );
      }

      setCode('');

      setMessage(
        'If the account is eligible, a new verification code has been sent.',
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to resend verification code',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10">
        <p className="text-sm font-semibold text-blue-600">
          Account verification
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Check your email
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          We sent a 6-digit verification
          code to
        </p>

        <p className="mt-1 break-all text-sm font-semibold text-slate-900">
          {email}
        </p>

        <form
          onSubmit={handleVerify}
          className="mt-8"
        >
          <label
            htmlFor="verification-code"
            className="text-sm font-medium text-slate-700"
          >
            Verification code
          </label>

          <input
            id="verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6);

              setCode(value);
            }}
            placeholder="000000"
            className="mt-2 h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-bold tracking-[0.35em] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <p className="mt-2 text-xs text-slate-400">
            The code expires after
            10 minutes.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              code.length !== 6
            }
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Verifying...'
              : 'Verify email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive the code?
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-2 text-sm font-semibold text-blue-600 disabled:opacity-50"
          >
            {resending
              ? 'Sending...'
              : 'Send another code'}
          </button>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}