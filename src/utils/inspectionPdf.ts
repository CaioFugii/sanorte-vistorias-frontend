import jsPDF from "jspdf";
import { Inspection, ModuleType } from "@/domain";

const SANORTE_LOGO_URL = "/assets/sanorte-logo.svg";
const HEADER_BLUE = [8, 26, 102] as const;

const moduleLabel: Record<ModuleType, string> = {
  [ModuleType.CAMPO]: "CAMPO",
  [ModuleType.SEGURANCA_TRABALHO]: "SEGURANCA DO TRABALHO",
  [ModuleType.REMOTO]: "REMOTO",
  [ModuleType.POS_OBRA]: "POS OBRA",
};

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
  doc.text(title, pageWidth / 2, y + 5.5, { align: "center" });
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

function drawInfoTable(doc: jsPDF, inspection: Inspection, y: number, margin: number, pageWidth: number): number {
  const width = pageWidth - margin * 2;
  const leftLabelW = 26;
  const defaultLeftValueW = 72;
  const rightLabelW = 27;
  const defaultRightValueW = width - leftLabelW - defaultLeftValueW - rightLabelW;
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
      leftLabel: "Criada em:",
      leftValue: formatDate(inspection.createdAt),
      rightLabel: "Percentual:",
      rightValue: `${inspection.scorePercent ?? 0}%`,
    },
  ];

  let cursorY = y;
  rows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.setTextColor(190, 40, 40);

    if (row.fullWidthValue) {
      const fullValueW = width - leftLabelW;
      const textValue = truncateWithEllipsis(doc, row.leftValue, fullValueW - 3);

      doc.rect(margin, cursorY, leftLabelW, rowH);
      doc.rect(margin + leftLabelW, cursorY, fullValueW, rowH);

      doc.setTextColor(0, 0, 0);
      doc.text(row.leftLabel, margin + 2, cursorY + 6);
      doc.setTextColor(190, 40, 40);
      doc.text(textValue, margin + leftLabelW + 2, cursorY + 6, {
        maxWidth: fullValueW - 3,
      });
      doc.setTextColor(0, 0, 0);
      cursorY += rowH;
      return;
    }

    const leftValueW = defaultLeftValueW;
    const rightValueW = defaultRightValueW;

    doc.rect(margin, cursorY, leftLabelW, rowH);
    doc.rect(margin + leftLabelW, cursorY, leftValueW, rowH);
    doc.rect(margin + leftLabelW + leftValueW, cursorY, rightLabelW, rowH);
    doc.rect(margin + leftLabelW + leftValueW + rightLabelW, cursorY, rightValueW, rowH);

    doc.setTextColor(0, 0, 0);
    doc.text(row.leftLabel, margin + 2, cursorY + 6);
    doc.text(row.rightLabel, margin + leftLabelW + leftValueW + 2, cursorY + 6);

    doc.setTextColor(190, 40, 40);
    doc.text(truncateWithEllipsis(doc, row.leftValue, leftValueW - 3), margin + leftLabelW + 2, cursorY + 6, {
      maxWidth: leftValueW - 3,
    });
    doc.text(
      truncateWithEllipsis(doc, row.rightValue, rightValueW - 3),
      margin + leftLabelW + leftValueW + rightLabelW + 2,
      cursorY + 6,
      {
        maxWidth: rightValueW - 3,
      }
    );
    doc.setTextColor(0, 0, 0);

    cursorY += rowH;
  });

  return cursorY;
}

function drawHeader(doc: jsPDF, inspection: Inspection, logoDataUrl: string | null): number {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 34;
  const logoAreaW = 54;
  const logoInset = 1.2;

  // Header inteiro azul (mesmo padrao visual das faixas de secao).
  doc.setFillColor(...HEADER_BLUE);
  doc.rect(margin, margin, pageWidth - margin * 2, headerHeight, "F");
  doc.setDrawColor(...HEADER_BLUE);
  doc.rect(margin, margin, pageWidth - margin * 2, headerHeight);

  // Janela branca para acomodar o logo.
  doc.setFillColor(255, 255, 255);
  doc.rect(
    margin + logoInset,
    margin + logoInset,
    logoAreaW - logoInset * 2,
    headerHeight - logoInset * 2,
    "F"
  );

  if (logoDataUrl) {
    const logoFormat = getImageFormat(logoDataUrl);
    if (logoFormat) {
      doc.addImage(logoDataUrl, logoFormat, margin + 4, margin + 3, 44, 20);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...HEADER_BLUE);
    doc.text("Sanorte", margin + 7, margin + 15);
    doc.setTextColor(0, 0, 0);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RELATORIO DE VISTORIA", pageWidth / 2 + 26, margin + 11, { align: "center" });
  doc.setFontSize(12);
  doc.text((inspection.checklist?.name || "QUALIDADE").toUpperCase(), pageWidth / 2 + 26, margin + 21, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  return margin + 37;
}

function extractEvidenceSources(inspection: Inspection): Array<{ src: string; label: string }> {
  const creation = (inspection.evidences ?? [])
    .map((evidence, index) => ({
      src: evidence.url ?? evidence.dataUrl ?? "",
      label: evidence.fileName || `Foto ${index + 1}`,
    }))
    .filter((entry) => !!entry.src);

  const resolution = (inspection.items ?? [])
    .filter((item) => !!item.resolutionEvidencePath)
    .map((item, index) => ({
      src: item.resolutionEvidencePath ?? "",
      label: `Resolucao ${index + 1}`,
    }))
    .filter((entry) => !!entry.src);

  return [...creation, ...resolution];
}

export async function generateInspectionPdf(inspection: Inspection): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const logoDataUrl = await loadImageAsDataUrl(SANORTE_LOGO_URL);
  let cursorY = drawHeader(doc, inspection, logoDataUrl);
  cursorY = drawSectionHeader(doc, "INFORMACOES GERAIS", cursorY, margin, pageWidth);
  cursorY = drawInfoTable(doc, inspection, cursorY, margin, pageWidth);
  cursorY += 10;

  cursorY = drawSectionHeader(doc, "RELATORIO FOTOGRAFICO", cursorY, margin, pageWidth);
  cursorY += 6;

  const evidences = extractEvidenceSources(inspection);
  const photoWidth = (pageWidth - margin * 2 - 6) / 2;
  const photoHeight = 62;

  if (evidences.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Sem fotos anexadas.", margin, cursorY + 6);
  } else {
    for (let index = 0; index < evidences.length; index += 1) {
      const column = index % 2;
      if (column === 0 && index > 0) {
        cursorY += photoHeight + 14;
      }
      if (cursorY + photoHeight + 12 > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }

      const x = margin + column * (photoWidth + 6);
      const entry = evidences[index];
      const dataUrl = await loadImageAsDataUrl(entry.src);
      const imageFormat = dataUrl ? getImageFormat(dataUrl) : null;

      doc.setDrawColor(160, 160, 160);
      doc.rect(x, cursorY, photoWidth, photoHeight);
      if (dataUrl && imageFormat) {
        doc.addImage(dataUrl, imageFormat, x, cursorY, photoWidth, photoHeight);
      } else {
        doc.setFontSize(9);
        doc.text("Imagem indisponivel", x + 5, cursorY + photoHeight / 2);
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(entry.label, x, cursorY + photoHeight + 4, { maxWidth: photoWidth });
    }
  }

  doc.save(buildPdfFileName(inspection));
}
