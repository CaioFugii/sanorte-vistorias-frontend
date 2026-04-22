import jsPDF from "jspdf";
import { ReportFileReference, ReportRecord, ReportTypeField } from "@/domain";

type PrimitiveValue = string | number | boolean | null | undefined;

const HEADER_BLUE = [8, 26, 102] as const;
const DEFAULT_TITLE = "Relatorio";

function toDisplayText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "-";
  if (typeof value === "string") return value.trim() ? value : "-";
  return "-";
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function isReportFileReference(value: unknown): value is ReportFileReference {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReportFileReference>;
  return typeof candidate.id === "string" && typeof candidate.url === "string";
}

function getImageFormat(dataUrl: string): "PNG" | "JPEG" | null {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function drawHeader(doc: jsPDF, title: string): number {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...HEADER_BLUE);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title.toUpperCase(), pageWidth / 2, margin + 11, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return margin + 24;
}

function drawSectionTitle(doc: jsPDF, label: string, y: number): number {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(236, 241, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, margin + 2, y + 5.5);
  return y + 10;
}

function ensurePageSpace(doc: jsPDF, y: number, needed = 10): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 12) return y;
  doc.addPage();
  return 12;
}

export async function generateReportPdf(input: {
  record: ReportRecord;
  fields: ReportTypeField[];
}): Promise<void> {
  const { record, fields } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  let cursorY = drawHeader(doc, record.reportType.name || DEFAULT_TITLE);
  cursorY = drawSectionTitle(doc, "Dados do formulario", cursorY);

  for (const field of orderedFields) {
    if (field.type === "image" || field.type === "signature") continue;
    const rawValue = record.formData[field.fieldKey] as PrimitiveValue;
    const value = toDisplayText(rawValue);
    cursorY = ensurePageSpace(doc, cursorY, 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${field.label}:`, margin, cursorY);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, pageWidth - margin * 2 - 35);
    doc.text(lines, margin + 35, cursorY);
    cursorY += Math.max(7, lines.length * 4.8);
  }

  const mediaFields = orderedFields.filter((field) => field.type === "image" || field.type === "signature");
  if (mediaFields.length > 0) {
    cursorY += 4;
    cursorY = ensurePageSpace(doc, cursorY, 14);
    cursorY = drawSectionTitle(doc, "Midias", cursorY);
  }

  for (const field of mediaFields) {
    cursorY = ensurePageSpace(doc, cursorY, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(field.label, margin, cursorY);
    cursorY += 2;

    const value = record.formData[field.fieldKey];
    const files = asArray(value).filter(isReportFileReference);
    if (files.length === 0) {
      cursorY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Sem arquivo anexado.", margin, cursorY);
      cursorY += 6;
      continue;
    }

    const imageWidth = (pageWidth - margin * 2 - 6) / 2;
    const imageHeight = 52;

    for (let i = 0; i < files.length; i += 1) {
      const column = i % 2;
      if (column === 0) {
        cursorY = ensurePageSpace(doc, cursorY, imageHeight + 16);
      }
      const x = margin + column * (imageWidth + 6);
      const y = cursorY;
      const dataUrl = await loadImageAsDataUrl(files[i].url);
      const format = dataUrl ? getImageFormat(dataUrl) : null;

      doc.rect(x, y, imageWidth, imageHeight);
      if (dataUrl && format) {
        doc.addImage(dataUrl, format, x, y, imageWidth, imageHeight);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Imagem indisponivel", x + 3, y + imageHeight / 2);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(files[i].originalName || `Arquivo ${i + 1}`, x, y + imageHeight + 4, {
        maxWidth: imageWidth,
      });

      if (column === 1 || i === files.length - 1) {
        cursorY += imageHeight + 12;
      }
    }
  }

  const safeCode = (record.reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}_${record.id}.pdf`);
}
