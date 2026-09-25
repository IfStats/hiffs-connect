"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ContactStatus =
  | "ACTIVE"
  | "UNSUBSCRIBED"
  | "BLOCKED";

type Contact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string;
  email: string | null;
  status: ContactStatus;
  source: string | null;
};

type Props = {
  businessId: string;
  accessToken: string;
  contact: Contact;
};

export function ContactEditForm({
  businessId,
  accessToken,
  contact,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget,
    );

    const payload = {
      firstName:
        String(
          form.get("firstName") ?? "",
        ).trim() || undefined,

      lastName:
        String(
          form.get("lastName") ?? "",
        ).trim() || undefined,

      displayName:
        String(
          form.get("displayName") ?? "",
        ).trim() || undefined,

      phone: String(
        form.get("phone") ?? "",
      ).trim(),

      email:
        String(
          form.get("email") ?? "",
        ).trim() || undefined,

      source:
        String(
          form.get("source") ?? "",
        ).trim() || undefined,

      status: String(
        form.get("status") ?? "",
      ) as ContactStatus,
    };

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl =
        process.env
          .NEXT_PUBLIC_HIFFS_API_URL;

      if (!apiUrl) {
        throw new Error(
          "API URL is not configured",
        );
      }

      const response = await fetch(
        `${apiUrl}/businesses/${businessId}/contacts/${contact.id}`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
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
                "Failed to update contact",
        );
      }

      setSuccess(true);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to update contact",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="mb-2 block text-sm font-medium"
          >
            First name
          </label>

          <input
            id="firstName"
            name="firstName"
            type="text"
            maxLength={100}
            defaultValue={
              contact.firstName ?? ""
            }
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="mb-2 block text-sm font-medium"
          >
            Last name
          </label>

          <input
            id="lastName"
            name="lastName"
            type="text"
            maxLength={100}
            defaultValue={
              contact.lastName ?? ""
            }
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block text-sm font-medium"
        >
          Display name
        </label>

        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={200}
          defaultValue={
            contact.displayName ?? ""
          }
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-medium"
        >
          Phone
        </label>

        <input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={contact.phone}
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />

        <p className="mt-2 text-xs text-slate-500">
          Use international E.164
          format.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          defaultValue={
            contact.email ?? ""
          }
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="source"
          className="mb-2 block text-sm font-medium"
        >
          Source
        </label>

        <input
          id="source"
          name="source"
          type="text"
          maxLength={100}
          defaultValue={
            contact.source ?? ""
          }
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="status"
          className="mb-2 block text-sm font-medium"
        >
          Messaging status
        </label>

        <select
          id="status"
          name="status"
          defaultValue={
            contact.status
          }
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
        >
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

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Unsubscribed and blocked
          contacts must not receive
          campaign messages.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Contact updated successfully.
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}