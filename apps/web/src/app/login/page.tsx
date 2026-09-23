'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
      setError(
        'Invalid email or password',
      );

      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-md">
        <h1 className="text-3xl font-semibold">
          Hiffs Connect
        </h1>

        <p className="mt-2 text-sm opacity-70">
          Sign in to your business workspace.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit}
        >
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
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
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
              autoComplete="current-password"
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded border px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}