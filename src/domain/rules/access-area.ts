import {
  ACCESS_ACTION_TAB,
  AccessAction,
  AccessTab,
  PAINEL_TABS,
  PENDENCIAS_TABS,
  QUALIDADE_DADOS_TABS,
  SEGURANCA_DADOS_TABS,
  UserRole,
} from "../enums";
import type { User } from "../types";

export type AccessSubject = {
  role?: UserRole | string | null;
  areas?: ReadonlyArray<AccessTab | string> | null;
  actions?: ReadonlyArray<AccessAction | string> | null;
};

export type AccessScreen =
  | "gestao"
  | "qualidade_dados"
  | "painel"
  | "seguranca_dados"
  | "relatorios"
  | "campo_minhas"
  | "campo_nova";

export const SCREEN_TABS: Record<AccessScreen, readonly AccessTab[]> = {
  gestao: [AccessTab.GESTAO],
  qualidade_dados: QUALIDADE_DADOS_TABS,
  painel: PAINEL_TABS,
  seguranca_dados: SEGURANCA_DADOS_TABS,
  relatorios: [AccessTab.ENGENHARIA_RELATORIOS],
  campo_minhas: [AccessTab.CAMPO_MINHAS],
  campo_nova: [AccessTab.CAMPO_NOVA],
};

const SCREEN_ROUTE: Record<AccessScreen, string> = {
  gestao: "/dashboard",
  qualidade_dados: "/quality/analytics",
  painel: "/service-orders",
  seguranca_dados: "/safety/analytics",
  relatorios: "/reports/new",
  campo_minhas: "/inspections/mine",
  campo_nova: "/inspections/new",
};

const SCREENS_IN_ORDER: readonly AccessScreen[] = [
  "gestao",
  "qualidade_dados",
  "painel",
  "seguranca_dados",
  "relatorios",
  "campo_minhas",
  "campo_nova",
];

const CAMPO_TABS: readonly AccessTab[] = [AccessTab.CAMPO_MINHAS, AccessTab.CAMPO_NOVA];

export const ACCESS_TAB_LABELS: Record<AccessTab, string> = {
  [AccessTab.GESTAO]: "Gestão",
  [AccessTab.QUALIDADE_DADOS_RANKING]: "Ranking",
  [AccessTab.QUALIDADE_DADOS_VISAO_GERAL]: "Visão Geral",
  [AccessTab.QUALIDADE_DADOS_SERVICOS]: "Serviços",
  [AccessTab.QUALIDADE_DADOS_EQUIPES]: "Equipes",
  [AccessTab.QUALIDADE_DADOS_FISCAIS]: "Fiscais",
  [AccessTab.QUALIDADE_DADOS_GESTAO]: "Gestão",
  [AccessTab.QUALIDADE_DADOS_NAO_CONFORMIDADES]: "Não Conformidades",
  [AccessTab.PAINEL_GLOBAL]: "Global",
  [AccessTab.PAINEL_OBRAS]: "Obras Inv",
  [AccessTab.PAINEL_VISTORIAS]: "Vistorias",
  [AccessTab.PAINEL_CADASTROS]: "Cadastros",
  [AccessTab.PAINEL_PENDENCIAS_ATIVAS]: "Pendências ativas",
  [AccessTab.PAINEL_PENDENCIAS_APROVACAO]: "Aguardando aprovação",
  [AccessTab.PAINEL_PENDENCIAS_RESOLVIDAS]: "Resolvidas",
  [AccessTab.SEGURANCA_DADOS_RANKING]: "Ranking",
  [AccessTab.SEGURANCA_DADOS_VISAO_GERAL]: "Visão Geral",
  [AccessTab.SEGURANCA_DADOS_VISTORIAS]: "Vistorias",
  [AccessTab.SEGURANCA_DADOS_EQUIPES]: "Equipes",
  [AccessTab.SEGURANCA_DADOS_FISCAIS]: "Fiscais",
  [AccessTab.SEGURANCA_DADOS_GESTAO]: "Gestão",
  [AccessTab.SEGURANCA_DADOS_NAO_CONFORMIDADES]: "Não Conformidades",
  [AccessTab.ENGENHARIA_RELATORIOS]: "Relatórios",
  [AccessTab.CAMPO_MINHAS]: "Minhas vistorias",
  [AccessTab.CAMPO_NOVA]: "Nova vistoria",
};

export const ACCESS_ACTION_LABELS: Record<AccessAction, string> = {
  [AccessAction.PAINEL_GLOBAL_EXCLUIR]: "Excluir",
  [AccessAction.PAINEL_OBRAS_CRIAR]: "Nova Obra",
  [AccessAction.PAINEL_OBRAS_EDITAR]: "Editar",
  [AccessAction.PAINEL_OBRAS_EXCLUIR]: "Excluir",
  [AccessAction.PAINEL_VISTORIAS_EDITAR]: "Editar",
  [AccessAction.PAINEL_VISTORIAS_EXCLUIR]: "Excluir",
  [AccessAction.PAINEL_CADASTROS_IMPORTAR]: "Importar",
  [AccessAction.PAINEL_CADASTROS_EDITAR]: "Editar",
  [AccessAction.PAINEL_CADASTROS_EXCLUIR]: "Excluir",
};

export function actionsOfTab(tab: AccessTab): AccessAction[] {
  return (Object.keys(ACCESS_ACTION_TAB) as AccessAction[]).filter(
    (action) => ACCESS_ACTION_TAB[action] === tab
  );
}

export type AccessCatalogScreen = { label: string; tabs: readonly AccessTab[] };

export const ACCESS_CATALOG: Array<{ label: string; screens: AccessCatalogScreen[] }> = [
  { label: "Gestão", screens: [{ label: "Gestão", tabs: SCREEN_TABS.gestao }] },
  {
    label: "Qualidade",
    screens: [
      { label: "Dados", tabs: QUALIDADE_DADOS_TABS },
      { label: "Painel de Controle", tabs: PAINEL_TABS },
    ],
  },
  {
    label: "Segurança do Trabalho",
    screens: [{ label: "Dados", tabs: SEGURANCA_DADOS_TABS }],
  },
  { label: "Engenharia", screens: [{ label: "Relatórios", tabs: SCREEN_TABS.relatorios }] },
  {
    label: "Campo",
    screens: [
      { label: "Minhas vistorias", tabs: SCREEN_TABS.campo_minhas },
      { label: "Nova vistoria", tabs: SCREEN_TABS.campo_nova },
    ],
  },
];

export function canSeeTab(user: AccessSubject | null | undefined, tab: AccessTab): boolean {
  if (!user?.role) return false;
  if (user.role === UserRole.ADMIN) return !CAMPO_TABS.includes(tab);
  return (user.areas ?? []).includes(tab);
}

export function canSeeAnyTab(
  user: AccessSubject | null | undefined,
  tabs: readonly AccessTab[]
): boolean {
  return tabs.some((tab) => canSeeTab(user, tab));
}

export function canSeeScreen(user: AccessSubject | null | undefined, screen: AccessScreen): boolean {
  return canSeeAnyTab(user, SCREEN_TABS[screen]);
}

export function canAct(user: AccessSubject | null | undefined, action: AccessAction): boolean {
  if (!user?.role) return false;
  if (!canSeeTab(user, ACCESS_ACTION_TAB[action])) return false;
  if (user.role === UserRole.ADMIN) return true;
  return (user.actions ?? []).includes(action);
}

export function visibleTabsOf(
  user: AccessSubject | null | undefined,
  tabs: readonly AccessTab[]
): AccessTab[] {
  return tabs.filter((tab) => canSeeTab(user, tab));
}

export function resolveVisibleTab<K extends string>(
  requested: string | null | undefined,
  visible: readonly K[]
): K | null {
  if (requested && (visible as readonly string[]).includes(requested)) return requested as K;
  return visible[0] ?? null;
}

export function firstVisibleRoute(user: AccessSubject | null | undefined): string | null {
  if (!user?.role) return null;
  const screen = SCREENS_IN_ORDER.find((candidate) => canSeeScreen(user, candidate));
  return screen ? SCREEN_ROUTE[screen] : null;
}

const ADMIN_ONLY_PATHS = [
  "/access-profiles",
  "/users",
  "/teams",
  "/field-hierarchy",
  "/contracts",
  "/sectors",
  "/collaborators",
];

export const INSPECTION_DETAIL_TABS: readonly AccessTab[] = [
  ...PAINEL_TABS,
  ...SEGURANCA_DADOS_TABS,
  AccessTab.CAMPO_MINHAS,
];

export function canOpenPath(user: User | null | undefined, pathname: string): boolean {
  if (!user?.role) return true;
  if (ADMIN_ONLY_PATHS.includes(pathname) || pathname.startsWith("/checklists")) {
    return user.role === UserRole.ADMIN;
  }
  if (pathname === "/inspections") {
    return [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR].includes(user.role);
  }
  if (pathname === "/inspections/mine") return canSeeTab(user, AccessTab.CAMPO_MINHAS);
  if (pathname === "/inspections/new") return canSeeTab(user, AccessTab.CAMPO_NOVA);
  if (/^\/inspections\/[^/]+\/fill$/.test(pathname)) {
    return canSeeTab(user, AccessTab.CAMPO_MINHAS);
  }
  if (/^\/inspections\/[^/]+(\/manage)?$/.test(pathname)) {
    return canSeeAnyTab(user, INSPECTION_DETAIL_TABS);
  }
  if (pathname.startsWith("/reports/")) {
    return canSeeTab(user, AccessTab.ENGENHARIA_RELATORIOS);
  }
  if (pathname === "/quality/inspections") return canSeeTab(user, AccessTab.PAINEL_VISTORIAS);
  if (pathname === "/investment-works") return canSeeTab(user, AccessTab.PAINEL_OBRAS);
  if (pathname === "/pendings") return canSeeAnyTab(user, PENDENCIAS_TABS);
  if (pathname === "/safety/inspections") {
    return canSeeTab(user, AccessTab.SEGURANCA_DADOS_VISTORIAS);
  }
  const screen = SCREENS_IN_ORDER.find((candidate) => SCREEN_ROUTE[candidate] === pathname);
  if (!screen) return true;
  return canSeeScreen(user, screen);
}
