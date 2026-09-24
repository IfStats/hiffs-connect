'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type MemberActionsProps = {
  businessId: string;
  membershipId: string;
  currentRole: string;
  active: boolean;
  accessToken: string;
};

export function MemberActions({
  businessId,
  membershipId,
  currentRole,
  active,
  accessToken,
}: MemberActionsProps) {
  const router = useRouter();

  const [role, setRole] =
    useState(currentRole);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  const apiUrl =
    process.env.NEXT_PUBLIC_HIFFS_API_URL ??
    'http://localhost:4000';

  async function updateRole() {
    setBusy(true);
    setError('');

    const response = await fetch(
      `${apiUrl}/businesses/${businessId}/members/${membershipId}/role`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization:
            `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
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
              'Unable to update role',
      );

      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  async function updateStatus() {
    setBusy(true);
    setError('');

    const response = await fetch(
      `${apiUrl}/businesses/${businessId}/members/${membershipId}/status`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization:
            `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          active: !active,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.json();

      setError(
        Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ??
              'Unable to update member status',
      );

      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <select
          value={role}
          onChange={(event) =>
            setRole(event.target.value)
          }
          disabled={
            busy ||
            currentRole === 'OWNER'
          }
          className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
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

        <button
          type="button"
          disabled={
            busy ||
            currentRole === 'OWNER' ||
            role === currentRole
          }
          onClick={updateRole}
          className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Save role
        </button>

        <button
          type="button"
          disabled={
            busy ||
            currentRole === 'OWNER'
          }
          onClick={updateStatus}
          className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          {active
            ? 'Deactivate'
            : 'Reactivate'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type InvitationActionsProps = {
  businessId: string;
  invitationId: string;
  status: string;
  accessToken: string;
};

export function InvitationActions({
  businessId,
  invitationId,
  status,
  accessToken,
}: InvitationActionsProps) {
  const router = useRouter();

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  const apiUrl =
    process.env.NEXT_PUBLIC_HIFFS_API_URL ??
    'http://localhost:4000';

  async function action(
    type: 'revoke' | 'resend',
  ) {
    setBusy(true);
    setError('');

    const response = await fetch(
      `${apiUrl}/businesses/${businessId}/invitations/${invitationId}/${type}`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const body = await response.json();

      setError(
        Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ??
              'Unable to update invitation',
      );

      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  if (status !== 'PENDING') {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            action('resend')
          }
          className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Resend
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            action('revoke')
          }
          className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Revoke
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}