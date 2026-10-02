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
  SenderDocumentUpload,
} from "./sender-document-upload";

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

type ValidationStatus =
  | "PENDING"
  | "INTERNAL_REVIEW"
  | "DOCUMENTS_REQUIRED"
  | "READY_FOR_PROVIDER"
  | "PROVIDER_SUBMITTED"
  | "PROVIDER_PENDING"
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

  validations: Array<{
    id: string;
    provider: string;
    countryCode: string;
    status: ValidationStatus;
    reviewNotes:
      | string
      | null;
    providerReference:
      | string
      | null;
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
    rejectionReason:
      | string
      | null;
    createdAt: string;
    updatedAt: string;
  }>;

  requirements: Array<{
    id: string;
    name: string;
    description:
      | string
      | null;
    required: boolean;
    documentType:
      | string
      | null;
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  ).format(
    new Date(value),
  );
}

function statusClasses(
  status: string,
) {
  if (
    status ===
      "APPROVED" ||
    status ===
      "ACCEPTED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status ===
      "REJECTED" ||
    status ===
      "SUSPENDED"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default async function SenderDetailPage({
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
      `${apiUrl}/sender-registrations/business/${businessId}/${encodeURIComponent(
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
    throw new Error(
      "Unable to load sender registration",
    );
  }

  const sender =
    (await response.json()) as SenderRegistration;

  const latestValidation =
    sender.validations[0] ??
    null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/dashboard/senders"
          className="text-sm font-semibold text-blue-600"
        >
          ← Sender IDs
        </Link>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {
                sender.senderValue
              }
            </h1>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                sender.status,
              )}`}
            >
              {
                sender.status
              }
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {
              sender.channel
            }
            {" · "}
            {
              sender.senderType
            }
            {" · "}
            {
              sender.countryCode
            }
          </p>
        </div>
      </section>

      {sender.rejectionReason && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">
            Registration rejected
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {
              sender.rejectionReason
            }
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Registration status
          </p>

          <p className="mt-3 font-semibold">
            {
              sender.status
            }
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Validation status
          </p>

          <p className="mt-3 font-semibold">
            {latestValidation
              ?.status ??
              "Not started"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Monthly volume
          </p>

          <p className="mt-3 font-semibold">
            {sender.estimatedMonthlyVolume?.toLocaleString() ??
              "—"}
          </p>
        </article>
      </section>

      {latestValidation?.reviewNotes && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">
            Review feedback
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            {
              latestValidation.reviewNotes
            }
          </p>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Requirements
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Requirements for this sender route.
          </p>

          <div className="mt-6 space-y-3">
            {sender.requirements.map(
              (
                requirement,
              ) => (
                <div
                  key={
                    requirement.id
                  }
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {
                        requirement.name
                      }
                    </p>

                    <span className="text-xs font-semibold text-slate-500">
                      {requirement.required
                        ? "Required"
                        : "Optional"}
                    </span>
                  </div>

                  {requirement.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {
                        requirement.description
                      }
                    </p>
                  )}

                  {requirement.documentType && (
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      Document:{" "}
                      {
                        requirement.documentType
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Registration details
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">
                Use case
              </dt>

              <dd className="mt-2 text-sm leading-6 text-slate-700">
                {
                  sender.useCase ??
                  "—"
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">
                Submitted
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.submittedAt,
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">
                Approved
              </dt>

              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(
                  sender.approvedAt,
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Compliance documents
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Documents currently attached to this sender registration.
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

        {latestValidation?.status ===
  "DOCUMENTS_REQUIRED" && (
  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
    <h3 className="text-sm font-semibold text-slate-900">
      Upload requested documents
    </h3>

    <p className="mt-1 text-sm leading-6 text-slate-500">
      Upload the requested compliance documents. Each file will be reviewed before the sender can proceed to provider registration.
    </p>

    <div className="mt-5">
      <SenderDocumentUpload
  senderId={
    sender.id
  }
  requirements={
    sender.requirements
  }
  documents={
    sender.documents
  }
/>
    </div>
  </div>
)}

        {sender.documents.length ===
        0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {sender.documents.map(
              (
                document,
              ) => (
                <div
                  key={
                    document.id
                  }
                  className="py-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <p className="text-sm font-semibold">
                        {
                          document.fileName
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          document.documentType
                        }
                      </p>

                      <Link
  href={`/api/dashboard/senders/${encodeURIComponent(
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


                    </div>

                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        document.status,
                      )}`}
                    >
                      {
                        document.status
                      }
                    </span>
                  </div>

                  {document.rejectionReason && (
                    <p className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
                      {
                        document.rejectionReason
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}