import { ReportPdfBuilder, ReportPdfInput } from "./types";
import {
  generateAceitePavimentoPdf,
  generateManutencaoCanteiroPdf,
  generateRegularizacaoPavimentoPdf,
  generateRecomposicaoPavimentoPdf,
} from "./templates/photoReportTemplatesPdf";
import { generateGenericReportPdf } from "./templates/genericReportPdf";

const reportTemplateMap: Record<string, ReportPdfBuilder> = {
  ACEITE_PAVIMENTO: generateAceitePavimentoPdf,
  MANUTENCAO_CANTEIRO: generateManutencaoCanteiroPdf,
  RECOMPOSICAO: generateRecomposicaoPavimentoPdf,
  REGULARIZACAO: generateRegularizacaoPavimentoPdf,
};

export async function generateReportPdf(input: ReportPdfInput): Promise<void> {
  const builder = reportTemplateMap[input.reportType.code] ?? generateGenericReportPdf;
  await builder(input);
}

export type { ReportPdfInput, LocalMediaFile } from "./types";
