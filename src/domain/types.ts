import {
  ChecklistAnswer,
  InspectionScope,
  InspectionStatus,
  ModuleType,
  UserRole,
} from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  contracts?: Pick<Contract, "id" | "name">[];
  contractIds?: string[];
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
  isContractor: boolean;
  contracts?: Pick<Contract, "id" | "name">[];
  contractIds?: string[];
  collaborators?: Collaborator[];
  collaboratorIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Sector {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  sectorId: string;
  sector?: Sector;
  contractId?: string;
  contract?: Pick<Contract, "id" | "name">;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceOrder {
  id: string;
  osNumber: string;
  contractId?: string;
  contract?: Pick<Contract, "id" | "name">;
  sectorId?: string;
  sector?: Sector;
  address: string;
  field?: boolean;
  remote?: boolean;
  postWork?: boolean;
  status?: string | null;
  equipe?: string | null;
  tempoExecucaoEfetivo?: string | number | null;
  resultado?: string | null;
  fimExecucao?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contract {
  id: string;
  name: string;
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
  referenceImageUrl?: string | null;
  referenceImagePublicId?: string | null;
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
  inspectionScope?: InspectionScope;
  name: string;
  description?: string;
  sectorId: string;
  sector?: Sector;
  active: boolean;
  sections: ChecklistSection[];
  items?: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Linha enxuta nas listagens (`GET /inspections/mine`, `GET /inspections` paginado).
 * Ver `API_DOCUMENTATION.md` — payload reduzido para tabela do app.
 */
export interface InspectionListItem {
  externalId: string;
  serverId?: string;
  module: ModuleType;
  serviceDescription: string;
  locationDescription: string;
  status: InspectionStatus;
  scorePercent?: number | null;
  hasParalysisPenalty?: boolean;
  finalizedAt?: string | null;
  createdAt: string;
  /** API pode retornar só `{ osNumber }` ou `null` sem OS vinculada. */
  serviceOrder?: { osNumber: string } | null;
}

/**
 * Detalhe da vistoria (`GET /inspections/:id`, criação, finalize, paralyze, etc.).
 * Contrato enxuto da API; `team` / `checklist` costumam trazer só `{ name }` para PDF.
 */
export interface Inspection extends InspectionListItem {
  checklistId: string;
  updatedAt: string;
  inspectionScope?: InspectionScope;
  teamId?: string;
  serviceOrderId?: string;
  /** OS: detalhe pode incluir id/endereço; listagem costuma trazer só `osNumber`. */
  serviceOrder?: Pick<ServiceOrder, "id" | "osNumber" | "address"> | { osNumber: string } | null;
  collaboratorIds?: string[];
  createdByUserId?: string;
  paralyzedReason?: string | null;
  paralyzedAt?: string | null;
  paralyzedByUserId?: string | null;
  paralyzedBy?: User | null;
  pendingResolutionNotes?: string;
  pendingResolutionEvidenceId?: string;
  /** Itens (resposta enxuta sem `checklistItem` aninhado — usar checklist em cache). */
  items?: InspectionItem[];
  evidences?: Evidence[];
  signatures?: Signature[];
  team?: Pick<Team, "name"> | Team;
  checklist?: Pick<Checklist, "name"> | Checklist;
  createdBy?: User;
  collaborators?: Collaborator[];
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
