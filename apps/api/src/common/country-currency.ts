const COUNTRY_CURRENCY: Record<string, string> = {
  GH: 'GHS',
  NG: 'NGN',
  KE: 'KES',
  ZA: 'ZAR',
  GB: 'GBP',
  US: 'USD',
};

export function currencyForCountry(
  countryCode: string,
): string {
  const normalized =
    countryCode.trim().toUpperCase();

  return COUNTRY_CURRENCY[
    normalized
  ] ?? 'USD';
}