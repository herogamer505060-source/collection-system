const ARABIC_LATIN_LOCALE = "ar-EG-u-nu-latn";

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(ARABIC_LATIN_LOCALE, {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatInteger(value: number): string {
  return formatNumber(value, { maximumFractionDigits: 0 });
}

export function formatPercentage(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(ARABIC_LATIN_LOCALE, {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}
