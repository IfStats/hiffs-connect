'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  ['Overview', '/dashboard'],
  ['Messages', '/dashboard/messages'],
  ['Campaigns', '/dashboard/campaigns'],
  ['Contacts', '/dashboard/contacts'],
  ['Senders', '/dashboard/senders'],
  ['Templates', '/dashboard/templates'],
  ['Reports', '/dashboard/reports'],
  ['Team', '/dashboard/team'],
  ['Developers', '/dashboard/developers'],
  ['Billing', '/dashboard/billing'],
  ['Settings', '/dashboard/settings'],
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map(([label, href]) => {
        const active =
          href === '/dashboard'
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition',
              active
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <span>{label}</span>

            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}