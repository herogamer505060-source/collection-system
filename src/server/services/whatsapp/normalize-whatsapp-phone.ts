export function normalizeWhatsAppPhone(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("+")) {
    return digits.slice(1);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `2${digits}`;
  }

  return digits;
}
