import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  getServerSession,
} from 'next-auth';

import {
  authOptions,
} from '@/auth';

type Body = {
  action:
    | 'credit'
    | 'debit';

  units: number;
  reason: string;
};

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
    session.user
      .platformRole !==
      'SUPER_ADMIN'
  ) {
    return NextResponse.json(
      {
        message:
          'Unauthorized',
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
          'Authentication token unavailable',
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
    (await request.json()) as Body;

  if (
    ![
      'credit',
      'debit',
    ].includes(body.action)
  ) {
    return NextResponse.json(
      {
        message:
          'Invalid action',
      },
      {
        status: 400,
      },
    );
  }

  if (
    !Number.isInteger(
      body.units,
    ) ||
    body.units <= 0
  ) {
    return NextResponse.json(
      {
        message:
          'SMS units must be a positive integer',
      },
      {
        status: 400,
      },
    );
  }

  if (
    !body.reason?.trim()
  ) {
    return NextResponse.json(
      {
        message:
          'Reason is required',
      },
      {
        status: 400,
      },
    );
  }

  const apiBaseUrl =
    process.env
      .HIFFS_API_URL ??
    'http://localhost:4000';

  const response =
    await fetch(
      `${apiBaseUrl}/admin/businesses/${encodeURIComponent(
        id,
      )}/sms-units/${body.action}`,
      {
        method:
          'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            units:
              body.units,

            reason:
              body.reason.trim(),
          }),

        cache:
          'no-store',
      },
    );

  const payload =
    await response.json();

  return NextResponse.json(
    payload,
    {
      status:
        response.status,
    },
  );
}