import Link from "next/link";
import {
  getServerSession,
} from "next-auth";
import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

type Message = {
  id: string;
  recipient: string;
  sender: string;
  channel: string;
  status: string;
  content: string;
  segmentCount:
    | number
    | null;
  customerPrice:
    | string
    | number
    | null;
  currency:
    | string
    | null;
  createdAt: string;
  sentAt:
    | string
    | null;
  deliveredAt:
    | string
    | null;
  failureReason:
    | string
    | null;
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GH",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

export default async function MessagesPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (
    !session?.user
  ) {
    redirect(
      "/login",
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
    redirect(
      "/dashboard",
    );
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const response =
    await fetch(
      `${apiUrl}/messaging/business/${businessId}/messages`,
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
    !response.ok
  ) {
    const body =
      await response
        .text()
        .catch(
          () => "",
        );

    console.error(
      "Messages API failure",
      {
        status:
          response.status,

        body,
      },
    );

    throw new Error(
      "Unable to load messages",
    );
  }

  const messages =
    (await response.json()) as Message[];

  const delivered =
    messages.filter(
      (message) =>
        message.status ===
        "DELIVERED",
    ).length;

  const failed =
    messages.filter(
      (message) =>
        message.status ===
        "FAILED",
    ).length;

  const pending =
    messages.filter(
      (message) =>
        [
          "QUEUED",
          "ACCEPTED",
          "SENT",
        ].includes(
          message.status,
        ),
    ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Messaging
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Messages
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Send business
            messages, monitor
            delivery activity and
            review communication
            history from one
            workspace.
          </p>
        </div>

        <Link
          href="/dashboard/messages/send"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Send message
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total messages",
            messages.length,
          ],
          [
            "Delivered",
            delivered,
          ],
          [
            "Pending",
            pending,
          ],
          [
            "Failed",
            failed,
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <article
              key={
                label
              }
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
              </p>
            </article>
          ),
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Message history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent SMS and
              messaging activity.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Showing latest{" "}
            {
              messages.length
            }{" "}
            messages
          </p>
        </div>

        {messages.length ===
        0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              No messages yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Send your first SMS
              to begin generating
              delivery history.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Recipient
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Sender
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Pages
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Charge
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {messages.map(
                  (
                    message,
                  ) => (
                    <tr
                      key={
                        message.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-5 font-medium">
                        {
                          message.recipient
                        }
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {
                          message.sender
                        }
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                          {
                            message.status
                          }
                        </span>
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {message.segmentCount ??
                          "—"}
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {message.customerPrice !=
                          null &&
                        message.currency
                          ? `${message.currency} ${message.customerPrice}`
                          : "—"}
                      </td>

                      <td className="px-5 py-5 text-slate-500">
                        {formatDate(
                          message.createdAt,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}