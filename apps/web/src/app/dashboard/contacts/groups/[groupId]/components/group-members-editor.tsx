"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  label: string;
  phone: string;
  email?: string | null;
  status:
    | "ACTIVE"
    | "UNSUBSCRIBED"
    | "BLOCKED";
};

type Props = {
  businessId: string;
  groupId: string;
  accessToken: string;
  contacts: Contact[];
  initialMemberIds: string[];
};

export function GroupMembersEditor({
  businessId,
  groupId,
  accessToken,
  contacts,
  initialMemberIds,
}: Props) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>(
    initialMemberIds,
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL ??
    "";

  const originalSet =
    useMemo(
      () =>
        new Set(
          initialMemberIds,
        ),
      [initialMemberIds],
    );

  const selectedSet =
    useMemo(
      () =>
        new Set(selectedIds),
      [selectedIds],
    );

  const filteredContacts =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return contacts;
      }

      return contacts.filter(
        (contact) =>
          contact.label
            .toLowerCase()
            .includes(query) ||
          contact.phone
            .toLowerCase()
            .includes(query) ||
          (contact.email ?? "")
            .toLowerCase()
            .includes(query),
      );
    }, [contacts, search]);

  const addedIds =
    useMemo(
      () =>
        selectedIds.filter(
          (id) =>
            !originalSet.has(id),
        ),
      [selectedIds, originalSet],
    );

  const removedIds =
    useMemo(
      () =>
        initialMemberIds.filter(
          (id) =>
            !selectedSet.has(id),
        ),
      [
        initialMemberIds,
        selectedSet,
      ],
    );

  const hasChanges =
    addedIds.length > 0 ||
    removedIds.length > 0;

  const allDisplayedSelected =
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
    setSuccess(null);
    setError(null);

    if (
      selectedSet.has(contactId)
    ) {
      setSelectedIds(
        selectedIds.filter(
          (id) =>
            id !== contactId,
        ),
      );

      return;
    }

    setSelectedIds([
      ...selectedIds,
      contactId,
    ]);
  }

  function selectDisplayed() {
    setSuccess(null);
    setError(null);

    setSelectedIds([
      ...new Set([
        ...selectedIds,
        ...filteredContacts.map(
          (contact) =>
            contact.id,
        ),
      ]),
    ]);
  }

  function clearDisplayed() {
    setSuccess(null);
    setError(null);

    const displayedIds =
      new Set(
        filteredContacts.map(
          (contact) =>
            contact.id,
        ),
      );

    setSelectedIds(
      selectedIds.filter(
        (id) =>
          !displayedIds.has(id),
      ),
    );
  }

  function resetChanges() {
    setSelectedIds([
      ...initialMemberIds,
    ]);

    setError(null);
    setSuccess(null);
  }

  async function getErrorMessage(
    response: Response,
  ) {
    try {
      const data =
        await response.json();

      return Array.isArray(
        data?.message,
      )
        ? data.message.join(", ")
        : data?.message ??
            "Request failed";
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  async function saveMembership() {
    if (!apiUrl) {
      setError(
        "API URL is not configured.",
      );
      return;
    }

    if (!hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      /*
       * Add newly selected
       * contacts.
       */
      for (
        const contactId of addedIds
      ) {
        const response =
          await fetch(
            `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}/members`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  contactId,
                }),
            },
          );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
            ),
          );
        }
      }

      /*
       * Remove contacts that were
       * unchecked.
       */
      for (
        const contactId of removedIds
      ) {
        const response =
          await fetch(
            `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}/members/${contactId}`,
            {
              method:
                "DELETE",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
            ),
          );
        }
      }

      setSuccess(
        "Group membership updated.",
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Failed to update group membership",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">
            Group members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search contacts and
            choose who belongs to
            this audience.
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
          {selectedIds.length}{" "}
          member
          {selectedIds.length === 1
            ? ""
            : "s"}
        </div>
      </div>

      <div>
        <label
          htmlFor="group-contact-search"
          className="mb-2 block text-sm font-medium"
        >
          Search contacts
        </label>

        <input
          id="group-contact-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search by name, phone or email"
          className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={
            selectDisplayed
          }
          disabled={
            filteredContacts.length ===
              0 ||
            allDisplayedSelected
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Select displayed
        </button>

        <button
          type="button"
          onClick={
            clearDisplayed
          }
          disabled={
            filteredContacts.length ===
            0
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear displayed
        </button>

        <button
          type="button"
          onClick={resetChanges}
          disabled={!hasChanges}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      {hasChanges && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {addedIds.length} to add
          {" · "}
          {removedIds.length} to
          remove
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
        {filteredContacts.length ===
        0 ? (
          <div className="p-5 text-sm text-slate-500">
            No contacts found.
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
                  key={contact.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleContact(
                        contact.id,
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-950">
                      {
                        contact.label
                      }
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

                  <span
                    className={[
                      "rounded-full px-2 py-1 text-[11px] font-medium",
                      contact.status ===
                      "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : contact.status ===
                            "UNSUBSCRIBED"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {contact.status}
                  </span>
                </label>
              );
            },
          )
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetChanges}
          disabled={
            saving ||
            !hasChanges
          }
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel changes
        </button>

        <button
          type="button"
          onClick={
            saveMembership
          }
          disabled={
            saving ||
            !hasChanges
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? "Saving..."
            : "Save membership"}
        </button>
      </div>
    </div>
  );
}