"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  groupId: string;
  contactId: string;
  accessToken: string;
};

export function RemoveGroupMemberButton({
  businessId,
  groupId,
  contactId,
  accessToken,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function removeMember() {
    const confirmed = window.confirm(
      "Remove this contact from the group?",
    );

    if (!confirmed) {
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
        `${apiUrl}/businesses/${businessId}/contacts/groups/${groupId}/members/${contactId}`,
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
            "Failed to remove contact from group",
        );
      }

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to remove contact from group",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          void removeMember()
        }
        disabled={loading}
        className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading
          ? "Removing..."
          : "Remove"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}