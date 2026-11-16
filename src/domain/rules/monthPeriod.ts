const TIME_ZONE = "America/Sao_Paulo";

export type MonthRange = { from: string; to: string };

type CalendarDate = { year: number; month: number; day: number };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function saoPauloToday(now = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

export function currentMonthKey(now = new Date()): string {
  const today = saoPauloToday(now);
  return `${today.year}-${pad(today.month)}`;
}

export function parseMonthKey(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) return null;
  return value;
}

export function isFutureMonth(monthKey: string, now = new Date()): boolean {
  return monthKey > currentMonthKey(now);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`;
}

export function monthKeyToRange(monthKey: string, now = new Date()): MonthRange {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const from = `${year}-${pad(month)}-01`;
  if (monthKey === currentMonthKey(now)) {
    const today = saoPauloToday(now);
    return { from, to: `${today.year}-${pad(today.month)}-${pad(today.day)}` };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return { from, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}

export function resolveMonthKey(params: { get(name: string): string | null }): string {
  const explicit = parseMonthKey(params.get("month"));
  if (explicit && !isFutureMonth(explicit)) return explicit;
  return monthKeyFromPeriod(params.get("from"), params.get("to")) ?? currentMonthKey();
}

export function monthKeyFromPeriod(from: string | null, to: string | null): string | null {
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return null;
  }
  if (from.slice(0, 7) !== to.slice(0, 7)) return null;
  const monthKey = parseMonthKey(from.slice(0, 7));
  if (!monthKey || isFutureMonth(monthKey)) return null;
  return monthKey;
}

export function coerceMonthRange(from: string, to: string, now = new Date()): MonthRange | null {
  const source = from || to;
  if (!source) return null;
  const monthKey = parseMonthKey(source.slice(0, 7));
  if (!monthKey || isFutureMonth(monthKey, now)) return null;
  if (from && from.slice(0, 7) !== monthKey) return null;
  if (to && to.slice(0, 7) !== monthKey) return null;
  return monthKeyToRange(monthKey, now);
}

export function formatMonthKeyLabel(monthKey: string): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

export function monthShortLabels(): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(2026, index, 1))
      .replace(".", "")
  );
}
