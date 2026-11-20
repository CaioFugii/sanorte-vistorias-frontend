import { ACCESS_AREAS_IN_ORDER, AccessArea, UserRole } from "../enums";
import type { User } from "../types";

export type AccessSubject = {
  role?: UserRole | string | null;
  areas?: ReadonlyArray<AccessArea | string> | null;
};

const FIELD_EXECUTION_AREAS: readonly AccessArea[] = [
  AccessArea.CAMPO_MINHAS,
  AccessArea.CAMPO_NOVA,
];

export const AREAS_OPERATED_BY_ROLE: Record<UserRole, readonly AccessArea[]> = {
  [UserRole.ADMIN]: ACCESS_AREAS_IN_ORDER.filter((area) => !FIELD_EXECUTION_AREAS.includes(area)),
  [UserRole.GESTOR]: [
    AccessArea.GESTAO,
    AccessArea.QUALIDADE_DADOS,
    AccessArea.QUALIDADE_PAINEL,
    AccessArea.QUALIDADE_PENDENCIAS,
    AccessArea.SEGURANCA_DADOS,
    AccessArea.ENGENHARIA_OBRAS,
    AccessArea.ENGENHARIA_RELATORIOS,
  ],
  [UserRole.SUPERVISOR]: [
    AccessArea.GESTAO,
    AccessArea.QUALIDADE_DADOS,
    AccessArea.QUALIDADE_PENDENCIAS,
    AccessArea.SEGURANCA_DADOS,
    AccessArea.ENGENHARIA_RELATORIOS,
  ],
  [UserRole.FISCAL]: [
    AccessArea.CAMPO_MINHAS,
    AccessArea.CAMPO_NOVA,
    AccessArea.ENGENHARIA_RELATORIOS,
  ],
};

export const ACCESS_AREA_LABELS: Record<AccessArea, string> = {
  [AccessArea.GESTAO]: "Gestão",
  [AccessArea.QUALIDADE_DADOS]: "Dados de Qualidade",
  [AccessArea.QUALIDADE_PAINEL]: "Painel de Controle",
  [AccessArea.ENGENHARIA_OBRAS]: "Obras Inv",
  [AccessArea.QUALIDADE_PENDENCIAS]: "Pendências",
  [AccessArea.SEGURANCA_DADOS]: "Dados de Segurança",
  [AccessArea.ENGENHARIA_RELATORIOS]: "Relatórios",
  [AccessArea.CAMPO_MINHAS]: "Minhas vistorias",
  [AccessArea.CAMPO_NOVA]: "Nova vistoria",
};

export const ACCESS_AREA_GROUPS: Array<{ label: string; areas: AccessArea[] }> = [
  { label: "Gestão", areas: [AccessArea.GESTAO] },
  {
    label: "Qualidade",
    areas: [
      AccessArea.QUALIDADE_DADOS,
      AccessArea.QUALIDADE_PAINEL,
      AccessArea.ENGENHARIA_OBRAS,
      AccessArea.QUALIDADE_PENDENCIAS,
    ],
  },
  { label: "Segurança do Trabalho", areas: [AccessArea.SEGURANCA_DADOS] },
  {
    label: "Engenharia",
    areas: [AccessArea.ENGENHARIA_RELATORIOS],
  },
  { label: "Campo", areas: [AccessArea.CAMPO_MINHAS, AccessArea.CAMPO_NOVA] },
];

const AREA_ROUTE: Record<AccessArea, string> = {
  [AccessArea.GESTAO]: "/dashboard",
  [AccessArea.QUALIDADE_DADOS]: "/quality/analytics",
  [AccessArea.QUALIDADE_PAINEL]: "/service-orders",
  [AccessArea.QUALIDADE_PENDENCIAS]: "/pendings",
  [AccessArea.SEGURANCA_DADOS]: "/safety/analytics",
  [AccessArea.ENGENHARIA_OBRAS]: "/service-orders?tab=obras",
  [AccessArea.ENGENHARIA_RELATORIOS]: "/reports/new",
  [AccessArea.CAMPO_MINHAS]: "/inspections/mine",
  [AccessArea.CAMPO_NOVA]: "/inspections/new",
};

const ADMIN_ONLY_PATHS = [
  "/access-profiles",
  "/users",
  "/teams",
  "/field-hierarchy",
  "/contracts",
  "/sectors",
  "/collaborators",
];

const INSPECTION_PARENT_AREAS: AccessArea[] = [
  AccessArea.QUALIDADE_PAINEL,
  AccessArea.QUALIDADE_PENDENCIAS,
  AccessArea.SEGURANCA_DADOS,
  AccessArea.CAMPO_MINHAS,
];

export function roleOperatesArea(
  role: UserRole | string | null | undefined,
  area: AccessArea
): boolean {
  if (!role) return false;
  return (AREAS_OPERATED_BY_ROLE[role as UserRole] ?? []).includes(area);
}

export function canSeeObrasInvTab(user: AccessSubject | null | undefined): boolean {
  return (
    canSeeArea(user, AccessArea.QUALIDADE_PAINEL) &&
    canSeeArea(user, AccessArea.ENGENHARIA_OBRAS)
  );
}

export function canSeeArea(
  user: AccessSubject | null | undefined,
  area: AccessArea
): boolean {
  if (!user?.role) return false;
  if (user.role === UserRole.ADMIN) return roleOperatesArea(UserRole.ADMIN, area);
  return (user.areas ?? []).includes(area);
}

export function canActBeyondRole(
  user: AccessSubject | null | undefined,
  area: AccessArea
): boolean {
  if (!user?.role || user.role === UserRole.ADMIN) return false;
  if (roleOperatesArea(user.role, area)) return false;
  return (user.areas ?? []).includes(area);
}

export function canAreaAction(
  user: AccessSubject | null | undefined,
  area: AccessArea,
  allowedRoles: readonly UserRole[]
): boolean {
  if (!user?.role) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (allowedRoles.includes(user.role as UserRole)) return true;
  return canActBeyondRole(user, area);
}

export function firstVisibleRoute(user: AccessSubject | null | undefined): string | null {
  if (!user?.role) return null;
  if (user.role === UserRole.ADMIN) return "/dashboard";
  const area = ACCESS_AREAS_IN_ORDER.find((candidate) => {
    if (!canSeeArea(user, candidate)) return false;
    if (candidate === AccessArea.ENGENHARIA_OBRAS) return canSeeObrasInvTab(user);
    return true;
  });
  return area ? AREA_ROUTE[area] : null;
}

function canSeeAny(user: AccessSubject, areas: AccessArea[]): boolean {
  return areas.some((area) => canSeeArea(user, area));
}

export function canOpenPath(user: User | null | undefined, pathname: string): boolean {
  if (!user?.role) return true;
  if (ADMIN_ONLY_PATHS.includes(pathname) || pathname.startsWith("/checklists")) {
    return user.role === UserRole.ADMIN;
  }
  if (pathname === "/inspections") {
    return [UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR].includes(user.role);
  }
  if (pathname === "/inspections/mine") return canSeeArea(user, AccessArea.CAMPO_MINHAS);
  if (pathname === "/inspections/new") return canSeeArea(user, AccessArea.CAMPO_NOVA);
  if (/^\/inspections\/[^/]+\/fill$/.test(pathname)) {
    return canSeeArea(user, AccessArea.CAMPO_MINHAS);
  }
  if (/^\/inspections\/[^/]+(\/manage)?$/.test(pathname)) {
    return canSeeAny(user, INSPECTION_PARENT_AREAS);
  }
  if (pathname.startsWith("/reports/")) {
    return canSeeArea(user, AccessArea.ENGENHARIA_RELATORIOS);
  }
  if (pathname.startsWith("/quality/inspections")) {
    return canSeeArea(user, AccessArea.QUALIDADE_PAINEL);
  }
  if (pathname.startsWith("/safety/")) {
    return canSeeArea(user, AccessArea.SEGURANCA_DADOS);
  }
  const match = (Object.entries(AREA_ROUTE) as Array<[AccessArea, string]>).find(
    ([, route]) => pathname === route
  );
  if (!match) return true;
  return canSeeArea(user, match[0]);
}
