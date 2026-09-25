"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewContactPage() {
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

    const form =
      new FormData(
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
          form.get("displayName") ??
            "",
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
    };

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
        `${apiUrl}/businesses/${businessId}/contacts`,
        {
          method: "POST",

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
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ??
                "Failed to create contact",
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
          : "Failed to create contact",
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
          Add contact
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Add an individual recipient to
          this Hiffs Connect workspace.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
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
            placeholder="Optional business or preferred name"
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium"
          >
            Phone number
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="+233XXXXXXXXX"
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
            placeholder="Website, event, referral, CRM..."
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/contacts"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Add contact"}
          </button>
        </div>
      </form>
    </div>
  );
}