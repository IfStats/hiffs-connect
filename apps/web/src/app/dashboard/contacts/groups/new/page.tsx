"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewContactGroupPage() {
  const router = useRouter();
  const { data: session } =
    useSession();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const businessId =
    session?.user?.businessId;

  const accessToken =
    session?.user?.accessToken;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!businessId || !accessToken) {
      setError(
        "Your authenticated business session is unavailable.",
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
      form.get("description") ?? "",
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
      const apiUrl =
        process.env
          .NEXT_PUBLIC_HIFFS_API_URL;

      if (!apiUrl) {
        throw new Error(
          "API URL is not configured",
        );
      }

      const response = await fetch(
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
                "Failed to create contact group",
        );
      }

      router.push(
        `/dashboard/contacts/groups/${data.id}`,
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
    <div className="mx-auto max-w-3xl space-y-8">
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
          Create a reusable audience
          for campaigns, bulk messaging
          and targeted communication.
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
            Group names must be unique
            within this workspace.
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
            rows={5}
            maxLength={500}
            placeholder="Describe who belongs to this group and how it will be used."
            className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">
            Reusable audience
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Contacts can belong to
            multiple groups. Groups will
            later be selectable as
            campaign audiences.
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
              : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}