import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

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

  groups: Array<{
    id: string;
    group: {
      id: string;
      name: string;
    };
  }>;
};

type ContactGroup = {
  id: string;
  name: string;
  description: string | null;

  _count: {
    members: number;
  };
};

type Props = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    groupId?: string;
  }>;
};

export default async function ContactsPage({
  searchParams,
}: Props) {
  const filters =
    await searchParams;

  const search =
    filters.search?.trim() ?? "";

  const status =
    filters.status?.trim() ?? "";

  const groupId =
    filters.groupId?.trim() ?? "";

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

  const query =
    new URLSearchParams();

  if (search) {
    query.set(
      "search",
      search,
    );
  }

  if (status) {
    query.set(
      "status",
      status,
    );
  }

  if (groupId) {
    query.set(
      "groupId",
      groupId,
    );
  }

  const contactQuery =
    query.toString();

  const [
    contactsResponse,
    groupsResponse,
  ] = await Promise.all([
    fetch(
      `${apiUrl}/businesses/${businessId}/contacts${
        contactQuery
          ? `?${contactQuery}`
          : ""
      }`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    ),

    fetch(
      `${apiUrl}/businesses/${businessId}/contacts/groups`,
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
    !contactsResponse.ok ||
    !groupsResponse.ok
  ) {
    throw new Error(
      "Unable to load contact information",
    );
  }

  const contacts =
    (await contactsResponse.json()) as Contact[];

  const groups =
    (await groupsResponse.json()) as ContactGroup[];

  const activeContacts =
    contacts.filter(
      (contact) =>
        contact.status === "ACTIVE",
    ).length;

  const unsubscribedContacts =
    contacts.filter(
      (contact) =>
        contact.status ===
        "UNSUBSCRIBED",
    ).length;

  const blockedContacts =
    contacts.filter(
      (contact) =>
        contact.status === "BLOCKED",
    ).length;

  const filtersActive =
    Boolean(
      search ||
        status ||
        groupId,
    );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Audience
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Contacts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage recipients,
            messaging consent and
            reusable audiences for
            campaigns.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/contacts/import"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Import CSV
          </Link>

          <Link
            href="/dashboard/contacts/groups/new"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            New group
          </Link>

          <Link
            href="/dashboard/contacts/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Add contact
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Matching contacts
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {contacts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Active
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {activeContacts}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Unsubscribed
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {unsubscribedContacts}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Groups
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {groups.length}
          </p>

          {blockedContacts > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {blockedContacts} blocked
            </p>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <form
          method="GET"
          className="grid gap-4 lg:grid-cols-[1fr_200px_240px_auto]"
        >
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium"
            >
              Search contacts
            </label>

            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Name, phone or email"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={status}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="UNSUBSCRIBED">
                Unsubscribed
              </option>

              <option value="BLOCKED">
                Blocked
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="groupId"
              className="mb-2 block text-sm font-medium"
            >
              Group
            </label>

            <select
              id="groupId"
              name="groupId"
              defaultValue={groupId}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="">
                All groups
              </option>

              {groups.map(
                (group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>

            <Link
              href="/dashboard/contacts"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>

        {filtersActive && (
          <p className="mt-4 text-xs text-slate-500">
            Showing filtered contact
            results.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Contact list
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {contacts.length} matching
              contact
              {contacts.length === 1
                ? ""
                : "s"}
              .
            </p>
          </div>

          <Link
            href="/dashboard/contacts/import"
            className="text-sm font-medium text-blue-600"
          >
            Import CSV →
          </Link>
        </div>

        {contacts.length === 0 ? (
          <div className="p-8">
            <h3 className="font-medium text-slate-900">
              {filtersActive
                ? "No matching contacts"
                : "No contacts yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {filtersActive
                ? "Try changing or resetting your filters."
                : "Add your first contact or import recipients from CSV."}
            </p>

            {filtersActive ? (
              <Link
                href="/dashboard/contacts"
                className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Reset filters
              </Link>
            ) : (
              <Link
                href="/dashboard/contacts/new"
                className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
              >
                Add contact
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Contact
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Phone
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Email
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Groups
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Added
                  </th>

                  <th className="px-5 py-4 font-medium" />
                </tr>
              </thead>

              <tbody>
                {contacts.map(
                  (contact) => {
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
                      <tr
                        key={contact.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-5 py-5 font-medium text-slate-900">
                          {name}

                          {contact.source && (
                            <p className="mt-1 text-xs font-normal text-slate-400">
                              Source:{" "}
                              {
                                contact.source
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5 font-mono text-xs text-slate-600">
                          {
                            contact.phone
                          }
                        </td>

                        <td className="px-5 py-5 text-slate-500">
                          {contact.email ??
                            "—"}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            {contact.groups
                              .slice(0, 3)
                              .map(
                                (
                                  membership,
                                ) => (
                                  <Link
                                    key={
                                      membership.id
                                    }
                                    href={`/dashboard/contacts/groups/${membership.group.id}`}
                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-200"
                                  >
                                    {
                                      membership
                                        .group
                                        .name
                                    }
                                  </Link>
                                ),
                              )}

                            {contact.groups
                              .length ===
                              0 && (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}

                            {contact.groups
                              .length >
                              3 && (
                              <span className="text-xs text-slate-500">
                                +
                                {contact
                                  .groups
                                  .length -
                                  3}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              contact.status ===
                              "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : contact.status ===
                                    "UNSUBSCRIBED"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              contact.status
                            }
                          </span>
                        </td>

                        <td className="px-5 py-5 text-slate-500">
                          {new Date(
                            contact.createdAt,
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <Link
                            href={`/dashboard/contacts/${contact.id}`}
                            className="text-sm font-medium text-blue-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold">
              Contact groups
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reusable audiences for
              bulk sends and campaigns.
            </p>
          </div>

          <Link
            href="/dashboard/contacts/groups/new"
            className="text-sm font-medium text-blue-600"
          >
            New group →
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="p-8">
            <p className="text-sm text-slate-500">
              No contact groups yet.
            </p>

            <Link
              href="/dashboard/contacts/groups/new"
              className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Create group
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map(
              (group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/contacts/groups/${group.id}`}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {group.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {group.description ??
                          "No description"}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {
                        group._count
                          .members
                      }
                    </span>
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-950">
          Suppression protection
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Unsubscribed and blocked
          contacts remain stored so
          future imports and campaigns
          cannot silently reactivate or
          message them.
        </p>
      </section>
    </div>
  );
}