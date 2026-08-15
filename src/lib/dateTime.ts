export function parseServerDateTime(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function serverDateTimeToEpoch(value: string | null | undefined) {
  return parseServerDateTime(value)?.getTime() ?? 0;
}
