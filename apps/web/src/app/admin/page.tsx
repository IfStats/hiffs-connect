import Link from 'next/link';

const sections = [
  {
    title: 'Users',
    description:
      'Review customer identities, verification status, account status and platform roles.',
    href: '/admin/users',
  },
  {
    title: 'Businesses',
    description:
      'Inspect registered businesses, memberships, wallets and platform activity.',
    href: '/admin/businesses',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Platform overview
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Super Admin Console
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Operate Hiffs Connect across customers,
          businesses, messaging infrastructure,
          billing and platform administration.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {section.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {section.description}
                </p>
              </div>

              <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                →
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <p className="text-sm font-semibold text-blue-950">
          Platform-level access
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          This console is isolated from customer
          workspaces and is available only to accounts
          with the SUPER_ADMIN platform role.
        </p>
      </section>
    </div>
  );
}