const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function todayBrDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

export function toBrDateInput(value: string): string {
  const raw = value.trim();
  const iso = raw.match(ISO_DATE);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw;
}

export function maskBrDateInput(raw: string): string {
  const trimmed = raw.trim();
  const iso = trimmed.match(ISO_DATE);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isCompleteDateValue(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  return ISO_DATE.test(raw) || BR_DATE.test(raw);
}
