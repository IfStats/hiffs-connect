import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import {
  GroupMembersEditor,
} from "./components/group-members-editor";

import {
  GroupSettings,
} from "./components/group-settings";

type GroupMember = {
  id: string;

  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phone: string;
    email: string | null;

    status:
      | "ACTIVE"
      | "UNSUBSCRIBED"
      | "BLOCKED";
  };
};

type ContactGroup = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  members: GroupMember[];
};

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string;
  email: string | null;

  status:
    | "ACTIVE"
    | "UNSUBSCRIBED"
    | "BLOCKED";

  groups: Array<{
    group: {
      id: string;
      name: string;
    };
  }>;
};

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

function getContactLabel(
  contact: Contact,
) {
  if (contact.displayName?.trim()) {
    return contact.displayName.trim();
  }

  const fullName = [
    contact.firstName,
    contact.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || contact.phone;
}

export default async function ContactGroupPage({
  params,
}: Props) {
  const { groupId } =
    await params;

  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
    redirect("/login");
  }

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    redirect("/dashboard");
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const [
    groupResponse,
    contactsResponse,
  ] = await Promise.all([
    fetch(
      `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    ),

    fetch(
      `${apiUrl}/businesses/${businessId}/contacts`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    ),
  ]);

  if (
    groupResponse.status === 404
  ) {
    redirect(
      "/dashboard/contacts",
    );
  }

  if (
    !groupResponse.ok ||
    !contactsResponse.ok
  ) {
    const groupError =
      !groupResponse.ok
        ? await groupResponse.text()
        : null;

    const contactsError =
      !contactsResponse.ok
        ? await contactsResponse.text()
        : null;

    console.error(
  [
    "Contact group page load failed",
    `groupId=${groupId}`,
    `groupStatus=${groupResponse.status}`,
    `groupError=${groupError ?? "none"}`,
    `contactsStatus=${contactsResponse.status}`,
    `contactsError=${contactsError ?? "none"}`,
  ].join(" | "),
);

    throw new Error(
      `Unable to load contact group (group: ${groupResponse.status}, contacts: ${contactsResponse.status})`,
    );
  }

  const group =
    (await groupResponse.json()) as ContactGroup;

  const contacts =
    (await contactsResponse.json()) as Contact[];

  const initialMemberIds =
    group.members.map(
      (member) =>
        member.contact.id,
    );

  const editorContacts =
    contacts.map(
      (contact) => ({
        id: contact.id,

        label:
          getContactLabel(
            contact,
          ),

        phone:
          contact.phone,

        email:
          contact.email,

        status:
          contact.status,
      }),
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Contacts
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Contact group
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {group.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {group.description ??
                "No description provided."}
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {group.members.length}{" "}
            member
            {group.members.length ===
            1
              ? ""
              : "s"}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <GroupMembersEditor
            businessId={
              businessId
            }
            groupId={groupId}
            accessToken={
              accessToken
            }
            contacts={
              editorContacts
            }
            initialMemberIds={
              initialMemberIds
            }
          />
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">
              Group settings
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Rename this audience,
              update its description,
              or delete the group.
            </p>

            <div className="mt-5">
              <GroupSettings
                businessId={
                  businessId
                }
                groupId={
                  groupId
                }
                accessToken={
                  accessToken
                }
                name={group.name}
                description={
                  group.description
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-950">
              Audience management
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Select or remove
              contacts from this
              audience and save all
              membership changes
              together.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-950">
              Messaging safety
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Group membership does
              not override contact
              consent. Unsubscribed
              and blocked contacts
              must remain excluded
              from message delivery.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}