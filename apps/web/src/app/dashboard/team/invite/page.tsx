'use client';

import { FormEvent, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function InviteMemberPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  if (!businessId || !accessToken) {
    setError('Session is unavailable');
    return;
  }

  setSubmitting(true);
  setError('');

  const apiUrl =
    process.env.NEXT_PUBLIC_HIFFS_API_URL ??
    'http://localhost:4000';

  const response = await fetch(
    `${apiUrl}/businesses/${businessId}/invitations`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        email,
        role,
      }),
    },
  );

    if (!response.ok) {
      const body = await response.json();

      setError(
        Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ??
              'Unable to create invitation',
      );

      setSubmitting(false);
      return;
    }

    router.push('/dashboard/team');
    router.refresh();
  }

  return (
    <main className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Invite member
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Add a user to your business workspace.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Email address
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Role
          </label>

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="ADMIN">
              Admin
            </option>

            <option value="DEVELOPER">
              Developer
            </option>

            <option value="BILLING">
              Billing
            </option>

            <option value="OPERATOR">
              Operator
            </option>

            <option value="VIEWER">
              Viewer
            </option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting
            ? 'Sending...'
            : 'Send invitation'}
        </button>
      </form>
    </main>
  );
}