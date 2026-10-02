import {
  getServerSession,
} from "next-auth";

import {
  redirect,
} from "next/navigation";

import {
  authOptions,
} from "@/auth";

import {
  SenderPricingForm,
} from "./sender-pricing-form";

type MessagingPricing = {
  id: string;
  countryCode: string;
  countryName: string;
  channel: string;
  network: string | null;
  provider: string;
  providerCost: string;
  providerCostCurrency: string;
  retailPrice: string;
  currency: string;
  status: string;
};

type SenderPricing = {
  id: string;
  provider: string;
  countryCode: string;
  channel: string;
  senderType: string;
  providerCost: string;
  providerCostCurrency: string;
  retailPrice: string;
  currency: string;
  active: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

function formatAmount(
  value: string,
  currency: string,
) {
  const amount =
    Number(value);

  if (
    Number.isNaN(amount)
  ) {
    return `${currency} ${value}`;
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",
        currency,
      },
    ).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(
      2,
    )}`;
  }
}

export default async function AdminPricingPage() {
  const session =
    await getServerSession(
      authOptions,
    );

  if (!session) {
    redirect("/login");
  }

  if (
    session.user.platformRole !==
    "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const accessToken =
    session.user.accessToken;

  if (!accessToken) {
    redirect("/login");
  }

  const apiUrl =
    process.env.HIFFS_API_URL ??
    "http://localhost:4000";

  const headers = {
    Authorization:
      `Bearer ${accessToken}`,
  };

  const [
    messagingResponse,
    senderResponse,
  ] = await Promise.all([
    fetch(
      `${apiUrl}/pricing`,
      {
        headers,
        cache:
          "no-store",
      },
    ),

    fetch(
      `${apiUrl}/pricing/sender-registrations`,
      {
        headers,
        cache:
          "no-store",
      },
    ),
  ]);

  if (
    !messagingResponse.ok ||
    !senderResponse.ok
  ) {
    throw new Error(
      "Unable to load pricing",
    );
  }

  const messagingPricing =
    (await messagingResponse.json()) as MessagingPricing[];

  const senderPricing =
    (await senderResponse.json()) as SenderPricing[];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Billing administration
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Pricing
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Manage customer messaging
          prices and sender
          registration fees across
          providers and countries.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Sender registration pricing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            One-time registration
            charges applied when a
            customer submits a sender
            ID for review.
          </p>
        </div>

        <SenderPricingForm />

        {senderPricing.length ===
        0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No sender registration
            pricing configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Route
                  </th>

                  <th className="px-6 py-4">
                    Provider cost
                  </th>

                  <th className="px-6 py-4">
                    Customer price
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Effective
                  </th>
                </tr>
              </thead>

              <tbody>
                {senderPricing.map(
                  (pricing) => (
                    <tr
                      key={
                        pricing.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {
                            pricing.countryCode
                          }
                          {" · "}
                          {
                            pricing.channel
                          }
                          {" · "}
                          {
                            pricing.senderType
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            pricing.provider
                          }
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {formatAmount(
                          pricing.providerCost,
                          pricing.providerCostCurrency,
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatAmount(
                          pricing.retailPrice,
                          pricing.currency,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            pricing.active
                              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          }
                        >
                          {pricing.active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {new Date(
                          pricing.effectiveFrom,
                        ).toLocaleDateString(
                          "en-GB",
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
            Messaging pricing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Delivery pricing by
            country, provider, network
            and channel.
          </p>
        </div>

        {messagingPricing.length ===
        0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            No messaging pricing
            configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Destination
                  </th>

                  <th className="px-6 py-4">
                    Provider
                  </th>

                  <th className="px-6 py-4">
                    Cost
                  </th>

                  <th className="px-6 py-4">
                    Retail
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {messagingPricing.map(
                  (pricing) => (
                    <tr
                      key={
                        pricing.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {
                            pricing.countryName
                          }
                          {" ("}
                          {
                            pricing.countryCode
                          }
                          {")"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            pricing.channel
                          }
                          {pricing.network
                            ? ` · ${pricing.network}`
                            : ""}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {
                          pricing.provider
                        }
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {formatAmount(
                          pricing.providerCost,
                          pricing.providerCostCurrency,
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatAmount(
                          pricing.retailPrice,
                          pricing.currency,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {
                          pricing.status
                        }
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