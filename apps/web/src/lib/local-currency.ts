export const COUNTRY_CURRENCY: Record<
  string,
  string
> = {
  GH: "GHS",
  NG: "NGN",
  US: "USD",
  GB: "GBP",

  AT: "EUR",
  BE: "EUR",
  CY: "EUR",
  DE: "EUR",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  HR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SI: "EUR",
  SK: "EUR",
};

export function currencyForIpCountry(
  countryCode:
    | string
    | null
    | undefined,
) {
  if (!countryCode) {
    return null;
  }

  return (
    COUNTRY_CURRENCY[
      countryCode
        .trim()
        .toUpperCase()
    ] ?? null
  );
}