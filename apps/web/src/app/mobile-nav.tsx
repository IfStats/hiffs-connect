'use client';

import Link from 'next/link';
import { useState } from 'react';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
      >
        <span className="sr-only">
          Toggle navigation
        </span>

        <div className="space-y-1.5">
          <span
            className={`block h-0.5 w-5 bg-current transition ${
              open
                ? 'translate-y-2 rotate-45'
                : ''
            }`}
          />

          <span
            className={`block h-0.5 w-5 bg-current transition ${
              open
                ? 'opacity-0'
                : ''
            }`}
          />

          <span
            className={`block h-0.5 w-5 bg-current transition ${
              open
                ? '-translate-y-2 -rotate-45'
                : ''
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white shadow-xl">
          <nav className="mx-auto max-w-7xl space-y-2 px-6 py-6">
            <Link
              href="/"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-blue-600"
            >
              Home
            </Link>

            <a
              href="#features"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Features
            </a>

            <a
              href="#pricing"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Pricing
            </a>

            <a
              href="#solutions"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Solutions
            </a>

            <a
              href="#developers"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Resources
            </a>

            <a
              href="#contact"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Contact
            </a>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                onClick={closeMenu}
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}