import jsPDF from "jspdf";
import { getImageFormat } from "./helpers";
import { MARGIN } from "./sharedLayout";
import sabespLogoUrl from "@/assets/logos/sabesp.svg";
import sanorteLogoUrl from "@/assets/logos/sanorte-infraestrutura.svg";

interface ReportLogos {
  sanorte: string | null;
  sabesp: string | null;
}

let logosPromise: Promise<ReportLogos> | null = null;

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

async function getReportLogos(): Promise<ReportLogos> {
  if (!logosPromise) {
    logosPromise = Promise.all([
      loadAssetAsPngDataUrl(sanorteLogoUrl),
      loadAssetAsPngDataUrl(sabespLogoUrl),
    ]).then(([sanorte, sabesp]) => ({ sanorte, sabesp }));
  }
  return await logosPromise;
}

function drawLogoInsideBox(
  doc: jsPDF,
  logoDataUrl: string | null,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (!logoDataUrl) return;
  const format = getImageFormat(logoDataUrl);
  if (!format) return;
  const pad = 0.8;
  const drawW = width - pad * 2;
  const drawH = height - pad * 2;
  doc.addImage(logoDataUrl, format, x + pad, y + pad, drawW, drawH);
}

export async function drawStandardPhotoReportHeader(
  doc: jsPDF,
  dataEmissao: string,
  reportTitle = "RELATÓRIO FOTOGRÁFICO"
): Promise<number> {
  const logos = await getReportLogos();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const x0 = MARGIN;
  let y = MARGIN;
  const h1 = 14;
  const h2 = 7;

  const sabespW = contentWidth * 0.10;
  const sanorteW = contentWidth * 0.21;
  const infoW = contentWidth * 0.18;
  const titleW = contentWidth - sabespW - sanorteW - infoW;

  doc.rect(x0, y, sabespW, h1);
  doc.rect(x0 + sabespW, y, titleW, h1);
  doc.rect(x0 + sabespW + titleW, y, sanorteW, h1);
  doc.rect(x0 + sabespW + titleW + sanorteW, y, infoW, h1);
  doc.line(
    x0 + sabespW + titleW + sanorteW,
    y + h1 / 3,
    x0 + sabespW + titleW + sanorteW + infoW,
    y + h1 / 3
  );
  doc.line(
    x0 + sabespW + titleW + sanorteW,
    y + (h1 / 3) * 2,
    x0 + sabespW + titleW + sanorteW + infoW,
    y + (h1 / 3) * 2
  );
  drawLogoInsideBox(doc, logos.sabesp, x0 + 0.2, y + 0.2, sabespW - 0.4, h1 - 0.4);
  drawLogoInsideBox(doc, logos.sanorte, x0 + sabespW + titleW + 0.5, y + 0.5, sanorteW - 1, h1 - 1);

  doc.setFont("helvetica", "bold");
  const fontCandidates = [12, 11, 10, 9.5, 9, 8.6];
  let chosenFontSize = 8.6;
  let compactTitle = doc.splitTextToSize(reportTitle, titleW - 4).slice(0, 2);
  for (const candidate of fontCandidates) {
    doc.setFontSize(candidate);
    const candidateLines = doc.splitTextToSize(reportTitle, titleW - 4);
    if (candidateLines.length <= 2) {
      chosenFontSize = candidate;
      compactTitle = candidateLines;
      break;
    }
  }
  doc.setFontSize(chosenFontSize);
  doc.setTextColor(0, 0, 255);
  const lineHeight = Math.max(3.6, chosenFontSize * 0.42);
  const textBlockHeight = compactTitle.length * lineHeight;
  const titleStartY = y + (h1 - textBlockHeight) / 2 + lineHeight * 0.72;
  doc.text(compactTitle, x0 + sabespW + titleW / 2, titleStartY, { align: "center", lineHeightFactor: 1 });
  doc.setTextColor(0, 0, 0);

  const infoX = x0 + sabespW + titleW + sanorteW;
  doc.setFontSize(6.6);
  doc.text("FOLHA N°", infoX + 1, y + 2.9);
  doc.text("DATA DE EMISSÃO", infoX + 1, y + 7.5);

  const badgeY = y + (h1 / 3) * 2 + 0.3;
  const badgeH = h1 / 3 - 0.8;
  doc.setFillColor(255, 255, 255);
  doc.rect(infoX + 0.8, badgeY, infoW - 1.6, badgeH, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${dataEmissao}`, infoX + infoW / 2, badgeY + 2.7, { align: "center" });

  doc.setLineWidth(0.9);
  doc.line(x0, y + h1 + 0.8, x0 + contentWidth, y + h1 + 0.8);
  doc.setLineWidth(0.2);

  y += h1 + 1;
  doc.rect(x0, y, contentWidth, h2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("OBJETO CONTRATUAL", x0 + 1.2, y + 4.8);

  y += h2;
  const objectH = 16;
  doc.rect(x0, y, contentWidth, objectH);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.text(
    doc.splitTextToSize(
      "CONTRATACAO SEMI-INTEGRADA PARA ELABORACAO DO PROJETO EXECUTIVO E EXECUCAO DAS OBRAS DO SISTEMA DE ESGOTAMENTO SANITARIO NOS BAIRROS CORUMBA, BELAS ARTES E CIBRATEL II DO MUNICIPIO DE ITANHAEM - MARGEM DIREITA - LOTE 10, NO AMBITO DO PROGRAMA ONDA LIMPA II.",
      contentWidth - 2.5
    ),
    x0 + 1.2,
    y + 3.8
  );

  y += objectH;
  doc.rect(x0, y, contentWidth, h2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("CONTRATADA", x0 + 1.2, y + 4.8);

  y += h2;
  const contractorH = 8;
  doc.rect(x0, y, contentWidth, contractorH);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text("CONSORCIO ESG IT. M. DIREITA", x0 + 1.2, y + 5.3);

  return y + contractorH;
}

export async function drawPhotoReportTitleWithLogos(
  doc: jsPDF,
  title: string,
  startY = MARGIN,
  rowHeight = 10
): Promise<number> {
  const logos = await getReportLogos();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const x0 = MARGIN;
  const y = startY;

  const leftW = 24;
  const rightW = 32;
  const centerW = contentWidth - leftW - rightW;

  doc.rect(x0, y, leftW, rowHeight);
  doc.rect(x0 + leftW, y, centerW, rowHeight);
  doc.rect(x0 + leftW + centerW, y, rightW, rowHeight);

  drawLogoInsideBox(doc, logos.sabesp, x0 + 0.4, y + 0.4, leftW - 0.8, rowHeight - 0.8);
  drawLogoInsideBox(doc, logos.sanorte, x0 + leftW + centerW + 0.4, y + 0.4, rightW - 0.8, rowHeight - 0.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, x0 + leftW + centerW / 2, y + rowHeight / 2 + 1.6, { align: "center" });
  return y + rowHeight;
}
