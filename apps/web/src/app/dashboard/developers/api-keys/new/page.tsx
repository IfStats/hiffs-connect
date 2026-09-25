'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreateApiKeyPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState(
    'Production API',
  );

  const [expiresAt, setExpiresAt] =
    useState('');

  const [createdKey, setCreatedKey] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!businessId || !accessToken) {
      setError(
        'Your session is missing business authentication information.',
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl =
        process.env
          .NEXT_PUBLIC_HIFFS_API_URL;

      if (!apiUrl) {
        throw new Error(
          'API URL is not configured',
        );
      }

      const response = await fetch(
        `${apiUrl}/api-keys/business/${businessId}`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name,
            ...(expiresAt
              ? {
                  expiresAt:
                    new Date(
                      expiresAt,
                    ).toISOString(),
                }
              : {}),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            'Failed to create API key',
        );
      }

      setCreatedKey(data.apiKey);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to create API key',
      );
    } finally {
      setLoading(false);
    }
  }

  if (createdKey) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Developers
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            API key created
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Copy this key now. Hiffs
            Connect will not show the full
            key again.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-950">
            Save this credential securely
          </p>

          <div className="mt-4 break-all rounded-xl bg-white p-4 font-mono text-sm text-slate-900">
            {createdKey}
          </div>

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                createdKey,
              )
            }
            className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            Copy API key
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/dashboard/developers',
            )
          }
          className="text-sm font-medium text-blue-600"
        >
          Return to Developers
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Developers
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create API key
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Create a credential for
          server-to-server access to the
          Hiffs Connect API.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="name"
            className="text-sm font-medium text-slate-900"
          >
            Key name
          </label>

          <input
            id="name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Production API"
          />
        </div>

        <div>
          <label
            htmlFor="expiresAt"
            className="text-sm font-medium text-slate-900"
          >
            Expiration date
          </label>

          <input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(event) =>
              setExpiresAt(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Optional. Leave blank for no
            expiration date.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading
              ? 'Creating...'
              : 'Create API key'}
          </button>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}