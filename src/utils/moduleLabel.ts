import { ModuleType } from "@/domain";

const moduleLabelMap: Record<ModuleType, string> = {
  [ModuleType.QUALIDADE]: "Qualidade",
  [ModuleType.SEGURANCA_TRABALHO]: "Segurança do Trabalho",
  [ModuleType.OBRAS_INVESTIMENTO]: "Obras de Investimento",
  [ModuleType.OBRAS_GLOBAL]: "Obras Global",
  [ModuleType.CANTEIRO]: "Canteiro",
};

export function getModuleLabel(module: ModuleType | undefined): string {
  if (!module) return "Qualidade";
  return moduleLabelMap[module] ?? module;
}
