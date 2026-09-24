import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';

export default async function OnboardingPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as typeof session.user & {
    businessName?: string;
    businessRole?: string;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Workspace created
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome to Hiffs Connect
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {user.businessName
            ? `${user.businessName} is ready for setup.`
            : 'Your workspace is ready for setup.'}
        </p>
      </section>

      <section className="grid gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="font-semibold">
            1. Fund your messaging wallet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Add messaging credit before sending production traffic.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="font-semibold">
            2. Register a sender identity
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Configure your SMS sender name and complete any required approvals.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="font-semibold">
            3. Configure API access
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Create an API key when you are ready to integrate your application.
          </p>
        </article>
      </section>

      <Link
        href="/dashboard"
        className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white"
      >
        Continue to dashboard
      </Link>
    </div>
  );
}