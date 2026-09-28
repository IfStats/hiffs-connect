"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Contact = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone: string;
  status?: string;
};

type ContactGroup = {
  id: string;
  name: string;
};

type Props = {
  apiUrl: string;
  businessId: string;
  accessToken: string;
  value: string[];
  onChange: (
    recipients: string[],
  ) => void;
  maxRecipients?: number;
};

function getContactName(
  contact: Contact,
) {
  if (
    contact.displayName?.trim()
  ) {
    return contact.displayName.trim();
  }

  const fullName = [
    contact.firstName,
    contact.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName || contact.phone
  );
}

export function ContactsRecipientPicker({
  apiUrl,
  businessId,
  accessToken,
  value,
  onChange,
  maxRecipients = 100,
}: Props) {
  const [
    contacts,
    setContacts,
  ] = useState<Contact[]>([]);

  const [
    groups,
    setGroups,
  ] = useState<
    ContactGroup[]
  >([]);

  const [
    groupId,
    setGroupId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const selected =
    useMemo(
      () => new Set(value),
      [value],
    );

  /*
   * Load contact groups.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchGroups() {
      try {
        const response =
          await fetch(
            `${apiUrl}/businesses/${businessId}/contacts/groups`,
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
            data?.message ??
              "Failed to load contact groups",
          );
        }

        if (!cancelled) {
          setGroups(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (
        caughtError
      ) {
        if (!cancelled) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Failed to load contact groups",
          );
        }
      }
    }

    void fetchGroups();

    return () => {
      cancelled = true;
    };
  }, [
    apiUrl,
    businessId,
    accessToken,
  ]);

  /*
   * Load contacts.
   *
   * Search is debounced by
   * 250ms so we do not send a
   * request for every keystroke.
   */
  useEffect(() => {
    let cancelled = false;

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);
            setError(null);

            const params =
              new URLSearchParams();

            params.set(
              "status",
              "ACTIVE",
            );

            if (groupId) {
              params.set(
                "groupId",
                groupId,
              );
            }

            if (
              search.trim()
            ) {
              params.set(
                "search",
                search.trim(),
              );
            }

            const response =
              await fetch(
                `${apiUrl}/businesses/${businessId}/contacts?${params.toString()}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${accessToken}`,
                  },
                },
              );

            const data =
              await response.json();

            if (
              !response.ok
            ) {
              throw new Error(
                data?.message ??
                  "Failed to load contacts",
              );
            }

            if (!cancelled) {
              setContacts(
                Array.isArray(
                  data,
                )
                  ? data
                  : [],
              );
            }
          } catch (
            caughtError
          ) {
            if (!cancelled) {
              setContacts(
                [],
              );

              setError(
                caughtError instanceof
                  Error
                  ? caughtError.message
                  : "Failed to load contacts",
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(
                false,
              );
            }
          }
        },
        250,
      );

    return () => {
      cancelled = true;

      window.clearTimeout(
        timeout,
      );
    };
  }, [
    apiUrl,
    businessId,
    accessToken,
    groupId,
    search,
  ]);

  function toggleContact(
    phone: string,
  ) {
    const normalizedPhone =
      phone.trim();

    if (
      selected.has(
        normalizedPhone,
      )
    ) {
      onChange(
        value.filter(
          (item) =>
            item !==
            normalizedPhone,
        ),
      );

      return;
    }

    if (
      value.length >=
      maxRecipients
    ) {
      setError(
        `A maximum of ${maxRecipients} recipients can be selected for this batch.`,
      );

      return;
    }

    setError(null);

    onChange([
      ...value,
      normalizedPhone,
    ]);
  }

  function selectDisplayed() {
    const displayedPhones =
      contacts
        .map(
          (contact) =>
            contact.phone.trim(),
        )
        .filter(Boolean);

    const merged = [
      ...new Set([
        ...value,
        ...displayedPhones,
      ]),
    ];

    if (
      merged.length >
      maxRecipients
    ) {
      setError(
        `Selecting these contacts would exceed the ${maxRecipients}-recipient batch limit.`,
      );

      return;
    }

    setError(null);

    onChange(merged);
  }

  function clearSelection() {
    setError(null);
    onChange([]);
  }

  const allDisplayedSelected =
    contacts.length > 0 &&
    contacts.every(
      (contact) =>
        selected.has(
          contact.phone.trim(),
        ),
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
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
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Name, phone or email"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="contact-group"
            className="mb-2 block text-sm font-medium"
          >
            Group
          </label>

          <select
            id="contact-group"
            value={groupId}
            onChange={(
              event,
            ) =>
              setGroupId(
                event.target
                  .value,
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
          >
            <option value="">
              All contacts
            </option>

            {groups.map(
              (group) => (
                <option
                  key={
                    group.id
                  }
                  value={
                    group.id
                  }
                >
                  {
                    group.name
                  }
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-950">
              {value.length}
            </span>{" "}
            selected
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Maximum{" "}
            {maxRecipients}{" "}
            recipients per
            batch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              selectDisplayed
            }
            disabled={
              loading ||
              contacts.length ===
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
              clearSelection
            }
            disabled={
              value.length === 0
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
        {loading ? (
          <div className="p-5 text-sm text-slate-500">
            Loading
            contacts...
          </div>
        ) : contacts.length ===
          0 ? (
          <div className="p-5 text-sm text-slate-500">
            No contacts
            found.
          </div>
        ) : (
          contacts.map(
            (contact) => {
              const phone =
                contact.phone.trim();

              const checked =
                selected.has(
                  phone,
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
                        phone,
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

                    <span className="block truncate text-xs text-slate-500">
                      {phone}
                    </span>
                  </span>
                </label>
              );
            },
          )
        )}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Selected contacts are
        used only as recipients
        for this message.
        Selecting them here does
        not modify your contact
        database.
      </p>
    </div>
  );
}