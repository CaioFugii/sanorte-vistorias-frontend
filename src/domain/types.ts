import {
  ChecklistAnswer,
  InspectionStatus,
  ModuleType,
  SyncState,
  UserRole,
} from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  active: boolean;
  collaborators?: Collaborator[];
  collaboratorIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  id: string;
  checklistId?: string;
  sectionId: string;
  title: string;
  description?: string;
  order: number;
  requiresPhotoOnNonConformity: boolean;
  active: boolean;
}

export interface ChecklistSection {
  id: string;
  checklistId: string;
  name: string;
  title?: string;
  order: number;
  active?: boolean;
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  module: ModuleType;
  name: string;
  description?: string;
  active: boolean;
  sections: ChecklistSection[];
  items?: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Inspection {
  externalId: string;
  serverId?: string;
  module: ModuleType;
  checklistId: string;
  teamId: string;
  collaboratorIds?: string[];
  serviceDescription: string;
  locationDescription: string;
  status: InspectionStatus;
  scorePercent?: number;
  syncState: SyncState;
  syncErrorMessage?: string;
  syncedAt?: string;
  createdByUserId: string;
  createdOffline: boolean;
  pendingResolutionNotes?: string;
  pendingResolutionEvidenceId?: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  /** Itens da vistoria (preenchido quando a API retorna a vistoria completa, ex.: GET /inspections/:id). */
  items?: InspectionItem[];
  /** Relações opcionais retornadas pela API (GET /inspections/:id). */
  team?: Team;
  checklist?: Checklist;
  createdBy?: User;
  collaborators?: Collaborator[];
  evidences?: Evidence[];
  signatures?: Signature[];
}

export interface InspectionItem {
  id: string;
  inspectionExternalId?: string;
  inspectionId?: string;
  checklistItemId: string;
  checklistItem?: ChecklistItem;
  answer?: ChecklistAnswer;
  notes?: string;
  updatedAt: string;
  /** Preenchido quando o item não conforme é resolvido. */
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolvedBy?: User | null;
  resolutionNotes?: string | null;
  resolutionEvidencePath?: string | null;
}

export interface Evidence {
  id: string;
  inspectionExternalId: string;
  inspectionItemId?: string;
  fileName: string;
  mimeType: string;
  /** Local preview ou legado; quando temos Cloudinary use `url`. */
  dataUrl?: string;
  /** ID do asset no Cloudinary (ex: quality/evidences/abc123). */
  cloudinaryPublicId?: string;
  /** URL segura do Cloudinary. */
  url?: string;
  /** Tamanho em bytes (metadado Cloudinary ou estimado). */
  size?: number;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Signature {
  id: string;
  inspectionExternalId: string;
  signerName: string;
  /** Rótulo do signatário (ex: "Lider/Encarregado"). */
  signerRoleLabel?: string;
  /** Local preview ou legado; quando temos Cloudinary use `url`. */
  dataUrl?: string;
  /** ID do asset no Cloudinary. */
  cloudinaryPublicId?: string;
  /** URL segura do Cloudinary. */
  url?: string;
  signedAt: string;
}

export interface SyncInspectionPayload {
  inspection: Inspection;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  signature: Signature | null;
}

export interface SyncInspectionResult {
  externalId: string;
  status: "CREATED" | "UPDATED" | "ERROR";
  serverId?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
