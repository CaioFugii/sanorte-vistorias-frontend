import jsPDF from "jspdf";
import { findFieldValue, getImageFormat, loadImageAsDataUrl } from "../helpers";
import { ReportPdfInput } from "../types";
import { MARGIN } from "../sharedLayout";
import sabespLogoUrl from "@/assets/logos/sabesp.svg";
import sanorteLogoUrl from "@/assets/logos/sanorte-infraestrutura.svg";

const CONTRACT_OBJECT_TEXT =
  "CONTRATACAO SEMI-INTEGRADA PARA ELABORACAO DO PROJETO EXECUTIVO E EXECUCAO DAS OBRAS DO SISTEMA DE ESGOTAMENTO SANITARIO NOS BAIRROS CORUMBA, BELAS ARTES E CIBRATEL II DO MUNICIPIO DE ITANHAEM - MARGEM DIREITA - LOTE 10, NO AMBITO DO PROGRAMA ONDA LIMPA II.";

interface AceitePhoto {
  id: string;
  name: string;
  dataUrl: string;
}

function formatDatePtBr(value: string): string {
  const raw = value.trim();
  if (!raw || raw === "-") {
    return new Date().toLocaleDateString("pt-BR");
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("pt-BR");
  }
  return raw;
}

function formatDateDdMmYyyy(value: string): string {
  const raw = value.trim();
  if (!raw || raw === "-") return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
}

function toAceitePhoto(value: unknown): AceitePhoto | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.length > 0 ? toAceitePhoto(value[0]) : null;
  }
  if (typeof value !== "object") return null;
  const candidate = value as Partial<AceitePhoto>;
  if (typeof candidate.dataUrl !== "string") return null;
  return {
    id: typeof candidate.id === "string" ? candidate.id : crypto.randomUUID(),
    name: typeof candidate.name === "string" ? candidate.name : "foto",
    dataUrl: candidate.dataUrl,
  };
}

function resolveAceitePhotosFromFormData(formData: Record<string, unknown>): AceitePhoto[] {
  return [
    toAceitePhoto(formData.foto1Antes),
    toAceitePhoto(formData.foto2Antes),
    toAceitePhoto(formData.foto3Depois),
    toAceitePhoto(formData.foto4Depois),
  ].filter((photo): photo is AceitePhoto => Boolean(photo));
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

async function drawPageOneHeader(
  doc: jsPDF,
  dataEmissao: string,
  logos: { sanorte: string | null; sabesp: string | null }
): Promise<number> {
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
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 255);
  doc.text("RELATÓRIO FOTOGRÁFICO", x0 + sabespW + titleW / 2, y + 8.8, { align: "center" });
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
  doc.text(doc.splitTextToSize(CONTRACT_OBJECT_TEXT, contentWidth - 2.5), x0 + 1.2, y + 3.8);

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

function drawContractMetaGrid(doc: jsPDF, startY: number, medicao: string, inicioPeriodo: string, fimPeriodo: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const x0 = MARGIN;
  const y = startY;
  const rowH = 7;
  const row2H = 8.5;

  const wLegacy = contentWidth * 0.25;
  const wSap = contentWidth * 0.20;
  const wMed = contentWidth * 0.14;
  const wPeriodo = contentWidth - wLegacy - wSap - wMed;

  doc.rect(x0, y, wLegacy, rowH);
  doc.rect(x0 + wLegacy, y, wSap, rowH);
  doc.rect(x0 + wLegacy + wSap, y, wMed, rowH);
  doc.rect(x0 + wLegacy + wSap + wMed, y, wPeriodo, rowH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.text("CONTRATO LEGADO", x0 + 1, y + 4.7);
  doc.text("CONTRATO SAP", x0 + wLegacy + 1, y + 4.7);
  doc.text("MEDICAO N", x0 + wLegacy + wSap + 1, y + 4.7);
  doc.text("PERIODO DA MEDICAO", x0 + wLegacy + wSap + wMed + 1, y + 4.7);

  const c1 = wLegacy * 0.45;
  const c2 = wLegacy * 0.18;
  const c3 = wLegacy * 0.18;
  const c4 = wLegacy - c1 - c2 - c3;
  const py = y + rowH;
  doc.rect(x0, py, c1, row2H);
  doc.rect(x0 + c1, py, c2, row2H);
  doc.rect(x0 + c1 + c2, py, c3, row2H);
  doc.rect(x0 + c1 + c2 + c3, py, c4, row2H);
  doc.rect(x0 + wLegacy, py, wSap, row2H);
  doc.rect(x0 + wLegacy + wSap, py, wMed, row2H);
  doc.rect(x0 + wLegacy + wSap + wMed, py, wPeriodo, row2H);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.text("NUMERO", x0 + 1, py + 2.3);
  doc.text("ANO", x0 + c1 + 1, py + 2.3);
  doc.text("VENC", x0 + c1 + c2 + 1, py + 2.3);
  doc.text("OS", x0 + c1 + c2 + c3 + 1, py + 2.3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("00.756", x0 + 1, py + 7);
  doc.text("24", x0 + c1 + 1, py + 7);
  doc.text("00", x0 + c1 + c2 + 1, py + 7);
  doc.text("00", x0 + c1 + c2 + c3 + 1, py + 7);
  doc.setFontSize(7.2);
  doc.text("4600058940", x0 + wLegacy + 1, py + 5.2);
  doc.text(medicao || "-", x0 + wLegacy + wSap + 1, py + 5.2);
  const inicioPeriodoFmt = formatDateDdMmYyyy(inicioPeriodo);
  const fimPeriodoFmt = formatDateDdMmYyyy(fimPeriodo);
  doc.text(`${inicioPeriodoFmt} A ${fimPeriodoFmt}`, x0 + wLegacy + wSap + wMed + 1, py + 5.2);

  return py + row2H;
}

function drawTitleAndStretch(
  doc: jsPDF,
  startY: number,
  bacia: string,
  logradouro: string,
  montante: string,
  jusante: string,
  titleText: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = startY + 1.5;
  doc.rect(MARGIN, y, contentWidth, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.text(titleText, MARGIN + contentWidth / 2, y + 5.4, { align: "center" });

  y += 8;
  doc.rect(MARGIN, y, contentWidth, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${bacia} - ${logradouro}   Trecho: ${montante} ao ${jusante}`, MARGIN + 1.2, y + 4.6);
  return y + 7;
}

async function drawAceitePhotoBlock(
  doc: jsPDF,
  photos: AceitePhoto[],
  startIndex: number,
  startY: number,
  legends: [string, string]
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const photoWidth = pageWidth - MARGIN * 2;
  const photoHeight = 58;
  const legendHeight = 4;
  let cursorY = startY;

  for (let i = 0; i < 2; i += 1) {
    const x = MARGIN;
    const entry = photos[startIndex + i];
    doc.rect(x, cursorY, photoWidth, photoHeight);

    if (entry) {
      const dataUrl = await loadImageAsDataUrl(entry.dataUrl);
      const format = dataUrl ? getImageFormat(dataUrl) : null;
      if (dataUrl && format) {
        doc.addImage(dataUrl, format, x, cursorY, photoWidth, photoHeight);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Imagem indisponivel", x + 3, cursorY + photoHeight / 2);
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Sem foto", x + 3, cursorY + photoHeight / 2);
    }

    doc.setFillColor(235, 20, 20);
    doc.rect(x, cursorY + photoHeight, photoWidth, legendHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.4);
    doc.text(legends[i], x + photoWidth / 2, cursorY + photoHeight + 2.9, { align: "center" });

    cursorY += photoHeight + legendHeight + 3;
  }

  return cursorY;
}

function drawAceiteSignatureFooter(doc: jsPDF, startY: number, hidePrefeitura: boolean): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const titles = hidePrefeitura
    ? ["FISCALIZACAO", "DE ACORDO - EMPREITEIRA", "SABESP"]
    : ["PREFEITURA", "FISCALIZACAO", "DE ACORDO - EMPREITEIRA", "SABESP"];
  const names = hidePrefeitura
    ? ["Juliane Cristina dos Santos", "Vanusa Pereira de Souza", "Caio Henrique Urbani"]
    : [
        "Vinicius Camba de Almeida",
        "Juliane Cristina dos Santos",
        "Vanusa Pereira de Souza",
        "Caio Henrique Urbani",
      ];
  const roles = hidePrefeitura
    ? ["Consorcio METASAN", "Consorcio ESG IT. M. DIREITA", "Fiscal do Contrato"]
    : [
        "Prefeitura Municipal de Itanhaem",
        "Consorcio METASAN",
        "Consorcio ESG IT. M. DIREITA",
        "Fiscal do Contrato",
      ];
  const blockWidth = (pageWidth - MARGIN * 2) / titles.length;

  const cellHeight = 24;
  let cursorY = startY;

  for (let i = 0; i < titles.length; i += 1) {
    const x = MARGIN + i * blockWidth;
    doc.rect(x, cursorY, blockWidth, cellHeight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  for (let i = 0; i < titles.length; i += 1) {
    const x = MARGIN + i * blockWidth + 1.1;
    doc.text(titles[i], x, cursorY + 3.4);
  }
  cursorY += 8.8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  for (let i = 0; i < names.length; i += 1) {
    const x = MARGIN + i * blockWidth + blockWidth / 2;
    doc.text(doc.splitTextToSize(names[i], blockWidth - 3), x, cursorY, { align: "center" });
  }
  cursorY += 6.9;
  for (let i = 0; i < roles.length; i += 1) {
    const x = MARGIN + i * blockWidth + blockWidth / 2;
    doc.text(doc.splitTextToSize(roles[i], blockWidth - 3), x, cursorY, { align: "center" });
  }
  return startY + cellHeight;
}

async function generatePavimentoBasePdf(
  input: ReportPdfInput,
  options: { titleText: string; hidePrefeituraInFooter: boolean }
): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const logradouro = findFieldValue(orderedFields, formData, ["logradouro", "rua"]);
  const montante = findFieldValue(orderedFields, formData, ["montante"]);
  const jusante = findFieldValue(orderedFields, formData, ["jusante"]);
  const bacia = findFieldValue(orderedFields, formData, ["bacia"]);
  const photos = resolveAceitePhotosFromFormData(formData);
  const [sanorteLogo, sabespLogo] = await Promise.all([
    loadAssetAsPngDataUrl(sanorteLogoUrl),
    loadAssetAsPngDataUrl(sabespLogoUrl),
  ]);

  let cursorY = await drawPageOneHeader(doc, dataEmissao, {
    sanorte: sanorteLogo,
    sabesp: sabespLogo,
  });
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleAndStretch(
    doc,
    cursorY + 1,
    bacia,
    logradouro,
    montante,
    jusante,
    options.titleText
  ) + 1.5;

  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    0,
    cursorY,
    ["FOTO 1 - Pavimento antes da execucao da obra", "FOTO 2 - Pavimento antes da execucao da obra"]
  );

  drawAceiteSignatureFooter(doc, cursorY + 1.5, options.hidePrefeituraInFooter);

  doc.addPage();
  cursorY = MARGIN + 12;
  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    2,
    cursorY,
    ["FOTO 3 - Pavimento apos a reposicao de bloquete", "FOTO 4 - Pavimento apos a reposicao de bloquete"]
  );
  drawAceiteSignatureFooter(doc, cursorY + 8, options.hidePrefeituraInFooter);

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateAceitePavimentoPdf(input: ReportPdfInput): Promise<void> {
  await generatePavimentoBasePdf(input, {
    titleText: "ACEITE DE RECOMPOSICAO DE PAVIMENTO",
    hidePrefeituraInFooter: false,
  });
}

export async function generateRecomposicaoPavimentoPdf(input: ReportPdfInput): Promise<void> {
  await generatePavimentoBasePdf(input, {
    titleText: "RECOMPOSICAO DE PAVIMENTO",
    hidePrefeituraInFooter: true,
  });
}

export async function generateRegularizacaoPavimentoPdf(input: ReportPdfInput): Promise<void> {
  await generatePavimentoBasePdf(input, {
    titleText: "REGULARIZAÇÃO MECANIZADA",
    hidePrefeituraInFooter: true,
  });
}
