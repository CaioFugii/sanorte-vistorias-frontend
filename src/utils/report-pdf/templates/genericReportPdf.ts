import jsPDF from "jspdf";
import { ReportPdfInput } from "../types";
import { toDisplayText } from "../helpers";
import {
  DEFAULT_TITLE,
  drawHeader,
  drawKeyValueRows,
  drawMediaSection,
  drawSectionTitle,
  ensurePageSpaceWithHeader,
} from "../sharedLayout";

export async function generateGenericReportPdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const headerTitle = reportType.name || DEFAULT_TITLE;
  const redrawHeader = () => drawHeader(doc, headerTitle);

  let cursorY = redrawHeader();
  cursorY = drawSectionTitle(doc, "Dados do formulario", cursorY);

  const nonMediaRows = orderedFields
    .filter((field) => field.type !== "image" && field.type !== "signature")
    .map((field) => ({
      label: field.label,
      value: toDisplayText(formData[field.fieldKey]),
    }));
  cursorY = drawKeyValueRows(doc, nonMediaRows, cursorY, redrawHeader);

  const mediaFields = orderedFields.filter((field) => field.type === "image" || field.type === "signature");
  if (mediaFields.length > 0) {
    cursorY += 4;
    cursorY = ensurePageSpaceWithHeader(doc, cursorY, 14, redrawHeader);
    cursorY = drawSectionTitle(doc, "Midias", cursorY);
    await drawMediaSection(doc, mediaFields, formData, cursorY, redrawHeader);
  }

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}
