import Link from "next/link";

import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

type TemplateStatus =
  | "ACTIVE"
  | "ARCHIVED";

type MessageTemplate = {
  id: string;
  name: string;
  channel: string;
  content: string;
  variables: string[];
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default async function TemplatesPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
    redirect("/login");
  }

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    redirect("/dashboard");
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/businesses/${businessId}/templates`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load message templates",
    );
  }

  const templates =
    (await response.json()) as MessageTemplate[];

  const active =
    templates.filter(
      (template) =>
        template.status ===
        "ACTIVE",
    ).length;

  const archived =
    templates.filter(
      (template) =>
        template.status ===
        "ARCHIVED",
    ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Messaging content
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Templates
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create reusable SMS content
            with dynamic variables for
            messaging and campaigns.
          </p>
        </div>

        <Link
          href="/dashboard/templates/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create template
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total templates
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {templates.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Active
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {active}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Archived
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {archived}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {templates.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">
              No templates yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create your first reusable
              SMS template.
            </p>

            <Link
              href="/dashboard/templates/new"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Create template
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map(
              (template) => (
                <article
                  key={
                    template.id
                  }
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_1.6fr_0.8fr_0.6fr_auto]"
                >
                  <div>
                    <Link
                      href={`/dashboard/templates/${template.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {
                        template.name
                      }
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        template.channel
                      }
                    </p>
                  </div>

                  <div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {
                        template.content
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Variables
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      {template.variables.length > 0
                        ? template.variables
                            .map(
                              (value) =>
                                `{{${value}}}`,
                            )
                            .join(", ")
                        : "None"}
                    </p>
                  </div>

                  <div>
                    <span
                      className={
                        template.status ===
                        "ACTIVE"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {
                        template.status
                      }
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {formatDate(
                        template.updatedAt,
                      )}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}