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

import {
  currencyForIpCountry,
} from "@/lib/local-currency";

export async function GET(
  request: NextRequest,
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

  const countryCode =
    request.headers
      .get(
        "x-vercel-ip-country",
      )
      ?.trim()
      .toUpperCase() ??
    null;

  const currency =
    currencyForIpCountry(
      countryCode,
    );

  return NextResponse.json({
    countryCode,
    currency,

    source:
      countryCode
        ? "ip"
        : "unavailable",
  });
}