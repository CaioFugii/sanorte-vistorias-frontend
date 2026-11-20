export enum ModuleType {
  OBRAS_INVESTIMENTO = "OBRAS_INVESTIMENTO",
  CAMPO = "CAMPO",
  REMOTO = "REMOTO",
  POS_OBRA = "POS_OBRA",
  SEGURANCA_TRABALHO = "SEGURANCA_TRABALHO",
}

export enum InvestmentWorkEvaluationModule {
  CAMPO = "CAMPO",
  POS_OBRA = "POS_OBRA",
}


export enum UserRole {
  ADMIN = "ADMIN",
  GESTOR = "GESTOR",
  SUPERVISOR = "SUPERVISOR",
  FISCAL = "FISCAL",
}

export enum AccessArea {
  GESTAO = "gestao",
  QUALIDADE_DADOS = "qualidade_dados",
  QUALIDADE_PAINEL = "qualidade_painel",
  QUALIDADE_PENDENCIAS = "qualidade_pendencias",
  SEGURANCA_DADOS = "seguranca_dados",
  ENGENHARIA_OBRAS = "engenharia_obras",
  ENGENHARIA_RELATORIOS = "engenharia_relatorios",
  CAMPO_MINHAS = "campo_minhas",
  CAMPO_NOVA = "campo_nova",
}

export const ACCESS_AREAS_IN_ORDER: readonly AccessArea[] = [
  AccessArea.GESTAO,
  AccessArea.QUALIDADE_DADOS,
  AccessArea.QUALIDADE_PAINEL,
  AccessArea.QUALIDADE_PENDENCIAS,
  AccessArea.SEGURANCA_DADOS,
  AccessArea.ENGENHARIA_OBRAS,
  AccessArea.ENGENHARIA_RELATORIOS,
  AccessArea.CAMPO_MINHAS,
  AccessArea.CAMPO_NOVA,
];

export enum ChecklistAnswer {
  CONFORME = "CONFORME",
  NAO_CONFORME = "NAO_CONFORME",
  NAO_APLICAVEL = "NAO_APLICAVEL",
}

export enum InspectionStatus {
  RASCUNHO = "RASCUNHO",
  FINALIZADA = "FINALIZADA",
  PENDENTE_AJUSTE = "PENDENTE_AJUSTE",
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  RESOLVIDA = "RESOLVIDA",
}

export enum InspectionNoticeType {
  RESOLUTION_SUBMITTED = "RESOLUTION_SUBMITTED",
  RESOLUTION_APPROVED = "RESOLUTION_APPROVED",
  RESOLUTION_REJECTED = "RESOLUTION_REJECTED",
}

export enum InspectionScope {
  TEAM = "TEAM",
  COLLABORATOR = "COLLABORATOR",
}

export enum InspectionExcelLayout {
  AVALIACOES = "avaliacoes",
  PENDENCIAS = "pendencias",
}

export enum ServiceOrderImportLineStatus {
  ENTERED = "entered",
  NOT_REGISTERED = "not_registered",
}

export enum InvestmentWorkStatus {
  EM_ANDAMENTO = "EM_ANDAMENTO",
  PARALISADA = "PARALISADA",
  FINALIZADA = "FINALIZADA",
  CANCELADA = "CANCELADA",
}
