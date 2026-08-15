const SERVER_LOCAL_TIME_OFFSET = "+09:00";
const ISO_TIMEZONE_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/;

export function parseServerDateTime(value: string | null | undefined) {
  if (!value) return null;

  const normalizedValue = ISO_TIMEZONE_PATTERN.test(value)
    ? value
    : `${value}${SERVER_LOCAL_TIME_OFFSET}`;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function serverDateTimeToEpoch(value: string | null | undefined) {
  return parseServerDateTime(value)?.getTime() ?? 0;
}
