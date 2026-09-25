"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ContactOption = {
  id: string;
  label: string;
  phone: string;
};

type Props = {
  businessId: string;
  groupId: string;
  accessToken: string;
  contacts: ContactOption[];
};

export function AddGroupMemberForm({
  businessId,
  groupId,
  accessToken,
  contacts,
}: Props) {
  const router = useRouter();

  const [contactId, setContactId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!contactId) {
      setError(
        "Select a contact.",
      );
      return;
    }

    const apiUrl =
      process.env
        .NEXT_PUBLIC_HIFFS_API_URL;

    if (!apiUrl) {
      setError(
        "API URL is not configured",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}/members`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            contactId,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Failed to add contact to group",
        );
      }

      setContactId("");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to add contact to group",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="contactId"
          className="mb-2 block text-sm font-medium"
        >
          Add contact
        </label>

        <select
          id="contactId"
          value={contactId}
          onChange={(event) =>
            setContactId(
              event.target.value,
            )
          }
          disabled={
            contacts.length === 0
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
        >
          <option value="">
            {contacts.length === 0
              ? "No available contacts"
              : "Select contact"}
          </option>

          {contacts.map(
            (contact) => (
              <option
                key={contact.id}
                value={contact.id}
              >
                {contact.label} —{" "}
                {contact.phone}
              </option>
            ),
          )}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !contactId ||
          contacts.length === 0
        }
        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading
          ? "Adding..."
          : "Add to group"}
      </button>
    </form>
  );
}