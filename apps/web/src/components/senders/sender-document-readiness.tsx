type Requirement = {
  id: string;
  name: string;
  required: boolean;
  documentType: string | null;
};

type Document = {
  id: string;
  documentType: string;

  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED";

  rejectionReason:
    | string
    | null;

  createdAt: string;
};

type Props = {
  requirements: Requirement[];
  documents: Document[];
};

type ReadinessStatus =
  | "MISSING"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

function getStatusClasses(
  status: ReadinessStatus,
) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function SenderDocumentReadiness({
  requirements,
  documents,
}: Props) {
  const seen =
    new Set<string>();

  const requiredDocuments =
    requirements.filter(
      (requirement) => {
        if (
          !requirement.required ||
          !requirement.documentType
        ) {
          return false;
        }

        if (
          seen.has(
            requirement.documentType,
          )
        ) {
          return false;
        }

        seen.add(
          requirement.documentType,
        );

        return true;
      },
    );

  const rows =
    requiredDocuments.map(
      (requirement) => {
        const documentType =
          requirement.documentType!;

        const matchingDocuments =
          documents
            .filter(
              (document) =>
                document.documentType ===
                documentType,
            )
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt,
                ).getTime() -
                new Date(
                  a.createdAt,
                ).getTime(),
            );

        const accepted =
          matchingDocuments.find(
            (document) =>
              document.status ===
              "ACCEPTED",
          );

        const pending =
          matchingDocuments.find(
            (document) =>
              document.status ===
              "PENDING",
          );

        const rejected =
          matchingDocuments.find(
            (document) =>
              document.status ===
              "REJECTED",
          );

        let status: ReadinessStatus =
          "MISSING";

        if (accepted) {
          status =
            "ACCEPTED";
        } else if (pending) {
          status =
            "PENDING";
        } else if (rejected) {
          status =
            "REJECTED";
        }

        return {
          requirement,
          status,
          rejectionReason:
            status ===
              "REJECTED"
              ? rejected
                  ?.rejectionReason ??
                null
              : null,
        };
      },
    );

  if (
    rows.length ===
    0
  ) {
    return (
      <p className="text-sm text-slate-500">
        No required compliance documents are configured for this sender.
      </p>
    );
  }

  const acceptedCount =
    rows.filter(
      (row) =>
        row.status ===
        "ACCEPTED",
    ).length;

  const ready =
    acceptedCount ===
    rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Document readiness
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {acceptedCount} of{" "}
            {rows.length} required
            documents accepted
          </p>
        </div>

        <span
          className={
            ready
              ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
          }
        >
          {ready
            ? "Ready"
            : "Action required"}
        </span>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map(
          ({
            requirement,
            status,
            rejectionReason,
          }) => (
            <div
              key={
                requirement.id
              }
              className="p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {
                      requirement.name
                    }
                  </p>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {
                      requirement.documentType
                    }
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                    status,
                  )}`}
                >
                  {status}
                </span>
              </div>

              {rejectionReason && (
                <p className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
                  {
                    rejectionReason
                  }
                </p>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}