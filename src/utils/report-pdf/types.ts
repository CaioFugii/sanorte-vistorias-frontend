import { ReportType, ReportTypeField } from "@/domain";

export interface LocalMediaFile {
  id: string;
  name: string;
  dataUrl: string;
}

export type PrimitiveValue = string | number | boolean | null | undefined | string[];

export interface ReportPdfInput {
  reportType: ReportType;
  fields: ReportTypeField[];
  formData: Record<string, unknown>;
}

export type ReportPdfBuilder = (input: ReportPdfInput) => Promise<void>;
