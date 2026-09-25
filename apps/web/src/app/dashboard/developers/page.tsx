"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type ApiKeyRecord = {
  id: string;
  businessId: string;
  name: string;
  prefix: string;
  lastFour: string;
  enabled: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DevelopersPage() {
  const { data: session, status } = useSession();

  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const businessId = session?.user?.businessId;
  const accessToken = session?.user?.accessToken;

  const loadApiKeys = useCallback(async () => {
    if (!businessId || !accessToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_HIFFS_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(
        `${apiUrl}/api-keys/business/${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? "Failed to load API keys");
      }

      setApiKeys(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load API keys",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId, accessToken]);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !businessId ||
      !accessToken
    ) {
      return;
    }

    let cancelled = false;

    async function fetchApiKeys() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_HIFFS_API_URL;

        if (!apiUrl) {
          throw new Error("API URL is not configured");
        }

        const response = await fetch(
          `${apiUrl}/api-keys/business/${businessId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },

            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ?? "Failed to load API keys",
          );
        }

        if (!cancelled) {
          setApiKeys(data);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load API keys",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchApiKeys();

    return () => {
      cancelled = true;
    };
  }, [status, businessId, accessToken]);

  async function revokeApiKey(id: string) {
    if (!businessId || !accessToken) {
      return;
    }

    const confirmed = window.confirm(
      "Revoke this API key? Applications using it will immediately lose access.",
    );

    if (!confirmed) {
      return;
    }

    setRevokingId(id);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_HIFFS_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(
        `${apiUrl}/api-keys/business/${businessId}/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Failed to revoke API key",
        );
      }

      await loadApiKeys();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to revoke API key",
      );
    } finally {
      setRevokingId(null);
    }
  }

  const activeKeys = apiKeys.filter(
    (key) =>
      key.enabled &&
      !key.revokedAt &&
      (!key.expiresAt || new Date(key.expiresAt) > new Date()),
  );

  const lastUsed =
    apiKeys
      .filter((key) => key.lastUsedAt)
      .sort(
        (a, b) =>
          new Date(b.lastUsedAt!).getTime() -
          new Date(a.lastUsedAt!).getTime(),
      )[0]?.lastUsedAt ?? null;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Developers
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            API access
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage credentials used to integrate Hiffs Connect
            with your applications and business systems.
          </p>
        </div>

        <Link
          href="/dashboard/developers/api-keys/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Create API key
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Active keys
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {activeKeys.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total keys
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {apiKeys.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Last API activity
          </p>

          <p className="mt-3 text-sm font-semibold tracking-tight text-slate-900">
            {lastUsed
              ? new Date(lastUsed).toLocaleString()
              : "Never"}
          </p>
        </article>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              API keys
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Credentials used to authenticate requests to the
              Hiffs Connect API.
            </p>
          </div>

          <Link
            href="/dashboard/developers/docs"
            className="text-sm font-medium text-blue-600"
          >
            API documentation →
          </Link>
        </div>

        {loading || status === "loading" ? (
          <div className="p-8 text-sm text-slate-500">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8">
            <h3 className="font-medium text-slate-900">
              No API keys yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create a key to start using the Hiffs Connect API.
            </p>

            <Link
              href="/dashboard/developers/api-keys/new"
              className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
            >
              Create API key
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Name
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Key
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Last used
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Created
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Expires
                  </th>

                  <th className="px-5 py-4 font-medium" />
                </tr>
              </thead>

              <tbody>
                {apiKeys.map((key) => {
                  const expired = Boolean(
                    key.expiresAt &&
                      new Date(key.expiresAt) <= new Date(),
                  );

                  const active =
                    key.enabled &&
                    !key.revokedAt &&
                    !expired;

                  return (
                    <tr
                      key={key.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-5 font-medium">
                        {key.name}
                      </td>

                      <td className="px-5 py-5 font-mono text-xs text-slate-500">
                        {key.prefix}.••••••••{key.lastFour}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {key.revokedAt
                            ? "REVOKED"
                            : expired
                              ? "EXPIRED"
                              : active
                                ? "ACTIVE"
                                : "INACTIVE"}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {key.lastUsedAt
                          ? new Date(
                              key.lastUsedAt,
                            ).toLocaleString()
                          : "Never"}
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {new Date(
                          key.createdAt,
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {key.expiresAt
                          ? new Date(
                              key.expiresAt,
                            ).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          type="button"
                          disabled={
                            !active ||
                            revokingId === key.id
                          }
                          onClick={() =>
                            void revokeApiKey(key.id)
                          }
                          className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {revokingId === key.id
                            ? "Revoking..."
                            : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-950">
          Keep API keys private
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800">
          API keys should only be used from trusted server
          environments. Do not expose them in browser-side
          JavaScript, mobile applications, or public repositories.
        </p>
      </section>
    </div>
  );
}