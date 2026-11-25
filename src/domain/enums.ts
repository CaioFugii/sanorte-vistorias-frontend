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

export enum AccessTab {
  GESTAO = "gestao",
  QUALIDADE_DADOS_RANKING = "qualidade_dados_ranking",
  QUALIDADE_DADOS_VISAO_GERAL = "qualidade_dados_visao_geral",
  QUALIDADE_DADOS_SERVICOS = "qualidade_dados_servicos",
  QUALIDADE_DADOS_EQUIPES = "qualidade_dados_equipes",
  QUALIDADE_DADOS_FISCAIS = "qualidade_dados_fiscais",
  QUALIDADE_DADOS_GESTAO = "qualidade_dados_gestao",
  QUALIDADE_DADOS_NAO_CONFORMIDADES = "qualidade_dados_nao_conformidades",
  PAINEL_GLOBAL = "painel_global",
  PAINEL_OBRAS = "painel_obras",
  PAINEL_VISTORIAS = "painel_vistorias",
  PAINEL_CADASTROS = "painel_cadastros",
  PAINEL_PENDENCIAS_ATIVAS = "painel_pendencias_ativas",
  PAINEL_PENDENCIAS_APROVACAO = "painel_pendencias_aprovacao",
  PAINEL_PENDENCIAS_RESOLVIDAS = "painel_pendencias_resolvidas",
  SEGURANCA_DADOS_RANKING = "seguranca_dados_ranking",
  SEGURANCA_DADOS_VISAO_GERAL = "seguranca_dados_visao_geral",
  SEGURANCA_DADOS_VISTORIAS = "seguranca_dados_vistorias",
  SEGURANCA_DADOS_EQUIPES = "seguranca_dados_equipes",
  SEGURANCA_DADOS_FISCAIS = "seguranca_dados_fiscais",
  SEGURANCA_DADOS_GESTAO = "seguranca_dados_gestao",
  SEGURANCA_DADOS_NAO_CONFORMIDADES = "seguranca_dados_nao_conformidades",
  ENGENHARIA_RELATORIOS = "engenharia_relatorios",
  CAMPO_MINHAS = "campo_minhas",
  CAMPO_NOVA = "campo_nova",
}

export enum AccessAction {
  PAINEL_GLOBAL_EXCLUIR = "painel_global_excluir",
  PAINEL_OBRAS_CRIAR = "painel_obras_criar",
  PAINEL_OBRAS_EDITAR = "painel_obras_editar",
  PAINEL_OBRAS_EXCLUIR = "painel_obras_excluir",
  PAINEL_VISTORIAS_EDITAR = "painel_vistorias_editar",
  PAINEL_VISTORIAS_EXCLUIR = "painel_vistorias_excluir",
  PAINEL_CADASTROS_IMPORTAR = "painel_cadastros_importar",
  PAINEL_CADASTROS_EDITAR = "painel_cadastros_editar",
  PAINEL_CADASTROS_EXCLUIR = "painel_cadastros_excluir",
}

export const QUALIDADE_DADOS_TABS: readonly AccessTab[] = [
  AccessTab.QUALIDADE_DADOS_RANKING,
  AccessTab.QUALIDADE_DADOS_VISAO_GERAL,
  AccessTab.QUALIDADE_DADOS_SERVICOS,
  AccessTab.QUALIDADE_DADOS_EQUIPES,
  AccessTab.QUALIDADE_DADOS_FISCAIS,
  AccessTab.QUALIDADE_DADOS_GESTAO,
  AccessTab.QUALIDADE_DADOS_NAO_CONFORMIDADES,
];

export const PENDENCIAS_TABS: readonly AccessTab[] = [
  AccessTab.PAINEL_PENDENCIAS_ATIVAS,
  AccessTab.PAINEL_PENDENCIAS_APROVACAO,
  AccessTab.PAINEL_PENDENCIAS_RESOLVIDAS,
];

export const PAINEL_TABS: readonly AccessTab[] = [
  AccessTab.PAINEL_GLOBAL,
  AccessTab.PAINEL_OBRAS,
  AccessTab.PAINEL_VISTORIAS,
  AccessTab.PAINEL_CADASTROS,
  ...PENDENCIAS_TABS,
];

export const SEGURANCA_DADOS_TABS: readonly AccessTab[] = [
  AccessTab.SEGURANCA_DADOS_RANKING,
  AccessTab.SEGURANCA_DADOS_VISAO_GERAL,
  AccessTab.SEGURANCA_DADOS_VISTORIAS,
  AccessTab.SEGURANCA_DADOS_EQUIPES,
  AccessTab.SEGURANCA_DADOS_FISCAIS,
  AccessTab.SEGURANCA_DADOS_GESTAO,
  AccessTab.SEGURANCA_DADOS_NAO_CONFORMIDADES,
];

export const ACCESS_TABS_IN_ORDER: readonly AccessTab[] = [
  AccessTab.GESTAO,
  ...QUALIDADE_DADOS_TABS,
  ...PAINEL_TABS,
  ...SEGURANCA_DADOS_TABS,
  AccessTab.ENGENHARIA_RELATORIOS,
  AccessTab.CAMPO_MINHAS,
  AccessTab.CAMPO_NOVA,
];

export const ACCESS_ACTION_TAB: Readonly<Record<AccessAction, AccessTab>> = {
  [AccessAction.PAINEL_GLOBAL_EXCLUIR]: AccessTab.PAINEL_GLOBAL,
  [AccessAction.PAINEL_OBRAS_CRIAR]: AccessTab.PAINEL_OBRAS,
  [AccessAction.PAINEL_OBRAS_EDITAR]: AccessTab.PAINEL_OBRAS,
  [AccessAction.PAINEL_OBRAS_EXCLUIR]: AccessTab.PAINEL_OBRAS,
  [AccessAction.PAINEL_VISTORIAS_EDITAR]: AccessTab.PAINEL_VISTORIAS,
  [AccessAction.PAINEL_VISTORIAS_EXCLUIR]: AccessTab.PAINEL_VISTORIAS,
  [AccessAction.PAINEL_CADASTROS_IMPORTAR]: AccessTab.PAINEL_CADASTROS,
  [AccessAction.PAINEL_CADASTROS_EDITAR]: AccessTab.PAINEL_CADASTROS,
  [AccessAction.PAINEL_CADASTROS_EXCLUIR]: AccessTab.PAINEL_CADASTROS,
};

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

export enum InvestmentWorkOrigin {
  MANUAL = "MANUAL",
  IMPORT = "IMPORT",
}

export enum InvestmentWorkStatus {
  EM_ANDAMENTO = "EM_ANDAMENTO",
  PARALISADA = "PARALISADA",
  FINALIZADA = "FINALIZADA",
  CANCELADA = "CANCELADA",
}
