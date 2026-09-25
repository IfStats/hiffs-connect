'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() =>
        signOut({
          callbackUrl: '/login',
        })
      }
      className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  );
}