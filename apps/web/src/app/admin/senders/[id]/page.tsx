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
  SenderReviewControls,
} from "./sender-review-controls";

import {
  SenderValidationControls,
} from "./sender-validation-controls";

import {
  SenderDocumentUpload,
} from "./sender-document-upload";

import {
  SenderDocumentReviewControls,
} from "./sender-document-review-controls";

import {
  SenderDocumentReadiness,
} from "@/components/senders/sender-document-readiness";

type SenderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type SenderRegistration = {
  id: string;

  channel: string;
  senderType: string;
  senderValue: string;

  countryCode: string;

  destinationCountry:
    | string
    | null;

  provider:
    | string
    | null;

  providerReference:
    | string
    | null;

  status: SenderStatus;

  useCase:
    | string
    | null;

  estimatedMonthlyVolume:
    | number
    | null;

  rejectionReason:
    | string
    | null;

  submittedAt:
    | string
    | null;

  approvedAt:
    | string
    | null;

  rejectedAt:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  business: {
    id: string;
    name: string;
    countryCode: string;
    email:
      | string
      | null;
    phone:
      | string
      | null;
    website:
      | string
      | null;
  };

  requirements: Array<{
  id: string;
  provider: string;
  countryCode: string;
  channel: string;
  senderType: string;
  key: string;
  name: string;
  description: string | null;
  required: boolean;
  fieldKey: string | null;
  documentType: string | null;
  validationRule: unknown;
}>;

validations: Array<{
  id: string;
  provider: string;
  countryCode: string;
  status:
    | "PENDING"
    | "INTERNAL_REVIEW"
    | "DOCUMENTS_REQUIRED"
    | "READY_FOR_PROVIDER"
    | "PROVIDER_SUBMITTED"
    | "PROVIDER_PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED";
  reviewNotes: string | null;
  providerReference: string | null;
  submittedToProviderAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

documents: Array<{
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}>;

auditEvents: Array<{
  id: string;

  action:
    | "REGISTRATION_CREATED"
    | "REGISTRATION_SUBMITTED"
    | "VALIDATION_STARTED"
    | "DOCUMENTS_REQUESTED"
    | "REVIEW_RESUMED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_ACCEPTED"
    | "DOCUMENT_REJECTED"
    | "READY_FOR_PROVIDER"
    | "PROVIDER_SUBMITTED"
    | "PROVIDER_PENDING"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED"
    | "RESTORED";

  fromStatus: string | null;
  toStatus: string | null;

  documentId: string | null;
  documentType: string | null;

  provider: string | null;
  providerReference: string | null;

  note: string | null;

  createdAt: string;

  actorUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}>;  
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
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function StatusBadge({
  status,
}: {
  status: SenderStatus;
}) {
  const classes =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "REJECTED" ||
          status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : status === "SUBMITTED" ||
            status === "PENDING"
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

export default async function AdminSenderPage({
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

  if (!session) {
    redirect("/login");
  }

  if (
    session.user.platformRole !==
    "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const accessToken =
    session.user.accessToken;

  if (!accessToken) {
    redirect("/login");
  }

  const {
    id,
  } = await params;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/${encodeURIComponent(
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
          href="/admin/senders"
          className="text-sm font-semibold text-blue-600"
        >
          ← Sender IDs
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-900">
            Unable to load Sender ID
          </p>

          <p className="mt-2 text-sm text-red-700">
            The administration API
            returned an error while
            loading this registration.
          </p>
        </div>
      </div>
    );
  }

  const sender =
    (await response.json()) as SenderRegistration;

  const latestValidation =
  sender.validations[0] ??
  null;
  
  const requiredDocumentTypes =
  new Set(
    sender.requirements
      .filter(
        (requirement) =>
          requirement.required &&
          requirement.documentType,
      )
      .map(
        (requirement) =>
          requirement.documentType!,
      ),
  );

const acceptedDocumentTypes =
  new Set(
    sender.documents
      .filter(
        (document) =>
          document.status ===
          "ACCEPTED",
      )
      .map(
        (document) =>
          document.documentType,
      ),
  );

const documentsReady =
  Array.from(
    requiredDocumentTypes,
  ).every(
    (documentType) =>
      acceptedDocumentTypes.has(
        documentType,
      ),
  );

  return (
    <div className="space-y-8">
      <section>
        <Link
          href="/admin/senders"
          className="text-sm font-semibold text-blue-600"
        >
          ← Sender IDs
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {
                  sender.senderValue
                }
              </h1>

              <StatusBadge
                status={
                  sender.status
                }
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {
                sender.business.name
              }
              {" · "}
              {
                sender.channel
              }
              {" · "}
              {
                sender.senderType
              }
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Sender ID:{" "}
              <span className="font-mono">
                {
                  sender.id
                }
              </span>
            </p>
          </div>

          <Link
            href={`/admin/businesses/${sender.business.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
          >
            View business
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Status
          </p>

          <div className="mt-4">
            <StatusBadge
              status={
                sender.status
              }
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Origin
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {
              sender.countryCode
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Destination
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {
              sender.destinationCountry ??
              "Any"
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Monthly volume
          </p>

          <p className="mt-3 text-2xl font-semibold">
            {sender.estimatedMonthlyVolume?.toLocaleString() ??
              "—"}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Registration details
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sender ID
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  sender.senderValue
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Use case
              </dt>

              <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {
                  sender.useCase ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submitted
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.submittedAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approved
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.approvedAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rejected
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.rejectedAt,
                )}
              </dd>
            </div>

            {sender.rejectionReason && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Rejection reason
                </dt>

                <dd className="mt-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {
                    sender.rejectionReason
                  }
                </dd>
              </div>
            )}
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Business
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Name
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  sender.business.name
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Country
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {
                  sender.business.countryCode
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </dt>

              <dd className="mt-1 break-all text-sm text-slate-700">
                {
                  sender.business.email ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {
                  sender.business.phone ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Website
              </dt>

              <dd className="mt-1 break-all text-sm text-slate-700">
                {
                  sender.business.website ??
                  "—"
                }
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
  <article className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-lg font-semibold text-slate-950">
      Provider requirements
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Requirements currently configured for this sender route.
    </p>

    {sender.requirements.length === 0 ? (
      <p className="mt-6 text-sm text-slate-500">
        No active requirements found.
      </p>
    ) : (
      <div className="mt-6 space-y-3">
        {sender.requirements.map(
          (requirement) => (
            <div
              key={requirement.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {requirement.name}
                  </p>

                  {requirement.description && (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {requirement.description}
                    </p>
                  )}
                </div>

                <span
                  className={
                    requirement.required
                      ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  }
                >
                  {requirement.required
                    ? "Required"
                    : "Optional"}
                </span>
              </div>

              {requirement.documentType && (
                <p className="mt-3 text-xs font-medium text-slate-600">
                  Document: {requirement.documentType}
                </p>
              )}
            </div>
          ),
        )}
      </div>
    )}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
  <SenderDocumentUpload
    senderId={
      sender.id
    }
  />
</div>
  </article>

  <article className="rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-lg font-semibold text-slate-950">
      Validation status
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Internal and provider validation history.
    </p>

    {sender.validations.length === 0 ? (
  <p className="mt-6 text-sm text-slate-500">
    No validation records yet.
  </p>
) : (
  <div className="mt-6 space-y-4">
    {sender.validations.map(
      (validation) => (
        <div
          key={validation.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {validation.provider}
            </p>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {validation.status}
            </span>
          </div>

          {validation.providerReference && (
            <p className="mt-3 text-xs text-slate-500">
              Provider reference:{" "}
              <span className="font-mono">
                {validation.providerReference}
              </span>
            </p>
          )}

          {validation.reviewNotes && (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {validation.reviewNotes}
            </p>
          )}
        </div>
      ),
    )}

    {latestValidation && (
      <div className="border-t border-slate-100 pt-5">
        <SenderValidationControls
  senderId={
    sender.id
  }
  currentStatus={
    latestValidation.status
  }
  currentProviderReference={
    latestValidation.providerReference
  }
  documentsReady={
    documentsReady
  }
/>
      </div>
    )}
  </div>
)}
  </article>
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-950">
    Documents
  </h2>

  <p className="mt-1 text-sm text-slate-500">
    Documents supplied for sender registration and compliance review.
  </p>

  <div className="mt-6">
  <SenderDocumentReadiness
    requirements={
      sender.requirements
    }
    documents={
      sender.documents
    }
  />
</div>

  {sender.documents.length === 0 ? (
    <p className="mt-6 text-sm text-slate-500">
      No documents uploaded yet.
    </p>
  ) : (
    <div className="mt-6 divide-y divide-slate-100">
      {sender.documents.map(
  (document) => (
    <div
      key={document.id}
      className="grid gap-4 py-5 lg:grid-cols-[1fr_auto] lg:items-start"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {document.fileName}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {document.documentType}
        </p>

        <Link
  href={`/api/admin/senders/${encodeURIComponent(
    sender.id,
  )}/documents/${encodeURIComponent(
    document.id,
  )}/view`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
>
  View document
</Link>

        <p className="mt-2 text-xs font-semibold text-slate-600">
          Status: {document.status}
        </p>

        {document.rejectionReason && (
          <p className="mt-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
            {document.rejectionReason}
          </p>
        )}
      </div>

      <div className="min-w-[220px]">
        <SenderDocumentReviewControls
          senderId={
            sender.id
          }
          documentId={
            document.id
          }
          currentStatus={
            document.status
          }
        />
      </div>
    </div>
  ),
)}
    </div>
  )}
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-slate-950">
    Audit history
  </h2>

  <p className="mt-1 text-sm text-slate-500">
    Chronological record of registration, compliance, document, and provider-review activity.
  </p>

  {sender.auditEvents.length === 0 ? (
    <p className="mt-6 text-sm text-slate-500">
      No audit events recorded yet.
    </p>
  ) : (
    <div className="mt-6 space-y-4">
      {sender.auditEvents.map(
        (event) => (
          <div
            key={event.id}
            className="relative border-l-2 border-slate-200 pl-5"
          >
            <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />

            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {event.action.replaceAll(
                    "_",
                    " ",
                  )}
                </p>

                {event.fromStatus &&
                  event.toStatus && (
                    <p className="mt-1 text-xs text-slate-500">
                      {event.fromStatus}
                      {" → "}
                      {event.toStatus}
                    </p>
                  )}

                {event.documentType && (
                  <p className="mt-1 text-xs text-slate-500">
                    Document:{" "}
                    {event.documentType}
                  </p>
                )}

                {event.providerReference && (
                  <p className="mt-1 text-xs text-slate-500">
                    Provider reference:{" "}
                    <span className="font-mono">
                      {
                        event.providerReference
                      }
                    </span>
                  </p>
                )}

                {event.note && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.note}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  By{" "}
                  {event.actorUser?.name ??
                    event.actorUser
                      ?.email ??
                    "System"}
                </p>
              </div>

              <p className="shrink-0 text-xs text-slate-400">
                {formatDate(
                  event.createdAt,
                )}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  )}
</section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Review controls
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Manage the approval
            lifecycle for this Sender
            ID.
          </p>
        </div>

        <div className="mt-6">
          <SenderReviewControls
            senderId={
              sender.id
            }
            currentStatus={
              sender.status
            }
            currentProviderReference={
              sender.providerReference
            }
          />
        </div>
      </section>
    </div>
  );
}