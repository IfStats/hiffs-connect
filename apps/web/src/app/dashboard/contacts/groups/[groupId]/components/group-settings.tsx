"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  groupId: string;
  accessToken: string;
  name: string;
  description: string | null;
};

export function GroupSettings({
  businessId,
  groupId,
  accessToken,
  name,
  description,
}: Props) {
  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const apiUrl =
    process.env
      .NEXT_PUBLIC_HIFFS_API_URL;

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!apiUrl) {
      setError(
        "API URL is not configured",
      );
      return;
    }

    const form = new FormData(
      event.currentTarget,
    );

    const newName = String(
      form.get("name") ?? "",
    ).trim();

    const newDescription =
      String(
        form.get("description") ?? "",
      ).trim();

    if (!newName) {
      setError(
        "Group name is required.",
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: newName,
            description:
              newDescription ||
              undefined,
          }),
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
                "Failed to update group",
        );
      }

      setSuccess(true);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to update group",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!apiUrl) {
      setError(
        "API URL is not configured",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this contact group? Contacts will not be deleted.",
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}`,
        {
          method: "DELETE",

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
            "Failed to delete group",
        );
      }

      router.push(
        "/dashboard/contacts",
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete group",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleUpdate}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="groupName"
            className="mb-2 block text-sm font-medium"
          >
            Group name
          </label>

          <input
            id="groupName"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={name}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="groupDescription"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="groupDescription"
            name="description"
            rows={4}
            maxLength={500}
            defaultValue={
              description ?? ""
            }
            className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Group updated successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save changes"}
        </button>
      </form>

      <div className="border-t border-slate-200 pt-5">
        <p className="text-sm font-semibold text-red-700">
          Delete group
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          This removes the group and
          its memberships. The contacts
          themselves remain intact.
        </p>

        <button
          type="button"
          onClick={() =>
            void handleDelete()
          }
          disabled={deleting}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting
            ? "Deleting..."
            : "Delete group"}
        </button>
      </div>
    </div>
  );
}