import { AccessAction, AccessTab, InspectionStatus, ModuleType, UserRole } from "../enums";
import { AccessSubject, canAct, canSeeTab } from "./access-area";

type InspectionRef = {
  status?: InspectionStatus | string | null;
  module?: ModuleType | string | null;
};

export function isQualityInspection(inspection: InspectionRef): boolean {
  return inspection.module !== ModuleType.SEGURANCA_TRABALHO;
}

function isAdminOrGestor(user: AccessSubject): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.GESTOR;
}

export function inspectionEditTarget(
  user: AccessSubject | null | undefined,
  inspection: InspectionRef | null | undefined
): "manage" | "fill" | null {
  if (!user?.role || !inspection) return null;
  if (inspection.status === InspectionStatus.RASCUNHO) {
    if (user.role === UserRole.SUPERVISOR) return null;
    return isAdminOrGestor(user) ? "manage" : "fill";
  }
  if (isQualityInspection(inspection)) {
    return canAct(user, AccessAction.PAINEL_VISTORIAS_EDITAR) ? "manage" : null;
  }
  return isAdminOrGestor(user) ? "manage" : null;
}

export function canDeleteInspection(
  user: AccessSubject | null | undefined,
  inspection: InspectionRef | null | undefined
): boolean {
  if (!user?.role || !inspection) return false;
  if (inspection.status === InspectionStatus.RASCUNHO) return user.role !== UserRole.SUPERVISOR;
  if (isQualityInspection(inspection)) {
    return canAct(user, AccessAction.PAINEL_VISTORIAS_EXCLUIR);
  }
  return user.role === UserRole.ADMIN;
}

export function canReviewResolution(user: AccessSubject | null | undefined): boolean {
  return canSeeTab(user, AccessTab.PAINEL_PENDENCIAS_APROVACAO);
}
