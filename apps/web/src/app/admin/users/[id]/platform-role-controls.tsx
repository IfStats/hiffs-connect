'use client';

import {
  useState,
  useTransition,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  type PlatformRoleValue,
  updateUserPlatformRole,
} from './actions';

type Props = {
  userId: string;

  currentRole:
    PlatformRoleValue;

  isCurrentUser: boolean;
};

const roleOptions: Array<{
  value: PlatformRoleValue;
  label: string;
  description: string;
}> = [
  {
    value: null,
    label: 'No platform role',
    description:
      'Standard customer account with no platform administration privileges.',
  },
  {
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    description:
      'Full Hiffs Connect platform administration access.',
  },
  {
    value: 'OPERATIONS',
    label: 'Operations',
    description:
      'Operational access to businesses, messaging infrastructure, senders and routing.',
  },
  {
    value: 'SUPPORT',
    label: 'Support',
    description:
      'Customer support and platform troubleshooting access.',
  },
  {
    value: 'FINANCE',
    label: 'Finance',
    description:
      'Wallet, transaction and pricing administration access.',
  },
  {
    value: 'COMPLIANCE',
    label: 'Compliance',
    description:
      'Sender approval and compliance-management access.',
  },
];

function roleToValue(
  value: string,
): PlatformRoleValue {
  return value === 'NONE'
    ? null
    : value as PlatformRoleValue;
}

function roleToInputValue(
  role: PlatformRoleValue,
) {
  return role ?? 'NONE';
}

export function PlatformRoleControls({
  userId,
  currentRole,
  isCurrentUser,
}: Props) {
  const router =
    useRouter();

  const [
    displayedRole,
    setDisplayedRole,
  ] =
    useState<PlatformRoleValue>(
      currentRole,
    );

  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<PlatformRoleValue>(
      currentRole,
    );

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

  function handleUpdate() {
    if (
      selectedRole ===
      displayedRole
    ) {
      return;
    }

    if (
      isCurrentUser &&
      selectedRole !==
        'SUPER_ADMIN'
    ) {
      setFeedback({
        type: 'error',
        message:
          'You cannot remove your own Super Admin role.',
      });

      return;
    }

    const roleLabel =
      roleOptions.find(
        (option) =>
          option.value ===
          selectedRole,
      )?.label ??
      'No platform role';

    const confirmed =
      window.confirm(
        selectedRole
          ? `Assign ${roleLabel} platform access to this user?`
          : 'Remove all platform administration access from this user?',
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(
      async () => {
        const result =
          await updateUserPlatformRole(
            userId,
            selectedRole,
          );

        if (!result.ok) {
          setFeedback({
            type: 'error',
            message:
              result.message,
          });

          return;
        }

        setDisplayedRole(
          selectedRole,
        );

        setFeedback({
          type: 'success',
          message:
            result.message,
        });

        router.refresh();
      },
    );
  }

  const selectedDescription =
    roleOptions.find(
      (option) =>
        option.value ===
        selectedRole,
    )?.description;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Platform role
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Assign platform-level responsibilities
            independently from the user&apos;s business
            workspace role.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {displayedRole ??
            'NO PLATFORM ROLE'}
        </span>
      </div>

      <div className="mt-6">
        <label
          htmlFor="platform-role"
          className="text-sm font-medium text-slate-700"
        >
          Platform access
        </label>

        <select
          id="platform-role"
          value={roleToInputValue(
            selectedRole,
          )}
          disabled={isPending}
          onChange={(event) => {
            setSelectedRole(
              roleToValue(
                event.target.value,
              ),
            );

            setFeedback(null);
          }}
          className="mt-2 h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
        >
          {roleOptions.map(
            (option) => {
              const value =
                roleToInputValue(
                  option.value,
                );

              return (
                <option
                  key={value}
                  value={value}
                  disabled={
                    isCurrentUser &&
                    option.value !==
                      'SUPER_ADMIN'
                  }
                >
                  {option.label}
                </option>
              );
            },
          )}
        </select>

        <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
          {selectedDescription}
        </p>
      </div>

      {isCurrentUser && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Your own Super Admin role cannot be removed
          from this account.
        </div>
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

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={
            isPending ||
            selectedRole ===
              displayedRole
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? 'Updating...'
            : 'Update platform role'}
        </button>

        {selectedRole !==
          displayedRole && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setSelectedRole(
                displayedRole,
              );

              setFeedback(null);
            }}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}