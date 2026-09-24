import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';
import { DashboardNav } from '@/components/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="hidden bg-slate-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-950/40">
                <span className="text-sm font-black">
                  HC
                </span>

                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>

              <div>
                <p className="font-bold tracking-tight">
                  Hiffs Connect
                </p>

                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Business Messaging
                </p>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>

            <DashboardNav />
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="truncate text-sm font-semibold">
                {user.businessName ??
                  'Hiffs Connect'}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {user.email}
              </p>

              <div className="mt-3 inline-flex rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                {user.businessRole ??
                  user.platformRole ??
                  'Member'}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-20 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 lg:hidden"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white">
                    HC
                  </div>

                  <span className="font-bold">
                    Hiffs Connect
                  </span>
                </Link>

                <div className="hidden lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Workspace
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {user.businessName ??
                      'Platform Administration'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">
                    {user.name ??
                      user.email ??
                      'User'}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user.businessRole ??
                      user.platformRole ??
                      'Member'}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {(user.name ??
                    user.email ??
                    'U')
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
              <div className="flex min-w-max gap-2">
                {[
                  ['Overview', '/dashboard'],
                  [
                    'Messages',
                    '/dashboard/messages',
                  ],
                  ['Senders', '/dashboard/senders'],
                  ['Team', '/dashboard/team'],
                  [
                    'Developers',
                    '/dashboard/developers',
                  ],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-8 xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}