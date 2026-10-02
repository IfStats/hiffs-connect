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

type Body = {
  status:
    | "ACCEPTED"
    | "REJECTED";

  rejectionReason?: string;
};

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
      documentId: string;
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
    body.status !==
      "ACCEPTED" &&
    body.status !==
      "REJECTED"
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid document status",
      },
      {
        status: 400,
      },
    );
  }

  if (
    body.status ===
      "REJECTED" &&
    !body.rejectionReason
      ?.trim()
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

  const {
    id,
    documentId,
  } = await context.params;

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/${encodeURIComponent(
        id,
      )}/documents/${encodeURIComponent(
        documentId,
      )}/status`,
      {
        method:
          "PATCH",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            status:
              body.status,

            rejectionReason:
              body.rejectionReason
                ?.trim() ||
              undefined,
          }),

        cache:
          "no-store",
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