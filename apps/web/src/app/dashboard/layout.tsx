import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

const navItems = [
  ["Overview", "/dashboard"],
  ["Messages", "/dashboard/messages"],
  ["Campaigns", "/dashboard/campaigns"],
  ["Contacts", "/dashboard/contacts"],
  ["Senders", "/dashboard/senders"],
  ["Templates", "/dashboard/templates"],
  ["Reports", "/dashboard/reports"],
  ["Developers", "/dashboard/developers"],
  ["Billing", "/dashboard/billing"],
  ["Settings", "/dashboard/settings"],
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & {
    businessName?: string;
    businessRole?: string;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 text-white">
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
              Hiffs Connect
            </Link>
          </div>

          <nav className="space-y-1 p-4">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
              <p className="mt-1 font-semibold">
                {user.businessName ?? "Platform Admin"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium">
                {user.name ?? user.email ?? "User"}
              </p>
              <p className="text-xs text-slate-500">
                {user.businessRole ?? "Platform"}
              </p>
            </div>
          </header>

          <main className="p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}