import jsPDF from "jspdf";
import { Inspection, InspectionItem, ModuleType } from "@/domain";
import sanorteLogoUrl from "@/assets/logos/sanorte-infraestrutura.svg";

const HEADER_BLUE = [8, 26, 102] as const;
const SANORTE_LOGO_ASPECT_RATIO = 586 / 163;
const REPORT_PHOTO_WIDTH_SCALE = 0.65;

const moduleLabel: Record<ModuleType, string> = {
  [ModuleType.OBRAS_INVESTIMENTO]: "OBRAS DE INVESTIMENTO",
  [ModuleType.CAMPO]: "CAMPO",
  [ModuleType.SEGURANCA_TRABALHO]: "SEGURANCA DO TRABALHO",
  [ModuleType.REMOTO]: "REMOTO",
  [ModuleType.POS_OBRA]: "POS OBRA",
};

function pdfText(value: string): string {
  return value.toLocaleUpperCase("pt-BR");
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatStatus(value: string): string {
  if (value === "PENDENTE_AJUSTE") return "PENDENTE DE AJUSTE";
  return value.replace(/_/g, " ");
}

function buildPdfFileName(inspection: Inspection): string {
  const osNumber = inspection.serviceOrder?.osNumber?.trim();
  const safeOsNumber = (osNumber || "sem_os").replace(/[\\/:*?"<>|]/g, "-");
  return `relatorio_vistoria_${safeOsNumber}.pdf`;
}

function toDataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageToPngDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width || 1;
      const height = img.naturalHeight || img.height || 1;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function encodeUtf8ToBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

async function svgBlobToPngDataUrl(blob: Blob): Promise<string | null> {
  try {
    const svg = await blob.text();
    const svgDataUrl = `data:image/svg+xml;base64,${encodeUtf8ToBase64(svg)}`;
    return await imageToPngDataUrl(svgDataUrl);
  } catch {
    return null;
  }
}

async function loadAssetAsPngDataUrl(assetUrl: string): Promise<string | null> {
  try {
    const response = await fetch(assetUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width || 1;
      canvas.height = image.naturalHeight || image.height || 1;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

let sanorteLogoPromise: Promise<string | null> | null = null;

async function loadSanorteLogoAsPngDataUrl(): Promise<string | null> {
  if (!sanorteLogoPromise) {
    sanorteLogoPromise = loadAssetAsPngDataUrl(sanorteLogoUrl);
  }
  return sanorteLogoPromise;
}

async function loadImageAsDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image/svg")) return imageToPngDataUrl(url);
  if (url.startsWith("data:image/")) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.type.includes("svg")) return await svgBlobToPngDataUrl(blob);
    return await toDataUrlFromBlob(blob);
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl: string): "PNG" | "JPEG" | null {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/webp")) return null;
  if (dataUrl.startsWith("data:image/svg")) return null;
  return "PNG";
}

function drawSectionHeader(doc: jsPDF, title: string, y: number, margin: number, pageWidth: number): number {
  const sectionHeight = 8;
  doc.setFillColor(...HEADER_BLUE);
  doc.rect(margin, y, pageWidth - margin * 2, sectionHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(pdfText(title), pageWidth / 2, y + 5.5, { align: "center" });
  doc.setTextColor(0, 0, 0);
  return y + sectionHeight;
}

function truncateWithEllipsis(doc: jsPDF, value: string, maxWidth: number): string {
  if (doc.getTextWidth(value) <= maxWidth) return value;
  const ellipsis = "...";
  let low = 0;
  let high = value.length;
  let best = "";

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${value.slice(0, middle)}${ellipsis}`;
    if (doc.getTextWidth(candidate) <= maxWidth) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best || ellipsis;
}

function measureTextCellWidth(doc: jsPDF, text: string, padding: number): number {
  return doc.getTextWidth(pdfText(text)) + padding * 2;
}

function computeInfoTableLayout(
  doc: jsPDF,
  rows: Array<{ leftLabel: string; rightLabel: string; fullWidthValue?: boolean }>,
  tableWidth: number,
  cellPadding: number,
): { leftLabelW: number; leftValueW: number; rightLabelW: number; rightValueW: number } {
  const splitRows = rows.filter((row) => !row.fullWidthValue);

  const leftLabelW = Math.min(
    Math.max(...rows.map((row) => measureTextCellWidth(doc, row.leftLabel, cellPadding)), cellPadding * 2),
    tableWidth * 0.42,
  );
  const rightLabelW = Math.min(
    Math.max(
      ...splitRows.map((row) => measureTextCellWidth(doc, row.rightLabel, cellPadding)),
      cellPadding * 2,
    ),
    tableWidth * 0.24,
  );

  const valuesWidth = tableWidth - leftLabelW - rightLabelW;
  const leftValueW = valuesWidth * 0.42;
  const rightValueW = valuesWidth - leftValueW;

  return { leftLabelW, leftValueW, rightLabelW, rightValueW };
}

function drawInfoTable(doc: jsPDF, inspection: Inspection, y: number, margin: number, pageWidth: number): number {
  const width = pageWidth - margin * 2;
  const cellPadding = 2;
  const rowH = 9;

  const rows: Array<{
    leftLabel: string;
    leftValue: string;
    rightLabel: string;
    rightValue: string;
    fullWidthValue?: boolean;
  }> = [
    {
      leftLabel: "Numero OS:",
      leftValue: inspection.serviceOrder?.osNumber ?? "-",
      rightLabel: "Servico:",
      rightValue: inspection.serviceDescription || "-",
    },
    {
      leftLabel: "Localizacao:",
      leftValue: inspection.locationDescription || "-",
      rightLabel: "",
      rightValue: "",
      fullWidthValue: true,
    },
    {
      leftLabel: "Modulo:",
      leftValue: moduleLabel[inspection.module] ?? inspection.module,
      rightLabel: "Status:",
      rightValue: formatStatus(inspection.status),
    },
    {
      leftLabel: "Equipe PDA:",
      leftValue:
        inspection.team?.name || "-",
      rightLabel: "Penalidade:",
      rightValue: inspection.hasParalysisPenalty ? "APLICADA PENALIDADE (25%)" : "NAO APLICADA",
    },
    {
      leftLabel: "Checklist:",
      leftValue: inspection.checklist?.name || "-",
      rightLabel: "Data Vistoria:",
      rightValue: formatDate(inspection.finalizedAt ?? inspection.updatedAt),
    },
    {
      leftLabel: "Data de execução do serviço:",
      leftValue: formatDate(inspection.createdAt),
      rightLabel: "Percentual:",
      rightValue: `${inspection.scorePercent ?? 0}%`,
    },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const { leftLabelW, leftValueW, rightLabelW, rightValueW } = computeInfoTableLayout(doc, rows, width, cellPadding);

  let cursorY = y;
  rows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    if (row.fullWidthValue) {
      const fullValueW = width - leftLabelW;
      const labelMaxW = leftLabelW - cellPadding * 2;
      const valueMaxW = fullValueW - cellPadding * 2;
      const labelText = truncateWithEllipsis(doc, pdfText(row.leftLabel), labelMaxW);
      const textValue = truncateWithEllipsis(doc, pdfText(row.leftValue), valueMaxW);

      doc.rect(margin, cursorY, leftLabelW, rowH);
      doc.rect(margin + leftLabelW, cursorY, fullValueW, rowH);

      doc.text(labelText, margin + cellPadding, cursorY + 6, { maxWidth: labelMaxW });
      doc.text(textValue, margin + leftLabelW + cellPadding, cursorY + 6, { maxWidth: valueMaxW });
      cursorY += rowH;
      return;
    }

    const leftLabelMaxW = leftLabelW - cellPadding * 2;
    const leftValueMaxW = leftValueW - cellPadding * 2;
    const rightLabelMaxW = rightLabelW - cellPadding * 2;
    const rightValueMaxW = rightValueW - cellPadding * 2;

    doc.rect(margin, cursorY, leftLabelW, rowH);
    doc.rect(margin + leftLabelW, cursorY, leftValueW, rowH);
    doc.rect(margin + leftLabelW + leftValueW, cursorY, rightLabelW, rowH);
    doc.rect(margin + leftLabelW + leftValueW + rightLabelW, cursorY, rightValueW, rowH);

    doc.text(truncateWithEllipsis(doc, pdfText(row.leftLabel), leftLabelMaxW), margin + cellPadding, cursorY + 6, {
      maxWidth: leftLabelMaxW,
    });
    doc.text(
      truncateWithEllipsis(doc, pdfText(row.rightLabel), rightLabelMaxW),
      margin + leftLabelW + leftValueW + cellPadding,
      cursorY + 6,
      { maxWidth: rightLabelMaxW },
    );
    doc.text(
      truncateWithEllipsis(doc, pdfText(row.leftValue), leftValueMaxW),
      margin + leftLabelW + cellPadding,
      cursorY + 6,
      { maxWidth: leftValueMaxW },
    );
    doc.text(
      truncateWithEllipsis(doc, pdfText(row.rightValue), rightValueMaxW),
      margin + leftLabelW + leftValueW + rightLabelW + cellPadding,
      cursorY + 6,
      { maxWidth: rightValueMaxW },
    );

    cursorY += rowH;
  });

  return cursorY;
}

function drawSanorteLogo(
  doc: jsPDF,
  logoDataUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): void {
  const format = getImageFormat(logoDataUrl);
  if (!format) return;

  let drawW = maxWidth;
  let drawH = drawW / SANORTE_LOGO_ASPECT_RATIO;
  if (drawH > maxHeight) {
    drawH = maxHeight;
    drawW = drawH * SANORTE_LOGO_ASPECT_RATIO;
  }

  doc.addImage(logoDataUrl, format, x, y + (maxHeight - drawH) / 2, drawW, drawH);
}

function drawHeader(doc: jsPDF, inspection: Inspection, logoDataUrl: string | null): number {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 34;
  const logoAreaW = 58;
  const logoPadX = 3;
  const logoPadY = 4;

  doc.setFillColor(...HEADER_BLUE);
  doc.rect(margin, margin, pageWidth - margin * 2, headerHeight, "F");
  doc.setDrawColor(...HEADER_BLUE);
  doc.rect(margin, margin, pageWidth - margin * 2, headerHeight);

  if (logoDataUrl) {
    drawSanorteLogo(
      doc,
      logoDataUrl,
      margin + logoPadX,
      margin + logoPadY,
      logoAreaW - logoPadX * 2,
      headerHeight - logoPadY * 2,
    );
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfText("Sanorte"), margin + 7, margin + 15);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pdfText("Relatorio de Vistoria"), pageWidth / 2 + 26, margin + 11, { align: "center" });
  doc.setFontSize(12);
  doc.text(pdfText(inspection.checklist?.name || "Qualidade"), pageWidth / 2 + 26, margin + 21, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  return margin + 37;
}

type PdfPhotoEntry = { src: string; label: string };

type PdfPhotoSection = {
  heading: string;
  groups: Array<{ caption?: string; entries: PdfPhotoEntry[] }>;
};

function getChecklistItemTitle(item: InspectionItem): string {
  return item.checklistItem?.title ?? item.checklistItemId ?? "Item";
}

function getChecklistItemDescription(item: InspectionItem): string | null {
  return item.checklistItem?.description?.trim() || null;
}

function getChecklistItemNotes(item: InspectionItem): string | null {
  return item.notes?.trim() || null;
}

function toPhotoEntry(src: string | undefined | null, label: string): PdfPhotoEntry | null {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return null;
  return { src: trimmed, label };
}

function extractEvidenceSections(inspection: Inspection): PdfPhotoSection[] {
  const evidences = inspection.evidences ?? [];
  const items = inspection.items ?? [];
  const sections: PdfPhotoSection[] = [];

  const generalEntries = evidences
    .filter((evidence) => !evidence.inspectionItemId)
    .map((evidence, index) =>
      toPhotoEntry(evidence.url ?? evidence.dataUrl, evidence.fileName || `Foto ${index + 1}`),
    )
    .filter((entry): entry is PdfPhotoEntry => entry !== null);
  if (generalEntries.length > 0) {
    sections.push({ heading: "Fotos gerais", groups: [{ entries: generalEntries }] });
  }

  const itemEvidences = evidences.filter((evidence) => evidence.inspectionItemId);
  const itemIds = new Set(items.map((item) => item.id));
  const checklistGroups = items
    .map((item) => ({
      caption: getChecklistItemTitle(item),
      entries: itemEvidences
        .filter((evidence) => evidence.inspectionItemId === item.id)
        .map((evidence, index) =>
          toPhotoEntry(evidence.url ?? evidence.dataUrl, evidence.fileName || `Foto ${index + 1}`),
        )
        .filter((entry): entry is PdfPhotoEntry => entry !== null),
    }))
    .filter((group) => group.entries.length > 0);
  const orphanEntries = itemEvidences
    .filter((evidence) => evidence.inspectionItemId && !itemIds.has(evidence.inspectionItemId))
    .map((evidence, index) =>
      toPhotoEntry(evidence.url ?? evidence.dataUrl, evidence.fileName || `Foto ${index + 1}`),
    )
    .filter((entry): entry is PdfPhotoEntry => entry !== null);
  if (orphanEntries.length > 0) {
    checklistGroups.push({ caption: "Item do checklist", entries: orphanEntries });
  }
  if (checklistGroups.length > 0) {
    sections.push({ heading: "Fotos do checklist", groups: checklistGroups });
  }

  const resolutionEntries = items
    .map((item) =>
      toPhotoEntry(item.resolutionEvidencePath, `Resolucao: ${getChecklistItemTitle(item)}`),
    )
    .filter((entry): entry is PdfPhotoEntry => entry !== null);
  if (resolutionEntries.length > 0) {
    sections.push({ heading: "Resolucao de pendencias", groups: [{ entries: resolutionEntries }] });
  }

  return sections;
}

export async function generateInspectionPdf(inspection: Inspection): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const logoDataUrl = await loadSanorteLogoAsPngDataUrl();
  type PdfFlow = "observations" | "photos";
  let currentFlow: PdfFlow = "photos";

  const startContinuationPage = (flow: PdfFlow): number => {
    doc.addPage();
    let y = drawHeader(doc, inspection, logoDataUrl);
    y = drawSectionHeader(
      doc,
      flow === "observations" ? "OBSERVACOES DO FISCAL" : "RELATORIO FOTOGRAFICO",
      y,
      margin,
      pageWidth,
    );
    return y + (flow === "observations" ? 4 : 6);
  };

  let cursorY = drawHeader(doc, inspection, logoDataUrl);
  cursorY = drawSectionHeader(doc, "INFORMACOES GERAIS", cursorY, margin, pageWidth);
  cursorY = drawInfoTable(doc, inspection, cursorY, margin, pageWidth);
  cursorY += 10;

  const observationItems = (inspection.items ?? []).filter((item) => getChecklistItemNotes(item));
  const sections = extractEvidenceSections(inspection);
  const photoColumnWidth = (pageWidth - margin * 2 - 6) / 2;
  const photoWidth = photoColumnWidth * REPORT_PHOTO_WIDTH_SCALE;
  const photoHeight = 62;
  const rowAdvance = photoHeight + 14;

  const ensureSpace = (needed: number): boolean => {
    if (cursorY + needed > pageHeight - margin) {
      cursorY = startContinuationPage(currentFlow);
      return true;
    }
    return false;
  };

  if (observationItems.length > 0) {
    currentFlow = "observations";
    cursorY = drawSectionHeader(doc, "OBSERVACOES DO FISCAL", cursorY, margin, pageWidth);
    cursorY += 4;

    for (const item of observationItems) {
      const title = pdfText(getChecklistItemTitle(item));
      const description = getChecklistItemDescription(item);
      const notes = getChecklistItemNotes(item) ?? "";
      const titleX = margin + 5;
      const titleMaxW = contentWidth - 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const titleLines = doc.splitTextToSize(title, titleMaxW) as string[];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const descLines = description
        ? (doc.splitTextToSize(pdfText(description), titleMaxW) as string[])
        : [];
      doc.setFontSize(9);
      const notesLines = doc.splitTextToSize(pdfText(`Observacoes: ${notes}`), titleMaxW) as string[];
      const blockHeight = titleLines.length * 5 + descLines.length * 4 + notesLines.length * 4.5 + 6;
      ensureSpace(Math.min(blockHeight, 28));

      doc.setFillColor(0, 0, 0);
      doc.circle(margin + 1.5, cursorY + 2.2, 0.9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      for (const line of titleLines) {
        ensureSpace(6);
        doc.text(line, titleX, cursorY + 4);
        cursorY += 5;
      }

      if (descLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        for (const line of descLines) {
          ensureSpace(5);
          doc.text(line, titleX, cursorY + 3.5);
          cursorY += 4;
        }
        doc.setTextColor(0, 0, 0);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (const line of notesLines) {
        ensureSpace(6);
        doc.text(line, titleX, cursorY + 4);
        cursorY += 4.5;
      }
      cursorY += 3;
    }
    cursorY += 6;
  }

  currentFlow = "photos";
  if (cursorY + 20 > pageHeight - margin) {
    cursorY = startContinuationPage("photos");
  } else {
    cursorY = drawSectionHeader(doc, "RELATORIO FOTOGRAFICO", cursorY, margin, pageWidth) + 6;
  }

  const drawPhotoEntries = async (entries: PdfPhotoEntry[]): Promise<void> => {
    let column = 0;
    for (let index = 0; index < entries.length; index += 1) {
      if (column === 0 && index > 0) {
        cursorY += rowAdvance;
      }
      if (ensureSpace(photoHeight + 12)) {
        column = 0;
      }

      const x = margin + column * (photoColumnWidth + 6) + (photoColumnWidth - photoWidth) / 2;
      const entry = entries[index];
      const dataUrl = await loadImageAsDataUrl(entry.src);
      const imageFormat = dataUrl ? getImageFormat(dataUrl) : null;

      doc.setDrawColor(160, 160, 160);
      doc.rect(x, cursorY, photoWidth, photoHeight);
      if (dataUrl && imageFormat) {
        doc.addImage(dataUrl, imageFormat, x, cursorY, photoWidth, photoHeight);
      } else {
        doc.setFontSize(9);
        doc.text(pdfText("Imagem indisponivel"), x + 5, cursorY + photoHeight / 2);
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(pdfText(entry.label), x, cursorY + photoHeight + 4, { maxWidth: photoWidth });

      column = column === 0 ? 1 : 0;
    }
    if (entries.length > 0) {
      cursorY += rowAdvance;
    }
  };

  if (sections.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(pdfText("Sem fotos anexadas."), margin, cursorY + 6);
  } else {
    for (const section of sections) {
      ensureSpace(rowAdvance + 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...HEADER_BLUE);
      doc.text(pdfText(section.heading), margin, cursorY + 4);
      doc.setTextColor(0, 0, 0);
      cursorY += 8;

      for (const group of section.groups) {
        if (group.caption) {
          ensureSpace(rowAdvance + 8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(pdfText(group.caption), margin, cursorY + 3);
          cursorY += 6;
        }
        await drawPhotoEntries(group.entries);
      }
    }
  }

  doc.save(buildPdfFileName(inspection));
}
