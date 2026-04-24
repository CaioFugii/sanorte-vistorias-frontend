import { ReportPdfBuilder, ReportPdfInput } from "./types";
import { generateAceitePavimentoPdf } from "./templates/aceitePavimentoPdf";
import { generateGenericReportPdf } from "./templates/genericReportPdf";

const reportTemplateMap: Record<string, ReportPdfBuilder> = {
  ACEITE_PAVIMENTO: generateAceitePavimentoPdf,
};

export async function generateReportPdf(input: ReportPdfInput): Promise<void> {
  const builder = reportTemplateMap[input.reportType.code] ?? generateGenericReportPdf;
  await builder(input);
}

export type { ReportPdfInput, LocalMediaFile } from "./types";
