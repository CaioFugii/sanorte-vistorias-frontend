import { ReportPdfBuilder, ReportPdfInput } from "./types";
import {
  generateAceitePavimentoPdf,
  generateFornecimentoEeeLrPdf,
  generateLimpezaRedePdf,
  generateLigacaoPasseioPdf,
  generateManutencaoCanteiroPdf,
  generateMontagemEeePdf,
  generateObrasCivisEeePdf,
  generatePvTransicaoPdf,
  generateRegularizacaoPavimentoPdf,
  generateRecomposicaoPavimentoPdf,
} from "./templates/photoReportTemplatesPdf";
import { generateGenericReportPdf } from "./templates/genericReportPdf";

const reportTemplateMap: Record<string, ReportPdfBuilder> = {
  ACEITE_PAVIMENTO: generateAceitePavimentoPdf,
  FORNECIMENTO_EEE_LR: generateFornecimentoEeeLrPdf,
  LIMPEZA_REDE: generateLimpezaRedePdf,
  LIGACAO_PASSEIO: generateLigacaoPasseioPdf,
  MANUTENCAO_CANTEIRO: generateManutencaoCanteiroPdf,
  MONTAGEM_EEE: generateMontagemEeePdf,
  OBRAS_CIVIS_EEE: generateObrasCivisEeePdf,
  PV_TRANSICAO: generatePvTransicaoPdf,
  RECOMPOSICAO: generateRecomposicaoPavimentoPdf,
  REGULARIZACAO: generateRegularizacaoPavimentoPdf,
};

export async function generateReportPdf(input: ReportPdfInput): Promise<void> {
  const builder = reportTemplateMap[input.reportType.code] ?? generateGenericReportPdf;
  await builder(input);
}

export type { ReportPdfInput, LocalMediaFile } from "./types";
