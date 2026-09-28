"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string;
  email?: string | null;
  status:
    | "ACTIVE"
    | "UNSUBSCRIBED"
    | "BLOCKED";
};

type CreatedGroup = {
  id: string;
  name: string;
};

function getContactName(
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

export default function NewContactGroupPage() {
  const router = useRouter();

  const { data: session } =
    useSession();

  const [loading, setLoading] =
    useState(false);

  const [
    contactsLoading,
    setContactsLoading,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [contacts, setContacts] =
    useState<Contact[]>([]);

  const [
    selectedContactIds,
    setSelectedContactIds,
  ] = useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL ??
    "";

  useEffect(() => {
    if (
      !businessId ||
      !accessToken ||
      !apiUrl
    ) {
      return;
    }

    let cancelled = false;

    async function loadContacts() {
      try {
        const response =
          await fetch(
            `${apiUrl}/businesses/${businessId}/contacts?status=ACTIVE`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ", ",
                )
              : data?.message ??
                  "Failed to load contacts",
          );
        }

        if (!cancelled) {
          setContacts(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Failed to load contacts",
          );
        }
      } finally {
        if (!cancelled) {
          setContactsLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      cancelled = true;
    };
  }, [
    apiUrl,
    businessId,
    accessToken,
  ]);

  const filteredContacts =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return contacts;
      }

      return contacts.filter(
        (contact) => {
          const name =
            getContactName(
              contact,
            ).toLowerCase();

          const phone =
            contact.phone
              .toLowerCase();

          const email =
            contact.email
              ?.toLowerCase() ??
            "";

          return (
            name.includes(query) ||
            phone.includes(query) ||
            email.includes(query)
          );
        },
      );
    }, [contacts, search]);

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedContactIds,
        ),
      [selectedContactIds],
    );

  const allVisibleSelected =
    filteredContacts.length >
      0 &&
    filteredContacts.every(
      (contact) =>
        selectedSet.has(
          contact.id,
        ),
    );

  function toggleContact(
    contactId: string,
  ) {
    if (
      selectedSet.has(contactId)
    ) {
      setSelectedContactIds(
        selectedContactIds.filter(
          (id) =>
            id !== contactId,
        ),
      );

      return;
    }

    setSelectedContactIds([
      ...selectedContactIds,
      contactId,
    ]);
  }

  function selectVisible() {
    const merged = [
      ...new Set([
        ...selectedContactIds,
        ...filteredContacts.map(
          (contact) =>
            contact.id,
        ),
      ]),
    ];

    setSelectedContactIds(
      merged,
    );
  }

  function clearSelection() {
    setSelectedContactIds([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !businessId ||
      !accessToken
    ) {
      setError(
        "Your authenticated business session is unavailable.",
      );

      return;
    }

    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );

      return;
    }

    const form = new FormData(
      event.currentTarget,
    );

    const name = String(
      form.get("name") ?? "",
    ).trim();

    const description = String(
      form.get(
        "description",
      ) ?? "",
    ).trim();

    if (!name) {
      setError(
        "Group name is required.",
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      /*
       * Step 1:
       * Create the group.
       */
      const groupResponse =
        await fetch(
          `${apiUrl}/businesses/${businessId}/contacts/groups`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,

              ...(description
                ? {
                    description,
                  }
                : {}),
            }),
          },
        );

      const groupData =
        await groupResponse.json();

      if (!groupResponse.ok) {
        throw new Error(
          Array.isArray(
            groupData?.message,
          )
            ? groupData.message.join(
                ", ",
              )
            : groupData?.message ??
                "Failed to create contact group",
        );
      }

      const createdGroup =
        groupData as CreatedGroup;

      /*
       * Step 2:
       * Assign selected contacts.
       *
       * An empty selection is valid,
       * so users can still create an
       * empty group.
       */
      if (
        selectedContactIds.length >
        0
      ) {
        const results =
          await Promise.allSettled(
            selectedContactIds.map(
              async (contactId) => {
                const response =
                  await fetch(
                    `${apiUrl}/businesses/${businessId}/contacts/groups/${createdGroup.id}/members`,
                    {
                      method:
                        "POST",

                      headers: {
                        Authorization:
                          `Bearer ${accessToken}`,

                        "Content-Type":
                          "application/json",
                      },

                      body:
                        JSON.stringify(
                          {
                            contactId,
                          },
                        ),
                    },
                  );

                if (!response.ok) {
                  const data =
                    await response.json();

                  throw new Error(
                    Array.isArray(
                      data?.message,
                    )
                      ? data.message.join(
                          ", ",
                        )
                      : data?.message ??
                          "Failed to add contact",
                  );
                }
              },
            ),
          );

        const failures =
          results.filter(
            (result) =>
              result.status ===
              "rejected",
          );

        if (
          failures.length > 0
        ) {
          /*
           * The group itself already
           * exists. Take the user to
           * the group rather than
           * creating a duplicate on
           * retry.
           */
          router.push(
            `/dashboard/contacts/groups/${createdGroup.id}`,
          );

          router.refresh();

          return;
        }
      }

      router.push(
        `/dashboard/contacts/groups/${createdGroup.id}`,
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create contact group",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Contacts
        </Link>

        <p className="mt-6 text-sm font-medium text-blue-600">
          Audience
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create contact group
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Create a reusable
          audience and optionally
          assign existing contacts
          immediately.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
          >
            Group name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder="Example: VIP Customers"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="mt-2 text-xs text-slate-500">
            Group names must be
            unique within this
            workspace.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={500}
            placeholder="Describe who belongs to this group and how it will be used."
            className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Add contacts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Optional. Select
                existing contacts to
                add when this group
                is created.
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              {
                selectedContactIds.length
              }{" "}
              selected
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="contact-search"
              className="mb-2 block text-sm font-medium"
            >
              Search contacts
            </label>

            <input
              id="contact-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search by name, phone or email"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                selectVisible
              }
              disabled={
                contactsLoading ||
                filteredContacts.length ===
                  0 ||
                allVisibleSelected
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select all displayed
            </button>

            <button
              type="button"
              onClick={
                clearSelection
              }
              disabled={
                selectedContactIds.length ===
                0
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear selection
            </button>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-200">
            {contactsLoading ? (
              <div className="p-5 text-sm text-slate-500">
                Loading
                contacts...
              </div>
            ) : filteredContacts.length ===
              0 ? (
              <div className="p-5 text-sm text-slate-500">
                {contacts.length ===
                0
                  ? "No active contacts are available yet."
                  : "No contacts match your search."}
              </div>
            ) : (
              filteredContacts.map(
                (contact) => {
                  const checked =
                    selectedSet.has(
                      contact.id,
                    );

                  return (
                    <label
                      key={
                        contact.id
                      }
                      className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={() =>
                          toggleContact(
                            contact.id,
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-950">
                          {getContactName(
                            contact,
                          )}
                        </span>

                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {
                            contact.phone
                          }

                          {contact.email
                            ? ` · ${contact.email}`
                            : ""}
                        </span>
                      </span>
                    </label>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">
            Reusable audience
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Contacts can belong to
            multiple groups. You can
            create an empty group or
            assign contacts now and
            manage membership later.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/contacts"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : selectedContactIds.length >
                  0
                ? `Create group with ${selectedContactIds.length} contact${
                    selectedContactIds.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : "Create empty group"}
          </button>
        </div>
      </form>
    </div>
  );
}