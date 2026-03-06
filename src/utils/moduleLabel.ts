import { ModuleType } from "@/domain";

const moduleLabelMap: Record<ModuleType, string> = {
  [ModuleType.CAMPO]: "Campo",
  [ModuleType.SEGURANCA_TRABALHO]: "Segurança do Trabalho",
  [ModuleType.REMOTO]: "Remoto",
  [ModuleType.POS_OBRA]: "Pós-Obra",
};

export function getModuleLabel(module: ModuleType | undefined): string {
  if (!module) return "Qualidade";
  return moduleLabelMap[module] ?? module;
}
