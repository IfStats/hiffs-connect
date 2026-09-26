'use client';

import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  email: string;
};

type SendCodeResponse = {
  accepted?: boolean;
  cooldownSeconds?: number;
};

export function VerifyPhoneForm({
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

  const [sending, setSending] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(0);

  const initialRequestSent =
    useRef(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_HIFFS_API_URL ??
    'http://localhost:4000';

  const sendCode =
    useCallback(
      async () => {
        if (sending) {
          return;
        }

        setSending(true);
        setError(null);
        setMessage(null);

        try {
          const response =
            await fetch(
              `${apiBaseUrl}/auth/phone/send-code`,
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

          const payload =
            (await response.json()) as
              SendCodeResponse & {
                message?: string | string[];
              };

          if (!response.ok) {
            throw new Error(
              Array.isArray(
                payload?.message,
              )
                ? payload.message.join(
                    ', ',
                  )
                : payload?.message ??
                    'Unable to send verification code',
            );
          }

          setCooldown(
            payload.cooldownSeconds ??
              60,
          );

          setMessage(
            'A 6-digit verification code has been sent to your phone.',
          );
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to send verification code',
          );
        } finally {
          setSending(false);
        }
      },
      [
        apiBaseUrl,
        email,
        sending,
      ],
    );

  useEffect(() => {
    if (
      initialRequestSent.current
    ) {
      return;
    }

    initialRequestSent.current =
      true;

    void sendCode();
  }, [sendCode]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setCooldown(
          (current) =>
            current <= 1
              ? 0
              : current - 1,
        );
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

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
      const response =
        await fetch(
          `${apiBaseUrl}/auth/phone/verify`,
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
                'Phone verification failed',
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
          : 'Unable to verify phone number',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (
      sending ||
      cooldown > 0
    ) {
      return;
    }

    setCode('');

    await sendCode();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10">
        <p className="text-sm font-semibold text-blue-600">
          Phone verification
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Verify your number
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          Enter the 6-digit code sent
          to the phone number attached
          to your Hiffs Connect account.
        </p>

        <p className="mt-2 break-all text-sm font-semibold text-slate-900">
          {email}
        </p>

        <form
          onSubmit={handleVerify}
          className="mt-8"
        >
          <label
            htmlFor="phone-code"
            className="text-sm font-medium text-slate-700"
          >
            Verification code
          </label>

          <input
            id="phone-code"
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
                  .replace(
                    /\D/g,
                    '',
                  )
                  .slice(
                    0,
                    6,
                  );

              setCode(value);
            }}
            placeholder="000000"
            className="mt-2 h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-bold tracking-[0.35em] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <p className="mt-2 text-xs text-slate-400">
            The verification code
            expires after 5 minutes.
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
              : 'Verify phone'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive the code?
          </p>

          <button
            type="button"
            onClick={
              handleResend
            }
            disabled={
              sending ||
              cooldown > 0
            }
            className="mt-2 text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? 'Sending...'
              : cooldown > 0
                ? `Send again in ${cooldown}s`
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