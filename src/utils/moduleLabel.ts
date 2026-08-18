import { InvestmentWorkEvaluationModule, ModuleType } from "@/domain";

const moduleLabelMap: Record<ModuleType, string> = {
  [ModuleType.OBRAS_INVESTIMENTO]: "Obras de Investimento",
  [ModuleType.CAMPO]: "Campo",
  [ModuleType.SEGURANCA_TRABALHO]: "Segurança do Trabalho",
  [ModuleType.REMOTO]: "Remoto",
  [ModuleType.POS_OBRA]: "Pós-Obra",
};

const evaluationModuleLabelMap: Record<InvestmentWorkEvaluationModule, string> = {
  [InvestmentWorkEvaluationModule.CAMPO]: "Vistoria em Campo",
  [InvestmentWorkEvaluationModule.POS_OBRA]: "Vistoria Pós Obra",
};

export function getModuleLabel(module: ModuleType | undefined): string {
  if (!module) return "Qualidade";
  return moduleLabelMap[module] ?? module;
}

export function getInvestmentWorkEvaluationModuleLabel(
  evaluationModule: InvestmentWorkEvaluationModule | null | undefined
): string {
  if (!evaluationModule) return "";
  return evaluationModuleLabelMap[evaluationModule] ?? evaluationModule;
}

export function getInspectionModuleDisplayLabel(
  module: ModuleType | undefined,
  evaluationModule?: InvestmentWorkEvaluationModule | null
): string {
  const base = getModuleLabel(module);
  if (module !== ModuleType.OBRAS_INVESTIMENTO || !evaluationModule) {
    return base;
  }
  const typeLabel =
    evaluationModule === InvestmentWorkEvaluationModule.CAMPO ? "Campo" : "Pós-obra";
  return `${base} (${typeLabel})`;
}
