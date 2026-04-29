import jsPDF from "jspdf";
import { ReportTypeField } from "@/domain";
import { asArray, getImageFormat, isLocalMediaFile, loadImageAsDataUrl } from "./helpers";

export const HEADER_BLUE = [8, 26, 102] as const;
export const DEFAULT_TITLE = "Relatorio";
export const MARGIN = 12;

export function drawHeader(doc: jsPDF, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...HEADER_BLUE);
  doc.rect(MARGIN, MARGIN, pageWidth - MARGIN * 2, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title.toUpperCase(), pageWidth / 2, MARGIN + 11, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return MARGIN + 24;
}

export function drawSectionTitle(doc: jsPDF, label: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(236, 241, 255);
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(label, MARGIN + 2, y + 5.5);
  return y + 10;
}

export function ensurePageSpace(doc: jsPDF, y: number, needed = 10): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - MARGIN) return y;
  doc.addPage();
  return MARGIN;
}

export function ensurePageSpaceWithHeader(
  doc: jsPDF,
  y: number,
  needed: number,
  onPageAdded: () => number
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - MARGIN) return y;
  doc.addPage();
  return onPageAdded();
}

export function drawKeyValueRows(
  doc: jsPDF,
  rows: Array<{ label: string; value: string }>,
  startY: number,
  onPageAdded?: () => number
): number {
  let cursorY = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  for (const row of rows) {
    cursorY = onPageAdded
      ? ensurePageSpaceWithHeader(doc, cursorY, 12, onPageAdded)
      : ensurePageSpace(doc, cursorY, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${row.label}:`, MARGIN, cursorY);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(row.value, pageWidth - MARGIN * 2 - 35);
    doc.text(lines, MARGIN + 35, cursorY);
    cursorY += Math.max(7, lines.length * 4.8);
  }
  return cursorY;
}

export async function drawMediaSection(
  doc: jsPDF,
  fields: ReportTypeField[],
  formData: Record<string, unknown>,
  startY: number,
  onPageAdded?: () => number
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = startY;
  for (const field of fields) {
    cursorY = onPageAdded
      ? ensurePageSpaceWithHeader(doc, cursorY, 10, onPageAdded)
      : ensurePageSpace(doc, cursorY, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(field.label, MARGIN, cursorY);
    cursorY += 2;

    const value = formData[field.fieldKey];
    const files = asArray(value).filter(isLocalMediaFile);
    if (files.length === 0) {
      cursorY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Sem arquivo anexado.", MARGIN, cursorY);
      cursorY += 6;
      continue;
    }

    const imageWidth = (pageWidth - MARGIN * 2 - 6) / 2;
    const imageHeight = 52;
    for (let i = 0; i < files.length; i += 1) {
      const column = i % 2;
      if (column === 0) {
        cursorY = onPageAdded
          ? ensurePageSpaceWithHeader(doc, cursorY, imageHeight + 16, onPageAdded)
          : ensurePageSpace(doc, cursorY, imageHeight + 16);
      }
      const x = MARGIN + column * (imageWidth + 6);
      const y = cursorY;
      const dataUrl = await loadImageAsDataUrl(files[i].dataUrl);
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
      doc.text(files[i].name || `Arquivo ${i + 1}`, x, y + imageHeight + 4, {
        maxWidth: imageWidth,
      });

      if (column === 1 || i === files.length - 1) {
        cursorY += imageHeight + 12;
      }
    }
  }
  return cursorY;
}
