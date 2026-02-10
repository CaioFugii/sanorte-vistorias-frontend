import {
  ModuleType,
  UserRole,
  ChecklistAnswer,
  InspectionStatus,
} from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Team {
  id: string;
  name: string;
  active: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  active: boolean;
}

export interface Checklist {
  id: string;
  module: ModuleType;
  name: string;
  description?: string;
  active: boolean;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  order: number;
  requiresPhotoOnNonConformity: boolean;
}

export interface Inspection {
  id: string;
  module: ModuleType;
  checklistId: string;
  teamId: string;
  serviceDescription: string;
  locationDescription?: string;
  collaboratorIds?: string[];
  status: InspectionStatus;
  scorePercent: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  checklistItemId: string;
  answer: ChecklistAnswer | null;
  notes?: string;
}

export interface Evidence {
  id: string;
  inspectionId: string;
  inspectionItemId?: string;
  fileName: string;
  dataUrl: string;
  createdAt: string;
}

export interface Signature {
  id: string;
  inspectionId: string;
  signerName: string;
  signerRoleLabel: string;
  imageDataUrl: string;
  signedAt: string;
}

export interface PendingAdjustment {
  inspectionId: string;
  status: InspectionStatus.PENDENTE_AJUSTE | InspectionStatus.RESOLVIDA;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionEvidenceDataUrl?: string;
}
