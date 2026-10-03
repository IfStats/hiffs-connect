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
  LaunchCampaignButton,
} from "./launch-campaign-button";

type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIALLY_FAILED"
  | "FAILED"
  | "CANCELLED";

type RecipientStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "SKIPPED";

type Campaign = {
  id: string;
  clientRequestId: string;
  name: string;
  channel: string;
  content: string;
  status: CampaignStatus;

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
  updatedAt: string;

  senderRegistration: {
    id: string;
    senderValue: string;
  };
};

type CampaignRecipient = {
  id: string;
  campaignId: string;
  recipient: string;
  status: RecipientStatus;

  createdAt: string;
  updatedAt: string;
};

type RecipientResponse = {
  data: CampaignRecipient[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

function CampaignStatusBadge({
  status,
}: {
  status: CampaignStatus;
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
              "QUEUED" ||
            status ===
              "PROCESSING"
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

function RecipientStatusBadge({
  status,
}: {
  status: RecipientStatus;
}) {
  const classes =
    status ===
      "DELIVERED"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
          "FAILED"
        ? "bg-red-50 text-red-700"
        : status ===
              "QUEUED" ||
            status ===
              "PROCESSING"
          ? "bg-blue-50 text-blue-700"
          : status ===
              "SENT"
            ? "bg-cyan-50 text-cyan-700"
            : status ===
                "SKIPPED"
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

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    page?: string;
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

  const resolvedSearchParams =
    await searchParams;

  const requestedPage =
    Number(
      resolvedSearchParams.page ??
        "1",
    );

  const page =
    Number.isInteger(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const limit = 100;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const headers = {
    Authorization:
      `Bearer ${accessToken}`,
  };

  const [
    campaignResponse,
    recipientsResponse,
  ] = await Promise.all([
    fetch(
      `${apiUrl}/campaigns/business/${businessId}/${id}`,
      {
        headers,
        cache:
          "no-store",
      },
    ),

    fetch(
      `${apiUrl}/campaigns/business/${businessId}/${id}/recipients?page=${page}&limit=${limit}`,
      {
        headers,
        cache:
          "no-store",
      },
    ),
  ]);

  if (
    campaignResponse.status ===
      404 ||
    recipientsResponse.status ===
      404
  ) {
    notFound();
  }

  if (
    !campaignResponse.ok ||
    !recipientsResponse.ok
  ) {
    const [
      campaignBody,
      recipientsBody,
    ] = await Promise.all([
      campaignResponse
        .text()
        .catch(
          () => "",
        ),

      recipientsResponse
        .text()
        .catch(
          () => "",
        ),
    ]);

    console.error(
      "Campaign detail API failure",
      {
        campaignStatus:
          campaignResponse.status,

        campaignBody,

        recipientsStatus:
          recipientsResponse.status,

        recipientsBody,
      },
    );

    throw new Error(
      "Unable to load campaign",
    );
  }

  const campaign =
    (await campaignResponse.json()) as Campaign;

  const recipientResult =
    (await recipientsResponse.json()) as RecipientResponse;

  const pagination =
    recipientResult.pagination;

  const previousPage =
    pagination.page > 1
      ? pagination.page - 1
      : null;

  const nextPage =
    pagination.page <
    pagination.totalPages
      ? pagination.page + 1
      : null;

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/dashboard/campaigns"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Campaigns
        </Link>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Campaign
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {campaign.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Created{" "}
              {formatDate(
                campaign.createdAt,
              )}
            </p>
          </div>

          <CampaignStatusBadge
            status={
              campaign.status
            }
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Recipients",
            campaign.totalRecipients,
          ],

          [
            "Delivered",
            campaign.deliveredRecipients,
          ],

          [
            "Sent",
            campaign.sentRecipients,
          ],

          [
            "Failed",
            campaign.failedRecipients,
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

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">
            Message
          </h2>

          <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
            {campaign.content}
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">
            Campaign details
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Sender
              </dt>

              <dd className="font-medium text-right">
                {
                  campaign
                    .senderRegistration
                    .senderValue
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Channel
              </dt>

              <dd className="font-medium">
                {
                  campaign.channel
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Scheduled
              </dt>

              <dd className="font-medium text-right">
                {formatDate(
                  campaign.scheduledAt,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Started
              </dt>

              <dd className="font-medium text-right">
                {formatDate(
                  campaign.startedAt,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Completed
              </dt>

              <dd className="font-medium text-right">
                {formatDate(
                  campaign.completedAt,
                )}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Queued
              </dt>

              <dd className="font-medium">
                {
                  campaign.queuedRecipients
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Processing
              </dt>

              <dd className="font-medium">
                {
                  campaign.processingRecipients
                }
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Skipped
              </dt>

              <dd className="font-medium">
                {
                  campaign.skippedRecipients
                }
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Recipients
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                pagination.total
              }{" "}
              unique recipients
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Page{" "}
            {
              pagination.page
            }{" "}
            of{" "}
            {Math.max(
              pagination.totalPages,
              1,
            )}
          </p>
        </div>

        {recipientResult.data.length ===
        0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            No recipients found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Recipient
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Added
                  </th>
                </tr>
              </thead>

              <tbody>
                {recipientResult.data.map(
                  (
                    recipient,
                  ) => (
                    <tr
                      key={
                        recipient.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-5 font-medium text-slate-900">
                        {
                          recipient.recipient
                        }
                      </td>

                      <td className="px-6 py-5">
                        <RecipientStatusBadge
                          status={
                            recipient.status
                          }
                        />
                      </td>

                      <td className="px-6 py-5 text-slate-500">
                        {formatDate(
                          recipient.createdAt,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          {previousPage ? (
            <Link
              href={`/dashboard/campaigns/${campaign.id}?page=${previousPage}`}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          {nextPage && (
            <Link
              href={`/dashboard/campaigns/${campaign.id}?page=${nextPage}`}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium"
            >
              Next →
            </Link>
          )}
        </div>
      </section>

      {campaign.status ===
  "DRAFT" && (
  <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-blue-950">
          Ready to launch
        </p>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-800">
          Launching reserves the
          required SMS units and
          queues all pending
          recipients for delivery.
        </p>
      </div>

      <LaunchCampaignButton
        businessId={
          businessId
        }
        campaignId={
          campaign.id
        }
        accessToken={
          accessToken
        }
      />
    </div>
  </section>
)}

{campaign.status ===
  "SCHEDULED" && (
  <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
    <p className="font-semibold text-violet-950">
      Scheduled campaign
    </p>

    <p className="mt-2 text-sm leading-6 text-violet-800">
      This campaign is
      scheduled for{" "}
      {formatDate(
        campaign.scheduledAt,
      )}.
      SMS units will be reserved
      when the campaign becomes
      eligible for launch.
    </p>
  </section>
)}
    </div>
  );
}