'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    label: 'Overview',
    href: '/admin',
  },
  {
    label: 'Users',
    href: '/admin/users',
  },
  {
    label: 'Businesses',
    href: '/admin/businesses',
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? 'flex items-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white'
                : 'flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}