export const EGYPT_TIME_ZONE = "Africa/Cairo";

const EGYPT_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: EGYPT_TIME_ZONE,
  year: "numeric",
});

const EGYPT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: EGYPT_TIME_ZONE,
  year: "numeric",
});

function parseDateParts(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  return { day, month, year };
}

function toUtcDateKey(value: string) {
  const { day, month, year } = parseDateParts(value);
  return Date.UTC(year, month - 1, day);
}

export function toEgyptDateString(value: Date | string | number = new Date()): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return EGYPT_DATE_FORMATTER.format(new Date(value));
}

export function getEgyptToday(value: Date | string | number = new Date()): string {
  return toEgyptDateString(value);
}

export function differenceInEgyptCalendarDays(
  left: Date | string | number,
  right: Date | string | number,
): number {
  const leftKey = toUtcDateKey(toEgyptDateString(left));
  const rightKey = toUtcDateKey(toEgyptDateString(right));

  return Math.floor((leftKey - rightKey) / 86_400_000);
}

export function isPastEgyptDate(
  value: Date | string | number,
  today: Date | string | number = new Date(),
): boolean {
  return differenceInEgyptCalendarDays(today, value) > 0;
}

export function formatEgyptDateTime(value: Date | string | number): string {
  return EGYPT_DATE_TIME_FORMATTER.format(new Date(value));
}
