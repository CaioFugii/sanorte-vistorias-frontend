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
  Signature,
  SyncInspectionResult,
  Team,
  User,
  UserRole,
} from "@/domain";

export interface IAppRepository {
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  me(): Promise<User>;
  logout(): void;

  loadTeams(forceApi?: boolean): Promise<Team[]>;
  loadChecklists(forceApi?: boolean): Promise<Checklist[]>;
  getCachedTeams(): Promise<Team[]>;
  getCachedChecklists(): Promise<Checklist[]>;
  getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>>;
  createUser(input: { name: string; email: string; password: string; role: UserRole }): Promise<User>;
  updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole }>
  ): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  getCollaborators(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Collaborator>>;
  createCollaborator(input: { name: string; active: boolean }): Promise<Collaborator>;
  updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Collaborator>;
  deleteCollaborator(collaboratorId: string): Promise<void>;

  createTeam(input: { name: string; active: boolean; collaboratorIds?: string[] }): Promise<Team>;
  updateTeam(
    teamId: string,
    input: Partial<{ name: string; active: boolean; collaboratorIds?: string[] }>
  ): Promise<Team>;
  deleteTeam(teamId: string): Promise<void>;

  getChecklists(params?: {
    module?: ModuleType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>>;
  createChecklist(input: {
    module: ModuleType;
    name: string;
    description?: string;
    active: boolean;
  }): Promise<Checklist>;
  updateChecklist(
    checklistId: string,
    input: Partial<{ name: string; description?: string; active: boolean }>
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

  getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Inspection>>;
  getMyInspections(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Inspection>>;
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
    collaboratorIds?: string[];
    serviceDescription: string;
    locationDescription: string;
    createdByUserId: string;
  }): Promise<Inspection>;
  getInspection(externalId: string, forceApi?: boolean): Promise<Inspection | null>;
  listInspections(): Promise<Inspection[]>;
  listInspectionsByUser(userId: string): Promise<Inspection[]>;
  listPendingAdjustments(): Promise<Inspection[]>;
  updateInspection(externalId: string, updates: Partial<Inspection>): Promise<Inspection>;
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
  resolvePendingInspection(
    externalId: string,
    options: {
      resolutionNotes?: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<Inspection>;
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

  syncAll(): Promise<SyncInspectionResult[]>;
  countPendingSync(): Promise<number>;
}
