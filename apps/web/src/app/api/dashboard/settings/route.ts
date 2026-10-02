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
      `${apiUrl}/businesses/${encodeURIComponent(
        businessId,
      )}/account`,
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

  if (!response.ok) {
    return NextResponse.json(
      responseBody ?? {
        message:
          "Unable to update settings",
      },
      {
        status:
          response.status,
      },
    );
  }

  return NextResponse.json(
    responseBody,
  );
}