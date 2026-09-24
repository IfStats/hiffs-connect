import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import {
  InvitationActions,
  MemberActions,
} from './components/team-actions';

import { authOptions } from '@/auth';

type Member = {
  id: string;
  role: string;
  active: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const businessId = session.user.businessId;
  const accessToken = session.user.accessToken;

  if (!businessId || !accessToken) {
    redirect('/dashboard');
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    'http://localhost:4000';

  const [membersResponse, invitationsResponse] =
    await Promise.all([
      fetch(
        `${apiUrl}/businesses/${businessId}/members`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
      ),

      fetch(
        `${apiUrl}/businesses/${businessId}/invitations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        },
      ),
    ]);

  if (
    !membersResponse.ok ||
    !invitationsResponse.ok
  ) {
    throw new Error(
      'Unable to load team information',
    );
  }

  const members =
    (await membersResponse.json()) as Member[];

  const invitations =
    (await invitationsResponse.json()) as Invitation[];

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">
          Team
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Manage workspace members and invitations.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
  <h2 className="text-lg font-semibold">
    Invitations
  </h2>

  <div className="mt-6 divide-y divide-neutral-200">
    {invitations.length === 0 && (
      <p className="py-4 text-sm text-neutral-500">
        No invitations yet.
      </p>
    )}

    {invitations.map((invitation) => (
      <div
        key={invitation.id}
        className="py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {invitation.email}
            </p>

            <p className="text-sm text-neutral-500">
              Role: {invitation.role}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {invitation.status}
            </p>

            <p className="text-xs text-neutral-500">
              Expires{' '}
              {new Date(
                invitation.expiresAt,
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        <InvitationActions
          businessId={businessId}
          invitationId={invitation.id}
          status={invitation.status}
          accessToken={accessToken}
        />
      </div>
    ))}
  </div>
</section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold">
        Members
      </h2>

      <p className="text-sm text-neutral-500">
        {members.length} team member
        {members.length === 1 ? '' : 's'}
      </p>
    </div>

    <a
      href="/dashboard/team/invite"
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
    >
      Invite member
    </a>
  </div>

  <div className="mt-6 divide-y divide-neutral-200">
    {members.map((member) => (
      <div
        key={member.id}
        className="py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {member.user.name ??
                member.user.email}
            </p>

            <p className="text-sm text-neutral-500">
              {member.user.email}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {member.role}
            </p>

            <p className="text-xs text-neutral-500">
              {member.active
                ? 'Active'
                : 'Inactive'}
            </p>
          </div>
        </div>

        <MemberActions
          businessId={businessId}
          membershipId={member.id}
          currentRole={member.role}
          active={member.active}
          accessToken={accessToken}
        />
      </div>
    ))}
  </div>
</section>    </main>
  );
}