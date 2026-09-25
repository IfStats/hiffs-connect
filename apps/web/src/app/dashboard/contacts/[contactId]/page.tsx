import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import {
  ContactEditForm,
} from "./components/contact-edit-form";

type ContactGroupMembership = {
  id: string;
  group: {
    id: string;
    name: string;
  };
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
  source: string | null;
  createdAt: string;
  updatedAt: string;

  groups: ContactGroupMembership[];
};

type Props = {
  params: Promise<{
    contactId: string;
  }>;
};

export default async function ContactDetailPage({
  params,
}: Props) {
  const {
    contactId,
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

  const response = await fetch(
    `${apiUrl}/businesses/${businessId}/contacts/${contactId}`,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },

      cache: "no-store",
    },
  );

  if (response.status === 404) {
    redirect(
      "/dashboard/contacts",
    );
  }

  if (!response.ok) {
    throw new Error(
      "Unable to load contact",
    );
  }

  const contact =
    (await response.json()) as Contact;

  const fullName = [
    contact.firstName,
    contact.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const name =
    contact.displayName ??
    (fullName || contact.phone);

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Contacts
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-blue-600">
            Contact
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Added{" "}
            {new Date(
              contact.createdAt,
            ).toLocaleDateString()}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Contact details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update recipient identity,
            contact information and
            messaging status.
          </p>

          <div className="mt-6">
            <ContactEditForm
              businessId={
                businessId
              }
              accessToken={
                accessToken
              }
              contact={contact}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">
              Group membership
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Audiences containing
              this contact.
            </p>

            <div className="mt-4 space-y-2">
              {contact.groups.length ===
              0 ? (
                <p className="text-sm text-slate-400">
                  Not assigned to any
                  groups.
                </p>
              ) : (
                contact.groups.map(
                  (membership) => (
                    <Link
                      key={
                        membership.id
                      }
                      href={`/dashboard/contacts/groups/${membership.group.id}`}
                      className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {
                        membership.group
                          .name
                      }
                    </Link>
                  ),
                )
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-950">
              Messaging consent
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Keep opt-out and blocked
              statuses intact. Campaigns
              must exclude these
              contacts even when they
              remain members of a group.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}