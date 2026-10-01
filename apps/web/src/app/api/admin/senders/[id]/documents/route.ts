import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "next-auth";

import {
  put,
} from "@vercel/blob";

import {
  authOptions,
} from "@/auth";

export async function POST(
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

  const {
    id,
  } = await context.params;

  const formData =
    await request.formData();

  const file =
    formData.get(
      "file",
    );

  const documentType =
    String(
      formData.get(
        "documentType",
      ) ?? "",
    ).trim();

  if (
    !(file instanceof File)
  ) {
    return NextResponse.json(
      {
        message:
          "Document file is required",
      },
      {
        status: 400,
      },
    );
  }

  if (!documentType) {
    return NextResponse.json(
      {
        message:
          "Document type is required",
      },
      {
        status: 400,
      },
    );
  }

  const allowedTypes =
    new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]);

  if (
    !allowedTypes.has(
      file.type,
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Only PDF, JPG, and PNG documents are supported",
      },
      {
        status: 400,
      },
    );
  }

  const maxFileSize =
    10 * 1024 * 1024;

  if (
    file.size >
    maxFileSize
  ) {
    return NextResponse.json(
      {
        message:
          "Document must not exceed 10 MB",
      },
      {
        status: 400,
      },
    );
  }

  const safeFileName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    );

  const blob =
    await put(
      `sender-documents/${id}/${Date.now()}-${safeFileName}`,
      file,
      {
        access:
          "private",
      },
    );

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/sender-registrations/${encodeURIComponent(
        id,
      )}/documents`,
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
          JSON.stringify({
            documentType,
            fileName:
              file.name,
            fileUrl:
              blob.url,
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

  if (!response.ok) {
    return NextResponse.json(
      payload,
      {
        status:
          response.status,
      },
    );
  }

  return NextResponse.json(
    payload,
    {
      status: 201,
    },
  );
}