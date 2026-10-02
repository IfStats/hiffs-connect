import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

type Wallet = {
  id: string;
  currency: string;
  balance:
    | string
    | number;
  smsUnits: number;
};

type WalletTransaction = {
  id: string;

  type:
    | "TOP_UP"
    | "MESSAGE_DEBIT"
    | "REFUND"
    | "ADJUSTMENT";

  status: string;

  amount:
    | string
    | number;

  currency: string;

  balanceBefore:
    | string
    | number;

  balanceAfter:
    | string
    | number;

  reference:
    | string
    | null;

  description:
    | string
    | null;

  createdAt: string;
};

type SmsUnitTransaction = {
  id: string;

  type:
    | "ADMIN_CREDIT"
    | "ADMIN_DEBIT"
    | "MESSAGE_DEBIT"
    | "REFUND"
    | "ADJUSTMENT";

  status: string;

  units: number;

  balanceBefore: number;
  balanceAfter: number;

  reference:
    | string
    | null;

  description:
    | string
    | null;

  createdAt: string;
};

function formatMoney(
  value:
    | string
    | number,
  currency: string,
) {
  const amount =
    Number(value);

  if (
    Number.isNaN(amount)
  ) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat(
    "en",
    {
      style:
        "currency",
      currency,
    },
  ).format(amount);
}

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
    new Date(value),
  );
}

export default async function BillingPage() {
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

  const headers = {
    Authorization:
      `Bearer ${accessToken}`,
  };

  const [
    walletResponse,
    transactionsResponse,
    smsUnitsResponse,
  ] = await Promise.all([
    fetch(
      `${apiUrl}/wallets/${businessId}`,
      {
        headers,
        cache:
          "no-store",
      },
    ),

    fetch(
      `${apiUrl}/wallets/${businessId}/transactions`,
      {
        headers,
        cache:
          "no-store",
      },
    ),

    fetch(
      `${apiUrl}/wallets/${businessId}/sms-units/transactions`,
      {
        headers,
        cache:
          "no-store",
      },
    ),
  ]);

  if (
    !walletResponse.ok ||
    !transactionsResponse.ok ||
    !smsUnitsResponse.ok
  ) {
    throw new Error(
      "Unable to load billing data",
    );
  }

  const wallet =
    (await walletResponse.json()) as Wallet;

  const transactions =
    (await transactionsResponse.json()) as WalletTransaction[];

  const smsUnitTransactions =
    (await smsUnitsResponse.json()) as SmsUnitTransaction[];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">
          Billing
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Billing & usage
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Monitor wallet balance,
          messaging credits and
          billing activity for your
          workspace.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Wallet balance
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(
              wallet.balance,
              wallet.currency,
            )}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Billing currency:{" "}
            {wallet.currency}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            SMS units
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {wallet.smsUnits.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Available messaging credits
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Wallet activity
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {transactions.length.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Recent monetary transactions
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Wallet transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monetary credits, debits,
            refunds and adjustments.
          </p>
        </div>

        {transactions.length ===
        0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No wallet transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Balance
                  </th>

                  <th className="px-6 py-4">
                    Details
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (transaction) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4 font-medium">
                        {
                          transaction.type
                        }
                      </td>

                      <td className="px-6 py-4">
                        {formatMoney(
                          transaction.amount,
                          transaction.currency,
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatMoney(
                          transaction.balanceAfter,
                          transaction.currency,
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {transaction.description ??
                          transaction.reference ??
                          "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(
                          transaction.createdAt,
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            SMS unit activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Messaging credits, usage
            and refunds.
          </p>
        </div>

        {smsUnitTransactions.length ===
        0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No SMS unit activity yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Activity
                  </th>

                  <th className="px-6 py-4">
                    Units
                  </th>

                  <th className="px-6 py-4">
                    Balance
                  </th>

                  <th className="px-6 py-4">
                    Details
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {smsUnitTransactions.map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4 font-medium">
                        {
                          transaction.type
                        }
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {transaction.units >
                        0
                          ? "+"
                          : ""}
                        {transaction.units.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {transaction.balanceAfter.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {transaction.description ??
                          transaction.reference ??
                          "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(
                          transaction.createdAt,
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