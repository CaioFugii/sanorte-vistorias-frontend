import jsPDF from "jspdf";
import { findFieldValue, getImageFormat, loadImageAsDataUrl } from "../helpers";
import { ReportPdfInput } from "../types";
import { MARGIN } from "../sharedLayout";
import { drawPhotoReportTitleWithLogos, drawStandardPhotoReportHeader } from "../photoReportHeader";

interface AceitePhoto {
  id: string;
  name: string;
  dataUrl: string;
  title?: string;
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
  return `${day}/${month}/${year}`;
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
    title: typeof candidate.title === "string" ? candidate.title : "",
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

function resolveManutencaoCanteiroPhotosFromFormData(formData: Record<string, unknown>): AceitePhoto[] {
  const indexedPhotos: AceitePhoto[] = [];
  for (let index = 1; index <= 20; index += 1) {
    const photo = toAceitePhoto(formData[`foto${index}`]);
    if (photo) {
      indexedPhotos.push(photo);
    }
  }
  return indexedPhotos;
}

function resolvePhotosFromMediaFields(
  formData: Record<string, unknown>,
  fields: ReportPdfInput["fields"]
): AceitePhoto[] {
  const photos: AceitePhoto[] = [];
  const mediaFields = fields.filter((field) => field.type === "image" || field.type === "signature");

  for (const field of mediaFields) {
    const rawValue = formData[field.fieldKey];
    if (Array.isArray(rawValue)) {
      for (const entry of rawValue) {
        const photo = toAceitePhoto(entry);
        if (photo) photos.push(photo);
      }
      continue;
    }

    const single = toAceitePhoto(rawValue);
    if (single) photos.push(single);
  }

  return photos;
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

function drawTitleOnly(doc: jsPDF, startY: number, titleText: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const y = startY + 1.5;
  doc.rect(MARGIN, y, contentWidth, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.text(titleText, MARGIN + contentWidth / 2, y + 5.4, { align: "center" });
  return y + 8;
}

function drawTitleAndBaciaOnly(
  doc: jsPDF,
  startY: number,
  bacia: string,
  titleText: string,
  etapa: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = startY + 1.5;
  doc.rect(MARGIN, y, contentWidth, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  const etapaText = etapa && etapa !== "-" ? `${etapa} - ` : "";
  doc.text(`${etapaText}${titleText}`, MARGIN + contentWidth / 2, y + 5.4, { align: "center" });

  y += 8;
  doc.rect(MARGIN, y, contentWidth, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Bacia: ${bacia}`, MARGIN + 1.2, y + 4.6);
  return y + 7;
}

async function drawLimpezaRedeTitle(doc: jsPDF, title: string): Promise<number> {
  return await drawPhotoReportTitleWithLogos(doc, title, MARGIN, 10);
}

function drawLimpezaRedeMetadataTable(
  doc: jsPDF,
  startY: number,
  data: {
    produto: string;
    contrato: string;
    engenheiroGerenciamento: string;
    coordenadorObraGerenciadora: string;
    contratada: string;
    dataRelatorio: string;
    responsavelAtendimento: string;
    dataAtendimento: string;
    local: string;
    bairro: string;
    trecho: string;
    extensao: string;
    diametroRede: string;
    subBacia: string;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const x0 = MARGIN;
  let y = startY + 1;

  const row1: Array<[string, string, number]> = [
    ["Produto", data.produto, 0.15],
    ["Contrato", data.contrato, 0.15],
    ["Engenheiro de Gerenciamento", data.engenheiroGerenciamento, 0.35],
    ["Coordenador de Obra Gerenciadora", data.coordenadorObraGerenciadora, 0.35],
  ];
  const row2: Array<[string, string, number]> = [
    ["Contratada", data.contratada, 0.25],
    ["Data do relatorio", data.dataRelatorio, 0.15],
    ["Responsavel pelo atendimento", data.responsavelAtendimento, 0.35],
    ["Data de atendimento", data.dataAtendimento, 0.25],
  ];
  const row3: Array<[string, string, number]> = [
    ["Local", data.local, 0.22],
    ["Bairro", data.bairro, 0.16],
    ["Trecho", data.trecho, 0.22],
    ["EXT.", data.extensao, 0.1],
    ["Diametro da rede", data.diametroRede, 0.14],
    ["Sub bacia", data.subBacia, 0.16],
  ];

  const drawRow = (entries: Array<[string, string, number]>, rowHeight: number) => {
    let x = x0;
    for (const [label, value, ratio] of entries) {
      const width = contentWidth * ratio;
      doc.rect(x, y, width, rowHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text(`${label}:`, x + 1.2, y + 3.4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(value || "-", x + 1.2, y + 7.2, { maxWidth: width - 2.4 });
      x += width;
    }
    y += rowHeight;
  };

  drawRow(row1, 9);
  drawRow(row2, 9);
  drawRow(row3, 9);

  return y + 1;
}

function drawLimpezaSignatureFooter(doc: jsPDF, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const x0 = MARGIN;
  const y = startY;
  const footerH = 13;
  doc.rect(x0, y, contentWidth, footerH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Assinatura responsavel:", x0 + 1.5, y + 4.5);
  doc.line(x0 + 43, y + 9.5, x0 + contentWidth - 2, y + 9.5);
  return y + footerH;
}

async function drawLimpezaPhotoPairSection(
  doc: jsPDF,
  photos: AceitePhoto[],
  startIndex: number,
  startY: number
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const gap = 4;
  const photoW = (contentWidth - gap) / 2;
  const photoH = 58;
  const leftX = MARGIN;
  const rightX = MARGIN + photoW + gap;
  let y = startY;

  const first = photos[startIndex];
  const second = photos[startIndex + 1];
  const headingTitle = first?.title?.trim() || second?.title?.trim() || "LIMPEZA DE REDE";
  const photoANumber = startIndex + 1;
  const photoBNumber = startIndex + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.4);
  doc.text(`FOTOS ${photoANumber} E ${photoBNumber} - ${headingTitle}`, MARGIN + 1, y + 4.3);
  y += 6;

  const drawSinglePhoto = async (entry: AceitePhoto | undefined, x: number, labelNumber: number) => {
    if (!entry) return;
    doc.rect(x, y, photoW, photoH);
    const dataUrl = await loadImageAsDataUrl(entry.dataUrl);
    const format = dataUrl ? getImageFormat(dataUrl) : null;
    if (dataUrl && format) {
      doc.addImage(dataUrl, format, x, y, photoW, photoH);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Imagem indisponivel", x + 3, y + photoH / 2);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`FOTO ${labelNumber}`, x + 1, y + photoH + 3.8);
  };

  await drawSinglePhoto(first, leftX, photoANumber);
  await drawSinglePhoto(second, rightX, photoBNumber);
  return y + photoH + 7;
}

async function drawAceitePhotoBlock(
  doc: jsPDF,
  photos: AceitePhoto[],
  startIndex: number,
  startY: number,
  fallbackTitles: [string, string],
  photoHeight = 58,
  renderMissing = true
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const photoWidth = pageWidth - MARGIN * 2;
  const legendHeight = 4;
  let cursorY = startY;

  for (let i = 0; i < 2; i += 1) {
    const x = MARGIN;
    const entry = photos[startIndex + i];
    if (!entry && !renderMissing) {
      continue;
    }
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
    const photoNumber = startIndex + i + 1;
    const title = entry?.title?.trim() || fallbackTitles[i];
    doc.text(`FOTO ${photoNumber} - ${title}`, x + photoWidth / 2, cursorY + photoHeight + 2.9, {
      align: "center",
    });

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
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
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
    ["Pavimento antes da execucao da obra", "Pavimento antes da execucao da obra"]
  );

  drawAceiteSignatureFooter(doc, cursorY + 1.5, options.hidePrefeituraInFooter);

  doc.addPage();
  cursorY = MARGIN + 12;
  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    2,
    cursorY,
    ["Pavimento apos a reposicao de bloquete", "Pavimento apos a reposicao de bloquete"]
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

export async function generatePvTransicaoPdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const bacia = findFieldValue(orderedFields, formData, ["bacia"]);
  const etapa = findFieldValue(orderedFields, formData, ["etapa"]);
  const photos = resolveAceitePhotosFromFormData(formData);
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleAndBaciaOnly(doc, cursorY + 1, bacia, "PV DE TRANSIÇÃO", etapa) + 1.5;

  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    0,
    cursorY,
    ["Pavimento antes da execucao da obra", "Pavimento antes da execucao da obra"]
  );

  drawAceiteSignatureFooter(doc, cursorY + 1.5, true);

  doc.addPage();
  cursorY = MARGIN + 12;
  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    2,
    cursorY,
    ["Pavimento apos a reposicao de bloquete", "Pavimento apos a reposicao de bloquete"]
  );
  drawAceiteSignatureFooter(doc, cursorY + 8, true);

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateObrasCivisEeePdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const bacia = findFieldValue(orderedFields, formData, ["bacia"]);
  const photos = resolveAceitePhotosFromFormData(formData);
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleAndBaciaOnly(doc, cursorY + 1, bacia, "EXECUÇÃO DE OBRAS CIVIS - EEE", "") + 1.5;

  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    0,
    cursorY,
    ["Pavimento antes da execucao da obra", "Pavimento antes da execucao da obra"]
  );

  drawAceiteSignatureFooter(doc, cursorY + 1.5, true);

  doc.addPage();
  cursorY = MARGIN + 12;
  cursorY = await drawAceitePhotoBlock(
    doc,
    photos,
    2,
    cursorY,
    ["Pavimento apos a reposicao de bloquete", "Pavimento apos a reposicao de bloquete"]
  );
  drawAceiteSignatureFooter(doc, cursorY + 8, true);

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateFornecimentoEeeLrPdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const bacia = findFieldValue(orderedFields, formData, ["bacia"]);
  const tipoFornecimento = findFieldValue(orderedFields, formData, ["tipo_fornecimento", "tipo fornecimento"]);
  const tipoObra = findFieldValue(orderedFields, formData, ["tipo_obra", "tipo obra"]);
  const dynamicTitle =
    tipoFornecimento !== "-" && tipoObra !== "-"
      ? `${tipoFornecimento} - ${tipoObra}`
      : tipoFornecimento !== "-"
        ? tipoFornecimento
        : tipoObra !== "-"
          ? tipoObra
          : "-";
  const fixedPhotos = resolveAceitePhotosFromFormData(formData);
  const photos =
    fixedPhotos.length > 0 ? fixedPhotos : resolvePhotosFromMediaFields(formData, orderedFields);
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleAndBaciaOnly(doc, cursorY + 1, bacia, dynamicTitle, "") + 1.5;

  if (photos.length === 0) {
    drawAceiteSignatureFooter(doc, cursorY + 1.5, true);
  } else {
    for (let photoStart = 0; photoStart < photos.length; photoStart += 2) {
      if (photoStart > 0) {
        doc.addPage();
        cursorY = MARGIN + 12;
      }

      cursorY = await drawAceitePhotoBlock(
        doc,
        photos,
        photoStart,
        cursorY,
        ["Fornecimento EEE LR", "Fornecimento EEE LR"],
        58,
        false
      );

      drawAceiteSignatureFooter(doc, cursorY + (photoStart === 0 ? 1.5 : 8), true);
    }
  }

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateMontagemEeePdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const bacia = findFieldValue(orderedFields, formData, ["bacia"]);
  const tipoFornecimento = findFieldValue(orderedFields, formData, ["tipo_fornecimento", "tipo fornecimento"]);
  const dynamicTitle = tipoFornecimento !== "-" ? `${tipoFornecimento} - EEE` : "EEE";
  const fixedPhotos = resolveAceitePhotosFromFormData(formData);
  const photos =
    fixedPhotos.length > 0 ? fixedPhotos : resolvePhotosFromMediaFields(formData, orderedFields);
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleAndBaciaOnly(doc, cursorY + 1, bacia, dynamicTitle, "") + 1.5;

  if (photos.length === 0) {
    drawAceiteSignatureFooter(doc, cursorY + 1.5, true);
  } else {
    for (let photoStart = 0; photoStart < photos.length; photoStart += 2) {
      if (photoStart > 0) {
        doc.addPage();
        cursorY = MARGIN + 12;
      }

      cursorY = await drawAceitePhotoBlock(
        doc,
        photos,
        photoStart,
        cursorY,
        ["Montagem EEE", "Montagem EEE"],
        58,
        false
      );

      drawAceiteSignatureFooter(doc, cursorY + (photoStart === 0 ? 1.5 : 8), true);
    }
  }

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateLimpezaRedePdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });

  const produto = "Auditoria SABESP";
  const contrato = "00.756/24";
  const engenheiroGerenciamento = "Juliane Cristina dos Santos";
  const coordenadorObraGerenciadora = "Trinid Roman";
  const contratada = "CONS. ESG IT. M. DIREITA";
  const dataRelatorio = new Date().toLocaleDateString("pt-BR");
  const responsavelAtendimento = "Vanusa Pereira de Souza";
  const dataAtendimento = findFieldValue(orderedFields, formData, [
    "dataAtendimento",
    "data de atendimento",
    "data atendimento",
  ]);
  const local = findFieldValue(orderedFields, formData, ["local", "rua", "logradouro"]);
  const bairro = findFieldValue(orderedFields, formData, ["bairro"]);
  const montante = findFieldValue(orderedFields, formData, ["montante"]);
  const jusante = findFieldValue(orderedFields, formData, ["jusante"]);
  const trecho =
    montante !== "-" && jusante !== "-"
      ? `${montante} AO ${jusante}`
      : montante !== "-"
        ? montante
        : jusante !== "-"
          ? jusante
          : "-";
  const extensao = findFieldValue(orderedFields, formData, ["ext", "extensao"]);
  const diametroRede = findFieldValue(orderedFields, formData, ["diametro"]);
  const subBacia = findFieldValue(orderedFields, formData, ["sub bacia", "sub-bacia", "bacia"]);

  const photos = resolvePhotosFromMediaFields(formData, orderedFields);

  let cursorY = await drawLimpezaRedeTitle(doc, "RELATÓRIO FOTOGRÁFICO DE LIMPEZA DE REDE");
  cursorY = drawLimpezaRedeMetadataTable(doc, cursorY, {
    produto,
    contrato,
    engenheiroGerenciamento,
    coordenadorObraGerenciadora,
    contratada,
    dataRelatorio,
    responsavelAtendimento,
    dataAtendimento: formatDatePtBr(dataAtendimento),
    local,
    bairro,
    trecho,
    extensao,
    diametroRede,
    subBacia,
  });

  const firstPageFooterY = doc.internal.pageSize.getHeight() - (MARGIN + 13);
  const sectionEstimatedHeight = 65;
  const footerReserveGap = 4;

  if (photos.length === 0) {
    drawLimpezaSignatureFooter(doc, firstPageFooterY);
  } else {
    let photoIndex = 0;
    let isFirstPage = true;
    while (photoIndex < photos.length) {
      if (!isFirstPage) {
        doc.addPage("a4", "landscape");
        cursorY = (await drawLimpezaRedeTitle(doc, "RELATÓRIO FOTOGRÁFICO DE LIMPEZA DE REDE")) + 2;
      }

      let sectionsInPage = 0;
      while (photoIndex < photos.length) {
        const needsPageBreak = cursorY + sectionEstimatedHeight > firstPageFooterY - footerReserveGap;
        if (needsPageBreak && sectionsInPage > 0) {
          break;
        }
        cursorY = await drawLimpezaPhotoPairSection(doc, photos, photoIndex, cursorY);
        photoIndex += 2;
        sectionsInPage += 1;
      }

      drawLimpezaSignatureFooter(doc, firstPageFooterY);
      isFirstPage = false;
    }
  }

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}

export async function generateManutencaoCanteiroPdf(input: ReportPdfInput): Promise<void> {
  const { reportType, fields, formData } = input;
  const orderedFields = [...fields].sort((a, b) => a.order - b.order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataEmissaoRaw = findFieldValue(orderedFields, formData, ["data", "emissao"]);
  const dataEmissao = formatDatePtBr(dataEmissaoRaw);
  const medicao = findFieldValue(orderedFields, formData, ["medicao"]);
  const inicioPeriodo = findFieldValue(orderedFields, formData, ["inicioPeriodo"]);
  const fimPeriodo = findFieldValue(orderedFields, formData, ["fimPeriodo"]);
  const indexedPhotos = resolveManutencaoCanteiroPhotosFromFormData(formData);
  const photos =
    indexedPhotos.length > 0
      ? indexedPhotos
      : resolvePhotosFromMediaFields(formData, orderedFields).slice(0, 20);
  let cursorY = await drawStandardPhotoReportHeader(doc, dataEmissao);
  cursorY = drawContractMetaGrid(doc, cursorY + 1, medicao, inicioPeriodo, fimPeriodo);
  cursorY = drawTitleOnly(doc, cursorY + 1, "CANTEIRO DE OBRAS") + 1.5;

  if (photos.length === 0) {
    drawAceiteSignatureFooter(doc, cursorY + 1.5, true);
  } else {
    for (let photoStart = 0; photoStart < photos.length; photoStart += 2) {
      if (photoStart > 0) {
        doc.addPage();
        cursorY = MARGIN + 12;
      }

      cursorY = await drawAceitePhotoBlock(
        doc,
        photos,
        photoStart,
        cursorY,
        ["Canteiro de obras", "Canteiro de obras"],
        72,
        false
      );

      drawAceiteSignatureFooter(doc, cursorY + (photoStart === 0 ? 1.5 : 8), true);
    }
  }

  const safeCode = (reportType.code || "relatorio").replace(/[\\/:*?"<>|]/g, "-");
  doc.save(`${safeCode}.pdf`);
}
