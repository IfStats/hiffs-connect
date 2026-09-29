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
  status: string;
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
};

export default async function ReportsPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session?.user) {
    redirect("/login");
  }

  const businessId =
    session.user.businessId;

  const accessToken =
    session.user.accessToken;

  if (
    !businessId ||
    !accessToken
  ) {
    redirect("/dashboard");
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

  if (!response.ok) {
    throw new Error(
      "Unable to load messaging report",
    );
  }

  const messages =
    (await response.json()) as Message[];

  const totalMessages =
    messages.length;

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

  const totalSegments =
    messages.reduce(
      (total, message) =>
        total +
        (message.segmentCount ??
          0),
      0,
    );

  const deliveryRate =
    totalMessages > 0
      ? (
          (delivered /
            totalMessages) *
          100
        ).toFixed(1)
      : "0.0";

  const currency =
    messages.find(
      (message) =>
        message.currency,
    )?.currency ?? "USD";

  const totalSpend =
    messages.reduce(
      (total, message) =>
        total +
        Number(
          message.customerPrice ??
            0,
        ),
      0,
    );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Reports
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Messaging performance
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Review message volume,
          delivery performance and
          SMS usage for your
          workspace.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Messages sent",
            totalMessages,
          ],

          [
            "Delivered",
            delivered,
          ],

          [
            "Delivery rate",
            `${deliveryRate}%`,
          ],

          [
            "SMS pages",
            totalSegments,
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <article
              key={label}
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

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">
            Delivery status
          </h2>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">
                Delivered
              </dt>

              <dd className="font-semibold">
                {delivered}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">
                Pending
              </dt>

              <dd className="font-semibold">
                {pending}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">
                Failed
              </dt>

              <dd className="font-semibold">
                {failed}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">
            Usage & billing
          </h2>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">
                SMS pages
              </dt>

              <dd className="font-semibold">
                {totalSegments}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">
                Messaging charges
              </dt>

              <dd className="font-semibold">
                {currency}{" "}
                {totalSpend.toFixed(
                  3,
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}