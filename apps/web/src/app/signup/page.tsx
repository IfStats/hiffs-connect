'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
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
      String(formData.get('email') ?? '')
        .trim()
        .toLowerCase();

    const password =
      String(formData.get('password') ?? '');

    const name =
      String(formData.get('name') ?? '').trim();

    const businessName =
      String(
        formData.get('businessName') ?? '',
      ).trim();

    const countryCode =
      String(
        formData.get('countryCode') ?? '',
      )
        .trim()
        .toUpperCase();

    const phone =
      String(formData.get('phone') ?? '').trim();

    const website =
      String(
        formData.get('website') ?? '',
      ).trim();

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_HIFFS_API_URL ??
      'http://localhost:4000';

    try {
      const response = await fetch(
        `${apiBaseUrl}/auth/signup`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email,
            password,
            name,
            businessName,
            countryCode,
            businessEmail: email,
            phone: phone || undefined,
            website: website || undefined,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        setError(
          payload?.message ??
            'Unable to create account',
        );

        setLoading(false);
        return;
      }

      router.push(
  `/verify-email?email=${encodeURIComponent(
    email,
  )}`,
);

router.refresh();
    } catch {
      setError(
        'Unable to reach Hiffs Connect. Please try again.',
      );

      setLoading(false);
    }
  }

  return (
  <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
    <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.25),transparent_35%)]" />

      <div className="relative">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 font-black shadow-lg shadow-blue-950/40">
            HC

            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
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
          Build better customer communication from one platform.
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-400">
          Create your Hiffs Connect workspace to manage
          messaging, sender identities, API integrations,
          wallet funding and delivery reporting.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            'Business SMS',
            'API Integration',
            'Sender Management',
            'Delivery Reporting',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-sm text-blue-300">
                ✓
              </div>

              <span className="text-sm text-slate-300">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <p className="text-sm text-slate-500">
          A product of Hiffs Global Enterprises
        </p>

        <p className="mt-1 text-xs text-slate-600">
          © 2026 Hiffs Global Enterprises
        </p>
      </div>
    </section>

    <section className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between lg:hidden">
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

          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600"
          >
            Sign in
          </Link>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Get started
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Create your business workspace
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Set up your account and prepare your
              business for messaging, sender approval
              and API access.
            </p>
          </div>

          <form
            className="mt-8 grid gap-5 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700"
              >
                Your name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Joshua Akunna"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Work email
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
                htmlFor="businessName"
                className="text-sm font-medium text-slate-700"
              >
                Business name
              </label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                placeholder="Your company"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="countryCode"
                className="text-sm font-medium text-slate-700"
              >
                Country
              </label>

              <select
                id="countryCode"
                name="countryCode"
                required
                defaultValue="GH"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="GH">
                  Ghana
                </option>

                <option value="NG">
                  Nigeria
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700"
              >
                Phone number
              </label>

              <input
  id="phone"
  name="phone"
  type="tel"
  required
  autoComplete="tel"
  pattern="\+[1-9][0-9]{7,14}"
  placeholder="+233XXXXXXXXX"
  title="Use international format, for example +233XXXXXXXXX"
  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
/>
            </div>

            <div>
              <label
                htmlFor="website"
                className="text-sm font-medium text-slate-700"
              >
                Website
              </label>

              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="sm:col-span-2">
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
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-2 text-xs text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            {error && (
              <div className="sm:col-span-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Creating workspace...'
                  : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs leading-5 text-slate-400">
            By creating an account, you agree to
            Hiffs Connect&apos;s Terms of Service and
            Privacy Policy.
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>
);
}