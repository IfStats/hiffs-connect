import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "next-auth";

import {
  authOptions,
} from "@/auth";

export async function PATCH(
  request: Request,
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
        message:
          "Unauthorized",
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
          "Authentication required",
      },
      {
        status: 401,
      },
    );
  }

  const {
    id,
  } = await context.params;

  const body =
    await request.json();

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/pricing/sender-registrations/${encodeURIComponent(
        id,
      )}/replace`,
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
          JSON.stringify(body),

        cache:
          "no-store",
      },
    );

  const responseBody =
    await response
      .json()
      .catch(() => null);

  return NextResponse.json(
    responseBody ?? {
      message:
        response.ok
          ? "Pricing replaced"
          : "Unable to replace pricing",
    },
    {
      status:
        response.status,
    },
  );
}