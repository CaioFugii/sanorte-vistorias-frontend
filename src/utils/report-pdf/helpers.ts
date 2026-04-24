import { ReportTypeField } from "@/domain";
import { LocalMediaFile } from "./types";

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
  const found = fields.find((field) => {
    const target = normalizeText(`${field.fieldKey} ${field.label}`);
    return normalizedKeywords.some((keyword) => target.includes(keyword));
  });
  if (!found) return "-";
  return toDisplayText(formData[found.fieldKey]);
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
