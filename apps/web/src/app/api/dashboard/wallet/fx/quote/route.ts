import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "next-auth";

import {
  authOptions,
} from "@/auth";

export async function POST(
  request: Request,
) {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
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

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    return NextResponse.json(
      {
        message:
          "Business context required",
      },
      {
        status: 403,
      },
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "Invalid request body",
      },
      {
        status: 400,
      },
    );
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/wallets/${encodeURIComponent(
        businessId,
      )}/fx/quote`,
      {
        method:
          "POST",

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

  const payload =
    await response
      .json()
      .catch(() => null);

  return NextResponse.json(
    payload ?? {
      message:
        "Unexpected FX API response",
    },
    {
      status:
        response.status,
    },
  );
}