'use client';

import { signOut } from 'next-auth/react';

type SignOutButtonProps = {
  mobile?: boolean;
};

export function SignOutButton({
  mobile = false,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        signOut({
          callbackUrl: '/login',
        })
      }
      className={
        mobile
          ? 'inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
          : 'w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white'
      }
    >
      Sign out
    </button>
  );
}