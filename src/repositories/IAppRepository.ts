import {
  Checklist,
  ChecklistItem,
  Collaborator,
  Evidence,
  Inspection,
  InspectionStatus,
  InspectionItem,
  ModuleType,
  PaginatedResponse,
  Sector,
  ServiceOrder,
  Signature,
  Team,
  User,
  UserRole,
} from "@/domain";

export interface IAppRepository {
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  me(): Promise<User>;
  logout(): void;

  loadTeams(forceApi?: boolean): Promise<Team[]>;
  loadSectors(forceApi?: boolean): Promise<Sector[]>;
  loadChecklists(forceApi?: boolean): Promise<Checklist[]>;
  getCachedTeams(): Promise<Team[]>;
  getCachedSectors(): Promise<Sector[]>;
  getCachedChecklists(): Promise<Checklist[]>;
  getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>>;
  createUser(input: { name: string; email: string; password: string; role: UserRole }): Promise<User>;
  updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole }>
  ): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  getCollaborators(params?: {
    page?: number;
    limit?: number;
    sectorId?: string;
  }): Promise<PaginatedResponse<Collaborator>>;
  createCollaborator(input: { name: string; sectorId: string; active: boolean }): Promise<Collaborator>;
  updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; sectorId: string; active: boolean }>
  ): Promise<Collaborator>;
  deleteCollaborator(collaboratorId: string): Promise<void>;

  createSector(input: { name: string; active: boolean }): Promise<Sector>;
  updateSector(
    sectorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Sector>;
  deleteSector(sectorId: string): Promise<void>;

  createTeam(input: { name: string; active: boolean; collaboratorIds?: string[] }): Promise<Team>;
  updateTeam(
    teamId: string,
    input: Partial<{ name: string; active: boolean; collaboratorIds?: string[] }>
  ): Promise<Team>;
  deleteTeam(teamId: string): Promise<void>;

  getChecklists(params?: {
    module?: ModuleType;
    sectorId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>>;
  createChecklist(input: {
    module: ModuleType;
    name: string;
    description?: string;
    sectorId: string;
    active: boolean;
  }): Promise<Checklist>;
  updateChecklist(
    checklistId: string,
    input: Partial<{ name: string; description?: string; sectorId: string; active: boolean }>
  ): Promise<Checklist>;
  deleteChecklist(checklistId: string): Promise<void>;
  createChecklistSection(
    checklistId: string,
    input: { name: string; order: number; active: boolean }
  ): Promise<void>;
  updateChecklistSection(
    checklistId: string,
    sectionId: string,
    input: Partial<{ name: string; order: number; active: boolean }>
  ): Promise<void>;
  createChecklistItem(
    checklistId: string,
    input: {
      title: string;
      description?: string;
      order: number;
      sectionId: string;
      requiresPhotoOnNonConformity: boolean;
      active: boolean;
    }
  ): Promise<ChecklistItem>;
  updateChecklistItem(
    checklistId: string,
    itemId: string,
    input: Partial<{
      title: string;
      description?: string;
      order: number;
      requiresPhotoOnNonConformity: boolean;
      active: boolean;
    }>
  ): Promise<ChecklistItem>;
  deleteChecklistItem(checklistId: string, itemId: string): Promise<void>;

  getServiceOrders(): Promise<ServiceOrder[]>;
  importServiceOrders(file: File): Promise<{ inserted: number; skipped: number; errors: string[] }>;

  getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
    osNumber?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Inspection>>;
  getMyInspections(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
  }): Promise<PaginatedResponse<Inspection>>;
  getDashboardSummary(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }): Promise<{ averagePercent: number; inspectionsCount: number; pendingCount: number }>;
  getDashboardTeamRanking(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
  }): Promise<
    Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      pendingCount: number;
    }>
  >;

  createInspection(input: {
    module: ModuleType;
    teamId: string;
    checklistId: string;
    serviceOrderId: string;
    collaboratorIds?: string[];
    serviceDescription: string;
    locationDescription: string;
    createdByUserId: string;
  }): Promise<Inspection>;
  getInspection(externalId: string, forceApi?: boolean): Promise<Inspection | null>;
  listInspections(): Promise<Inspection[]>;
  listInspectionsByUser(userId: string): Promise<Inspection[]>;
  /** Lista para perfil FISCAL: online = API + local (rascunhos); offline = só local. */
  listInspectionsForFiscal(userId: string): Promise<Inspection[]>;
  listPendingAdjustments(): Promise<Inspection[]>;
  updateInspection(externalId: string, updates: Partial<Inspection>): Promise<Inspection>;
  updateInspectionOnline(externalId: string, updates: Partial<Inspection>): Promise<Inspection>;
  setInspectionItemsOnline(externalId: string, items: InspectionItem[]): Promise<InspectionItem[]>;
  addInspectionEvidenceOnline(
    inspectionId: string,
    inspectionExternalId: string,
    file: File,
    inspectionItemId?: string
  ): Promise<Evidence>;
  resolveInspectionItem(
    inspectionServerId: string,
    itemId: string,
    options: {
      resolutionNotes: string;
      /** URL da imagem (recomendado: upload no Cloudinary). Evite base64 para não exceder limite do body. */
      resolutionEvidenceUrl?: string;
      /** @deprecated Use resolutionEvidenceUrl (upload primeiro). Base64 pode causar "Entity too large". */
      resolutionEvidenceBase64?: string;
    }
  ): Promise<InspectionItem>;
  finalizeInspection(inspectionId: string): Promise<Inspection>;
  getInspectionPdf(inspectionId: string): Promise<Blob>;

  resolvePendingInspection(
    externalId: string,
    options: {
      resolutionNotes?: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<Inspection>;
  paralyzeInspection(id: string, reason: string): Promise<Inspection>;
  unparalyzeInspection(id: string): Promise<Inspection>;
  setInspectionItems(externalId: string, items: InspectionItem[]): Promise<void>;
  getInspectionItems(externalId: string): Promise<InspectionItem[]>;
  saveEvidence(evidence: Evidence): Promise<Evidence>;
  removeEvidence(evidenceId: string): Promise<void>;
  getEvidences(externalId: string): Promise<Evidence[]>;
  saveSignature(signature: Signature): Promise<Signature>;
  getSignature(externalId: string): Promise<Signature | null>;

  /** Upload de imagem para Cloudinary (POST /uploads). Retorna publicId, url e metadados. */
  uploadToCloudinary(
    file: File,
    folder?: "quality/evidences" | "quality/signatures" | "evidences" | "signatures"
  ): Promise<{
    publicId: string;
    url: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  }>;
  deleteFromCloudinary(publicId: string): Promise<void>;
}
