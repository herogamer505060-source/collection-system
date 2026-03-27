const ARABIC_LATIN_LOCALE = "ar-EG-u-nu-latn";

export function formatCurrency(amount: number, currency = "EGP"): string {
  return new Intl.NumberFormat(ARABIC_LATIN_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
