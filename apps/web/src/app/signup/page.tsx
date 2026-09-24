'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
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

      const signInResult =
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

      if (!signInResult?.ok) {
        setError(
          'Account created, but automatic sign-in failed. Please sign in manually.',
        );

        setLoading(false);
        return;
      }

      router.push('/dashboard/onboarding');
      router.refresh();
    } catch {
      setError(
        'Unable to reach Hiffs Connect. Please try again.',
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <section className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Hiffs Connect
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Create your business workspace
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your account and start configuring messaging,
              sender identities and API access.
            </p>
          </div>

          <form
            className="mt-8 grid gap-5 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium"
              >
                Your name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium"
              >
                Business name
              </label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="countryCode"
                className="block text-sm font-medium"
              >
                Country code
              </label>

              <input
                id="countryCode"
                name="countryCode"
                type="text"
                required
                maxLength={2}
                defaultValue="GH"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium"
              >
                Website
              </label>

              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            {error ? (
              <p className="sm:col-span-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading
                  ? 'Creating workspace...'
                  : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}