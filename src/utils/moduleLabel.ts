import { ModuleType } from "@/domain";

const moduleLabelMap: Record<ModuleType, string> = {
  [ModuleType.QUALIDADE]: "Qualidade",
  [ModuleType.CAMPO]: "Campo",
  [ModuleType.SEGURANCA_TRABALHO]: "Segurança do Trabalho",
  [ModuleType.REMOTO]: "Remoto",
  [ModuleType.POS_OBRA]: "Pós-Obra",
  [ModuleType.OBRAS_INVESTIMENTO]: "Obras de Investimento",
  [ModuleType.OBRAS_GLOBAL]: "Obras Global",
  [ModuleType.CANTEIRO]: "Canteiro",
};

export function getModuleLabel(module: ModuleType | undefined): string {
  if (!module) return "Qualidade";
  return moduleLabelMap[module] ?? module;
}
