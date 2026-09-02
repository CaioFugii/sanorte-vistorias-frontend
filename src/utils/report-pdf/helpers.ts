import { ReportTypeField } from "@/domain";
import { LocalMediaFile } from "./types";

/**
 * Formats a calendar date for report PDFs without timezone shift.
 * HTML `type="date"` values (`YYYY-MM-DD`) must not go through `new Date()`,
 * which parses them as UTC midnight and shows the previous day in Brazil.
 */
export function extractPrecoCode(value: string): string {
  const raw = value.trim();
  if (!raw || raw === "-") return "";
  const match = raw.match(/^\d+/);
  return match?.[0] ?? raw;
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolveEmissionDate(
  fields: ReportTypeField[],
  formData: Record<string, unknown>
): string {
  const raw = findFieldValue(fields, formData, ["data_emissao", "data emissao"]);
  return formatReportDate(raw, formatReportDate(todayIsoDate()));
}

export function formatReportDate(value: string, emptyFallback = "-"): string {
  const raw = value.trim();
  if (!raw || raw === "-") return emptyFallback;

  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return `${day}/${month}/${year}`;
  }

  const brDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brDate) {
    return `${brDate[1]}/${brDate[2]}/${brDate[3]}`;
  }

  return raw;
}

export function toDisplayText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => toDisplayText(entry))
      .filter((entry) => entry !== "-");
    return normalized.length > 0 ? normalized.join(", ") : "-";
  }
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "-";
  if (typeof value === "string") return value.trim() ? value : "-";
  return "-";
}

export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

export function isLocalMediaFile(value: unknown): value is LocalMediaFile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalMediaFile>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.dataUrl === "string"
  );
}

export function getImageFormat(dataUrl: string): "PNG" | "JPEG" | null {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return null;
}

export async function loadImageAsDataUrl(src: string): Promise<string | null> {
  if (src.startsWith("data:image/")) return src;
  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findFieldValue(
  fields: ReportTypeField[],
  formData: Record<string, unknown>,
  keywords: string[]
): string {
  const normalizedKeywords = keywords.map(normalizeText);

  // Prefer exact fieldKey match so fuzzy label matching cannot steal values
  // (e.g. "diametro_ramal" must not lose to another field that merely mentions "diametro").
  for (const keyword of normalizedKeywords) {
    const exact = fields.find((field) => normalizeText(field.fieldKey) === keyword);
    if (exact) return toDisplayText(formData[exact.fieldKey]);
  }

  // Fall back to the most specific (longest) keyword that appears in key/label.
  const rankedKeywords = [...normalizedKeywords].sort((a, b) => b.length - a.length);
  let best: { field: ReportTypeField; score: number } | null = null;
  for (const field of fields) {
    const target = normalizeText(`${field.fieldKey} ${field.label}`);
    for (const keyword of rankedKeywords) {
      if (!target.includes(keyword)) continue;
      const score = keyword.length;
      if (!best || score > best.score) {
        best = { field, score };
      }
      break;
    }
  }
  if (!best) return "-";
  return toDisplayText(formData[best.field.fieldKey]);
}

export type AceitePhoto = LocalMediaFile & { label: string };

export function collectAceitePhotos(
  fields: ReportTypeField[],
  formData: Record<string, unknown>
): AceitePhoto[] {
  const imageFields = fields.filter((field) => field.type === "image" || field.type === "signature");
  const photos: AceitePhoto[] = [];
  for (const field of imageFields) {
    const files = asArray(formData[field.fieldKey]).filter(isLocalMediaFile);
    for (const file of files) {
      photos.push({
        ...file,
        label: field.label || file.name,
      });
    }
  }
  return photos.slice(0, 4);
}
