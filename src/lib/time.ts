// Time-zone helpers built on Intl, so the server and browser agree without a date library.

function offsetMs(date: Date, timeZone: string) {
  // Fixed locale: only the numbers are read back, never shown.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-10-04T15:00" wall-clock time in `timeZone` → Date. */
export function zonedLocalToDate(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = offsetMs(new Date(guess), timeZone);
  let result = guess - first;
  const second = offsetMs(new Date(result), timeZone);
  if (second !== first) result = guess - second;
  return new Date(result);
}

/** Date → "2026-10-04T15:00" wall-clock time in `timeZone` (for datetime-local inputs). */
export function dateToZonedLocal(date: Date | string | null, timeZone: string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const shifted = new Date(d.getTime() + offsetMs(d, timeZone));
  return shifted.toISOString().slice(0, 16);
}

/** Times drop a ":00" in 12-hour locales ("3 PM"), but keep it in 24-hour ones ("15:00"). */
function formatTime(d: Date, timeZone: string, locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, { timeZone, hour: "numeric", minute: "2-digit" });
  const twelveHour = fmt.formatToParts(d).some((p) => p.type === "dayPeriod");
  return twelveHour ? fmt.format(d).replace(":00", "") : fmt.format(d);
}

/** `locale` is the site language's (the dictionary's `locale`), e.g. "en-US" or "es". */
export function formatEventDate(start: string | null, end: string | null, timeZone: string, locale: string) {
  if (!start) return null;
  const s = new Date(start);
  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(s);
  // Some languages write weekdays in lowercase ("sábado"), but this one starts a line.
  const day = weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1);
  const tz = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
    .formatToParts(s)
    .find((p) => p.type === "timeZoneName")?.value;
  let times = formatTime(s, timeZone, locale);
  if (end) {
    const e = new Date(end);
    const sameDay = dateToZonedLocal(s, timeZone).slice(0, 10) === dateToZonedLocal(e, timeZone).slice(0, 10);
    times += sameDay
      ? ` – ${formatTime(e, timeZone, locale)}`
      : ` – ${new Intl.DateTimeFormat(locale, { timeZone, month: "short", day: "numeric" }).format(e)}, ${formatTime(e, timeZone, locale)}`;
  }
  const long = new Intl.DateTimeFormat(locale, { timeZone, month: "long", day: "numeric", year: "numeric" }).format(s);
  return { day, long, times: `${times}${tz ? ` ${tz}` : ""}` };
}

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Puerto_Rico",
  "Europe/London",
  "Europe/Madrid",
  "Asia/Dubai",
  "Asia/Karachi",
  "UTC",
];
