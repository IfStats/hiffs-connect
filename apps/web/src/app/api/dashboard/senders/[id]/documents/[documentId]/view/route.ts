import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "next-auth";

import {
  get,
} from "@vercel/blob";

import {
  authOptions,
} from "@/auth";

type SenderDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
};

type SenderRegistration = {
  documents: SenderDocument[];
};

export async function GET(
  _request: Request,
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

  if (!session?.user) {
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
          "Business authentication required",
      },
      {
        status: 401,
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

  /*
   * Important:
   * use the business-scoped endpoint.
   *
   * The API therefore verifies that
   * this sender belongs to the
   * authenticated business.
   */
  const response =
    await fetch(
      `${apiUrl}/sender-registrations/business/${encodeURIComponent(
        businessId,
      )}/${encodeURIComponent(
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
    return NextResponse.json(
      {
        message:
          "Sender registration not found",
      },
      {
        status: 404,
      },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        message:
          "Unable to access sender registration",
      },
      {
        status:
          response.status,
      },
    );
  }

  const sender =
    (await response.json()) as SenderRegistration;

  const document =
    sender.documents.find(
      (item) =>
        item.id ===
        documentId,
    );

  if (!document) {
    return NextResponse.json(
      {
        message:
          "Document not found",
      },
      {
        status: 404,
      },
    );
  }

  const result =
    await get(
      document.fileUrl,
      {
        access:
          "private",
      },
    );

  if (
    !result ||
    result.statusCode !==
      200
  ) {
    return new NextResponse(
      "Document not found",
      {
        status: 404,
      },
    );
  }

  return new NextResponse(
    result.stream,
    {
      headers: {
        "Content-Type":
          result.blob
            .contentType ??
          "application/octet-stream",

        "Content-Disposition":
          `inline; filename="${document.fileName.replace(
            /"/g,
            "",
          )}"`,

        "X-Content-Type-Options":
          "nosniff",

        "Cache-Control":
          "private, no-store",
      },
    },
  );
}