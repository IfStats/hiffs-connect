import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import {
  AddGroupMemberForm,
} from "./components/add-group-member-form";

import {
  RemoveGroupMemberButton,
} from "./components/group-member-actions";

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

export default async function ContactGroupPage({
  params,
}: Props) {
  const {
    groupId,
  } = await params;

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

  if (groupResponse.status === 404) {
    redirect(
      "/dashboard/contacts",
    );
  }

  if (
    !groupResponse.ok ||
    !contactsResponse.ok
  ) {
    throw new Error(
      "Unable to load contact group",
    );
  }

  const group =
    (await groupResponse.json()) as ContactGroup;

  const contacts =
    (await contactsResponse.json()) as Contact[];

  const memberContactIds =
    new Set(
      group.members.map(
        (member) =>
          member.contact.id,
      ),
    );

  const availableContacts =
    contacts
      .filter(
        (contact) =>
          !memberContactIds.has(
            contact.id,
          ),
      )
      .map((contact) => {
        const fullName = [
          contact.firstName,
          contact.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        const label =
          contact.displayName ??
          (fullName ||
            contact.phone);

        return {
          id: contact.id,
          label,
          phone: contact.phone,
        };
      });

  return (
    <div className="space-y-8">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-semibold">
              Group members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contacts currently
              assigned to this audience.
            </p>
          </div>

          {group.members.length ===
          0 ? (
            <div className="p-8 text-sm text-slate-500">
              This group has no
              contacts yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {group.members.map(
                (member) => {
                  const contact =
                    member.contact;

                  const fullName = [
                    contact.firstName,
                    contact.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const name =
                    contact.displayName ??
                    (fullName ||
                      contact.phone);

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            contact.phone
                          }
                          {contact.email
                            ? ` · ${contact.email}`
                            : ""}
                        </p>

                        <span
                          className={[
                            "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            contact.status ===
                            "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : contact.status ===
                                  "UNSUBSCRIBED"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700",
                          ].join(" ")}
                        >
                          {
                            contact.status
                          }
                        </span>
                      </div>

                      <RemoveGroupMemberButton
                        businessId={
                          businessId
                        }
                        groupId={
                          groupId
                        }
                        contactId={
                          contact.id
                        }
                        accessToken={
                          accessToken
                        }
                      />
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">
              Add member
            </h2>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
  <h2 className="font-semibold">
    Group settings
  </h2>

  <p className="mt-1 text-sm leading-6 text-slate-500">
    Update this audience or remove the
    group.
  </p>

  <div className="mt-5">
    <GroupSettings
      businessId={businessId}
      groupId={groupId}
      accessToken={accessToken}
      name={group.name}
      description={
        group.description
      }
    />
  </div>
</section>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Add an existing contact
              to this group.
            </p>

            <div className="mt-5">
              <AddGroupMemberForm
                businessId={
                  businessId
                }
                groupId={groupId}
                accessToken={
                  accessToken
                }
                contacts={
                  availableContacts
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-950">
              Campaign ready
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Contact groups will be
              reusable as campaign
              audiences. Unsubscribed
              and blocked contacts will
              be excluded from sends.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}