import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "next-auth";

import {
  authOptions,
} from "@/auth";

type SenderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

type Body = {
  status: SenderStatus;
  providerReference?: string;
  rejectionReason?: string;
};

const allowedStatuses =
  new Set<SenderStatus>([
    "DRAFT",
    "PENDING",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
  ]);

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const session =
    await getServerSession(
      authOptions,
    );

  if (
    !session?.user ||
    session.user.platformRole !==
      "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const accessToken =
    session.user.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      {
        message:
          "Authentication token unavailable",
      },
      {
        status: 401,
      },
    );
  }

  const body =
    (await request.json()) as Body;

  if (
    !allowedStatuses.has(
      body.status,
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid sender status",
      },
      {
        status: 400,
      },
    );
  }

  if (
    body.status ===
      "REJECTED" &&
    !body.rejectionReason?.trim()
  ) {
    return NextResponse.json(
      {
        message:
          "Rejection reason is required",
      },
      {
        status: 400,
      },
    );
  }

  const { id } =
    await context.params;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/${encodeURIComponent(
        id,
      )}/status`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          status:
            body.status,

          providerReference:
            body.providerReference
              ?.trim() ||
            undefined,

          rejectionReason:
            body.rejectionReason
              ?.trim() ||
            undefined,
        }),

        cache: "no-store",
      },
    );

  const payload =
    await response
      .json()
      .catch(() => ({
        message:
          "Unexpected API response",
      }));

  return NextResponse.json(
    payload,
    {
      status:
        response.status,
    },
  );
}