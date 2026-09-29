'use client';

import {
  useState,
  useTransition,
} from 'react';

import {
  resendUserEmailVerification,
} from './actions';

type Props = {
  userId: string;
  email: string;
  verified: boolean;
};

export function EmailVerificationControls({
  userId,
  email,
  verified,
}: Props) {
  const [
    feedback,
    setFeedback,
  ] =
    useState<{
      type:
        | 'success'
        | 'error';
      message: string;
    } | null>(null);

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  function handleResend() {
    const confirmed =
      window.confirm(
        `Send a new verification email to ${email}?`,
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(
      async () => {
        const result =
          await resendUserEmailVerification(
            userId,
          );

        setFeedback({
          type:
            result.ok
              ? 'success'
              : 'error',
          message:
            result.message,
        });
      },
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Email verification
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Send a fresh verification
            challenge to this user&apos;s
            registered email address.
          </p>

          <p className="mt-3 break-all text-sm font-medium text-slate-700">
            {email}
          </p>
        </div>

        <span
          className={
            verified
              ? 'inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
              : 'inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
          }
        >
          {verified
            ? 'VERIFIED'
            : 'PENDING'}
        </span>
      </div>

      {verified ? (
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          No action is required.
          This email address is
          already verified.
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Sending a new verification
            email invalidates the
            previous verification code.
            The new code is valid for
            10 minutes.
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? 'Sending...'
              : 'Resend verification email'}
          </button>
        </>
      )}

      {feedback && (
        <div
          className={
            feedback.type ===
            'success'
              ? 'mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
              : 'mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'
          }
        >
          {feedback.message}
        </div>
      )}
    </section>
  );
}