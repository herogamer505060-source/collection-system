import { stripKnownProjectPrefix } from "@/features/imports/normalization/normalize-project";

function coerceText(value: unknown): string | null {
  if (typeof value === "string") {
    const text = value.trim();

    return text.length > 0 ? text : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeToken(value: string): string {
  return value.replace(/\s*[-–—]\s*/g, "-").replace(/\s+/g, "").toUpperCase();
}

function splitCompositeToken(value: string): string[] {
  if (value.includes("+")) {
    return value
      .split("+")
      .flatMap((token) => splitCompositeToken(token.trim()))
      .filter((token) => token.length > 0);
  }

  const hyphenSegments = value.split("-").map((segment) => segment.trim());

  if (hyphenSegments.length > 1 && hyphenSegments.every((segment) => /^[A-Za-z]+\d+$/i.test(segment))) {
    return hyphenSegments.map(normalizeToken);
  }

  return [normalizeToken(value)];
}

export function parseCompositeUnitCode(value: unknown): string[] {
  const rawValue = coerceText(value);

  if (!rawValue) {
    return [];
  }

  const { value: unitCodeValue } = stripKnownProjectPrefix(rawValue);
  const normalizedValue = unitCodeValue.replace(/\s*\+\s*/g, "+").trim();
  const parsedTokens = splitCompositeToken(normalizedValue).filter((token) => token.length > 0);

  return Array.from(new Set(parsedTokens));
}
