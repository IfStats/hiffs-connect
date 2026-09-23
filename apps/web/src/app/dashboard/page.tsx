import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';

export default async function DashboardPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session) {
    redirect('/login');
  }

  const user =
    session.user as typeof session.user & {
      businessName?: string;
      businessRole?: string;
    };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">
        Hiffs Connect Dashboard
      </h1>

      <p className="mt-4">
        Workspace:{' '}
        <strong>
          {user.businessName ??
            'Platform Admin'}
        </strong>
      </p>

      <p className="mt-2">
        Role:{' '}
        <strong>
          {user.businessRole ??
            'Platform'}
        </strong>
      </p>
    </main>
  );
}