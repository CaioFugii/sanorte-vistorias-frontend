import {
  ModuleType,
  UserRole,
  ChecklistAnswer,
  InspectionStatus,
  PendingStatus,
} from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  collaborators?: Collaborator[]; // Opcional, apenas quando solicitado
}

export interface Collaborator {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  module: ModuleType;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ChecklistItem[]; // Opcional, apenas quando solicitado
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  description?: string;
  order: number;
  requiresPhotoOnNonConformity: boolean;
  active: boolean;
}

export interface Inspection {
  id: string;
  module: ModuleType;
  checklistId: string;
  checklist?: Checklist; // Opcional, quando solicitado
  teamId: string;
  team?: Team; // Opcional, quando solicitado
  serviceDescription: string;
  locationDescription?: string;
  status: InspectionStatus;
  scorePercent?: number; // null até finalizar, depois 0-100
  createdByUserId: string;
  createdBy?: User; // Opcional, quando solicitado
  finalizedAt?: string; // null até finalizar
  createdAt: string;
  updatedAt: string;
  collaborators?: Collaborator[]; // Opcional
  items?: InspectionItem[]; // Opcional
  evidences?: Evidence[]; // Opcional
  signatures?: Signature[]; // Opcional
  pendingAdjustments?: PendingAdjustment[]; // Opcional
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  checklistItemId: string;
  checklistItem?: ChecklistItem; // Opcional, quando solicitado
  answer?: ChecklistAnswer; // null | "CONFORME" | "NAO_CONFORME" | "NAO_APLICAVEL"
  notes?: string;
  createdAt: string;
  updatedAt: string;
  evidences?: Evidence[]; // Opcional
}

export interface Evidence {
  id: string;
  inspectionId: string;
  inspectionItemId?: string; // null se for evidência geral
  filePath: string; // Caminho relativo (ex: "evidences/file.jpg")
  fileName: string; // Nome original do arquivo
  mimeType: string; // "image/jpeg", "image/png", etc
  size: number; // Tamanho em bytes
  createdAt: string;
  uploadedByUserId: string;
}

export interface Signature {
  id: string;
  inspectionId: string;
  signerName: string;
  signerRoleLabel: string; // Geralmente "Lider/Encarregado"
  imagePath: string; // Caminho relativo
  signedAt: string; // ISO 8601
}

export interface PendingAdjustment {
  id: string;
  inspectionId: string;
  status: PendingStatus;
  resolvedAt?: string; // null até resolver
  resolvedByUserId?: string; // null até resolver
  resolvedBy?: User; // Opcional, quando solicitado
  resolutionNotes?: string; // null até resolver
  resolutionEvidencePath?: string; // Opcional
  createdAt: string;
  updatedAt: string;
}
