'use client';

import {
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  type AccountStatus,
  updateUserStatus,
} from './actions';

type Props = {
  userId: string;
  currentStatus: AccountStatus;
  isCurrentUser: boolean;
};

const statusOptions: Array<{
  value: AccountStatus;
  label: string;
  description: string;
}> = [
  {
    value: 'ACTIVE',
    label: 'Active',
    description:
      'Normal account access is permitted.',
  },
  {
    value: 'RESTRICTED',
    label: 'Restricted',
    description:
      'Account access is blocked under the current authentication policy.',
  },
  {
    value: 'SUSPENDED',
    label: 'Suspended',
    description:
      'Account access is blocked until an administrator reactivates it.',
  },
];

export function UserStatusControls({
  userId,
  currentStatus,
  isCurrentUser,
}: Props) {
  const router =
    useRouter();

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<AccountStatus>(
      currentStatus,
    );

  const [
    displayedStatus,
    setDisplayedStatus,
  ] =
    useState<AccountStatus>(
      currentStatus,
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
      selectedStatus ===
      displayedStatus
    ) {
      return;
    }

    if (
      isCurrentUser &&
      selectedStatus !==
        'ACTIVE'
    ) {
      setFeedback({
        type: 'error',
        message:
          'You cannot restrict or suspend your own Super Admin account.',
      });

      return;
    }

    const actionDescription =
      selectedStatus ===
      'ACTIVE'
        ? 'reactivate this account'
        : selectedStatus ===
            'RESTRICTED'
          ? 'restrict this account'
          : 'suspend this account';

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionDescription}?`,
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(
      async () => {
        const result =
          await updateUserStatus(
            userId,
            selectedStatus,
          );

        if (!result.ok) {
          setFeedback({
            type: 'error',
            message:
              result.message,
          });

          return;
        }

        setDisplayedStatus(
          selectedStatus,
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Account status
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Control whether this
            user can authenticate
            and access Hiffs
            Connect.
          </p>
        </div>

        <span
          className={
            displayedStatus ===
            'ACTIVE'
              ? 'inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
              : displayedStatus ===
                  'SUSPENDED'
                ? 'inline-flex w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'
                : 'inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
          }
        >
          {displayedStatus}
        </span>
      </div>

      <div className="mt-6">
        <label
          htmlFor="account-status"
          className="text-sm font-medium text-slate-700"
        >
          New status
        </label>

        <select
          id="account-status"
          value={
            selectedStatus
          }
          disabled={isPending}
          onChange={(
            event,
          ) => {
            setSelectedStatus(
              event.target
                .value as AccountStatus,
            );

            setFeedback(null);
          }}
          className="mt-2 h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
        >
          {statusOptions.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
                disabled={
                  isCurrentUser &&
                  option.value !==
                    'ACTIVE'
                }
              >
                {option.label}
              </option>
            ),
          )}
        </select>

        <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
          {
            statusOptions.find(
              (option) =>
                option.value ===
                selectedStatus,
            )?.description
          }
        </p>
      </div>

      {isCurrentUser && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Your own Super Admin
          account cannot be
          restricted or suspended.
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
          onClick={
            handleUpdate
          }
          disabled={
            isPending ||
            selectedStatus ===
              displayedStatus
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? 'Updating...'
            : 'Update status'}
        </button>

        {selectedStatus !==
          displayedStatus && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setSelectedStatus(
                displayedStatus,
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