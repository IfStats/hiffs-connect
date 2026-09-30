import Link from "next/link";

import {
  getServerSession,
} from "next-auth";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

import {
  TemplateEditor,
} from "./template-editor";

type TemplateStatus =
  | "ACTIVE"
  | "ARCHIVED";

type MessageTemplate = {
  id: string;
  name: string;
  channel: "SMS" | "WHATSAPP";
  content: string;
  variables: string[];
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
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

  const {
    id,
  } = await params;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/businesses/${businessId}/templates/${encodeURIComponent(
        id,
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  if (
    response.status ===
    404
  ) {
    notFound();
  }

  if (!response.ok) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/templates"
          className="text-sm font-semibold text-blue-600"
        >
          ← Templates
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load template
          </p>

          <p className="mt-2 text-sm text-red-700">
            The messaging API returned
            an error while loading this
            template.
          </p>
        </div>
      </div>
    );
  }

  const template =
    (await response.json()) as MessageTemplate;

  const canManage =
    session.user.businessRole ===
      "OWNER" ||
    session.user.businessRole ===
      "ADMIN" ||
    session.user.businessRole ===
      "OPERATOR";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <Link
          href="/dashboard/templates"
          className="text-sm font-semibold text-blue-600"
        >
          ← Templates
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {
                  template.name
                }
              </h1>

              <span
                className={
                  template.status ===
                  "ACTIVE"
                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                }
              >
                {
                  template.status
                }
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {
                template.channel
              }{" "}
              message template
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Template ID:{" "}
              <span className="font-mono">
                {
                  template.id
                }
              </span>
            </p>
          </div>
        </div>
      </section>

      <TemplateEditor
        businessId={
          businessId
        }
        accessToken={
          accessToken
        }
        initialTemplate={
          template
        }
        canManage={
          canManage
        }
      />
    </div>
  );
}