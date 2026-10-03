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

type Campaign = {
  id: string;
  name: string;
  channel: string;
  content: string;

  status:
    | "DRAFT"
    | "SCHEDULED"
    | "QUEUED"
    | "PROCESSING"
    | "COMPLETED"
    | "PARTIALLY_FAILED"
    | "FAILED"
    | "CANCELLED";

  totalRecipients: number;
  queuedRecipients: number;
  processingRecipients: number;
  sentRecipients: number;
  deliveredRecipients: number;
  failedRecipients: number;
  skippedRecipients: number;

  scheduledAt:
    | string
    | null;

  startedAt:
    | string
    | null;

  completedAt:
    | string
    | null;

  createdAt: string;

  senderRegistration: {
    id: string;
    senderValue: string;
  };
};

function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    new Date(value),
  );
}

function StatusBadge({
  status,
}: {
  status:
    Campaign["status"];
}) {
  const classes =
    status ===
      "COMPLETED"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
          "FAILED" ||
        status ===
          "CANCELLED"
        ? "bg-red-50 text-red-700"
        : status ===
            "PROCESSING" ||
          status ===
            "QUEUED"
          ? "bg-blue-50 text-blue-700"
          : status ===
              "SCHEDULED"
            ? "bg-violet-50 text-violet-700"
            : status ===
                "PARTIALLY_FAILED"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

export default async function CampaignsPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
    redirect(
      "/login",
    );
  }

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    redirect(
      "/dashboard",
    );
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/campaigns/business/${businessId}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  if (!response.ok) {
    const body =
      await response
        .text()
        .catch(
          () => "",
        );

    console.error(
      "Campaigns API failure",
      {
        status:
          response.status,

        body,
      },
    );

    throw new Error(
      "Unable to load campaigns",
    );
  }

  const campaigns =
    (await response.json()) as Campaign[];

  const active =
    campaigns.filter(
      (campaign) =>
        [
          "QUEUED",
          "PROCESSING",
          "SCHEDULED",
        ].includes(
          campaign.status,
        ),
    ).length;

  const completed =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
        "COMPLETED",
    ).length;

  const failed =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
          "FAILED" ||
        campaign.status ===
          "PARTIALLY_FAILED",
    ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Bulk messaging
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Campaigns
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create and monitor
            bulk SMS campaigns,
            scheduled sends and
            recipient delivery
            activity.
          </p>
        </div>

        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          New campaign
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total campaigns",
            campaigns.length,
          ],

          [
            "Active",
            active,
          ],

          [
            "Completed",
            completed,
          ],

          [
            "Failed",
            failed,
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <article
              key={
                label
              }
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
              </p>
            </article>
          ),
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {campaigns.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">
              No campaigns yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create your first
              SMS campaign to begin
              bulk messaging.
            </p>

            <Link
              href="/dashboard/campaigns/new"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Create campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Campaign
                  </th>

                  <th className="px-6 py-4">
                    Sender
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Recipients
                  </th>

                  <th className="px-6 py-4">
                    Delivered
                  </th>

                  <th className="px-6 py-4">
                    Scheduled
                  </th>

                  <th className="px-6 py-4">
                    Created
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {campaigns.map(
                  (
                    campaign,
                  ) => (
                    <tr
                      key={
                        campaign.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {
                            campaign.name
                          }
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {
                            campaign.content
                          }
                        </p>
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          campaign
                            .senderRegistration
                            .senderValue
                        }
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={
                            campaign.status
                          }
                        />
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          campaign.totalRecipients
                        }
                      </td>

                      <td className="px-6 py-5 text-slate-600">
                        {
                          campaign.deliveredRecipients
                        }
                      </td>

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          campaign.scheduledAt,
                        )}
                      </td>

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          campaign.createdAt,
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}