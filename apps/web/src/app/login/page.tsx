'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    const formData =
      new FormData(event.currentTarget);

    const email =
      String(formData.get('email') ?? '');

    const password =
      String(formData.get('password') ?? '');

    const result =
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

    setLoading(false);

    if (!result?.ok) {
  const authError =
    result?.error ?? '';

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  if (
    authError.includes(
      'EMAIL_NOT_VERIFIED',
    )
  ) {
    router.push(
      `/verify-email?email=${encodeURIComponent(
        normalizedEmail,
      )}`,
    );

    return;
  }

  if (
    authError.includes(
      'PHONE_NOT_VERIFIED',
    )
  ) {
    const phoneVerificationEnabled =
      process.env
        .NEXT_PUBLIC_PHONE_VERIFICATION_ENABLED ===
      'true';

    if (
      phoneVerificationEnabled
    ) {
      router.push(
        `/verify-phone?email=${encodeURIComponent(
          normalizedEmail,
        )}`,
      );

      return;
    }
  }

  setError(
    'Invalid email or password',
  );

  return;
}

    router.push('/dashboard');
    router.refresh();
  }

  return (
  <main className="grid min-h-screen bg-white lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.25),transparent_35%)]" />

      <div className="relative">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 font-black">
            HC
          </div>

          <div>
            <p className="font-bold">
              Hiffs Connect
            </p>

            <p className="text-xs text-slate-400">
              Business Messaging
            </p>
          </div>
        </Link>
      </div>

      <div className="relative max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          Reliable • Fast • Global
        </p>

        <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight">
          Business messaging infrastructure built to scale.
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-400">
          Send customer communications, manage
          sender identities, monitor delivery and
          integrate messaging into your applications.
        </p>
      </div>

      <p className="relative text-sm text-slate-500">
        © 2026 Hiffs Global Enterprises
      </p>
    </section>

    <section className="flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">
              HC
            </div>

            <span className="font-bold">
              Hiffs Connect
            </span>
          </Link>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
          <p className="text-sm font-semibold text-blue-600">
            Welcome back
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Sign in to your workspace
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Access messaging, billing, senders,
            reports and developer tools.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            New to Hiffs Connect?{' '}
            <Link
              href="/signup"
              className="font-semibold text-blue-600"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>
);
}