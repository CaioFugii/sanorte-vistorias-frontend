import {
  Checklist,
  ChecklistItem,
  Collaborator,
  Contract,
  Evidence,
  Inspection,
  InspectionListItem,
  InspectionScope,
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
  ReportType,
  ReportTypeField,
} from "@/domain";

export interface IAppRepository {
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  me(): Promise<User>;
  logout(): void;

  loadTeams(forceApi?: boolean): Promise<Team[]>;
  loadSectors(forceApi?: boolean): Promise<Sector[]>;
  loadChecklists(forceApi?: boolean): Promise<Checklist[]>;
  getTeams(params?: {
    page?: number;
    limit?: number;
    name?: string;
    contractId?: string;
  }): Promise<PaginatedResponse<Team>>;
  getSectors(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Sector>>;
  getCachedTeams(): Promise<Team[]>;
  getCachedSectors(): Promise<Sector[]>;
  getCachedChecklists(): Promise<Checklist[]>;
  getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>>;
  createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    contractIds: string[];
  }): Promise<User>;
  updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole; contractIds: string[] }>
  ): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  getContracts(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Contract>>;
  getContract(contractId: string): Promise<Contract>;
  createContract(input: { name: string }): Promise<Contract>;
  updateContract(contractId: string, input: Partial<{ name: string }>): Promise<Contract>;
  deleteContract(contractId: string): Promise<void>;

  getCollaborators(params?: {
    page?: number;
    limit?: number;
    name?: string;
    sectorId?: string;
    contractId?: string;
  }): Promise<PaginatedResponse<Collaborator>>;
  createCollaborator(input: {
    name: string;
    sectorId: string;
    contractId: string;
    active: boolean;
  }): Promise<Collaborator>;
  updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; sectorId: string; contractId: string; active: boolean }>
  ): Promise<Collaborator>;
  deleteCollaborator(collaboratorId: string): Promise<void>;

  createSector(input: { name: string; active: boolean }): Promise<Sector>;
  updateSector(
    sectorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Sector>;
  deleteSector(sectorId: string): Promise<void>;

  createTeam(input: {
    name: string;
    active: boolean;
    isContractor?: boolean;
    collaboratorIds?: string[];
    contractIds: string[];
  }): Promise<Team>;
  updateTeam(
    teamId: string,
    input: Partial<{
      name: string;
      active: boolean;
      isContractor: boolean;
      collaboratorIds?: string[];
      contractIds: string[];
    }>
  ): Promise<Team>;
  deleteTeam(teamId: string): Promise<void>;

  getChecklists(params?: {
    module?: ModuleType;
    inspectionScope?: InspectionScope;
    sectorId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>>;
  createChecklist(input: {
    module: ModuleType;
    inspectionScope?: InspectionScope;
    name: string;
    description?: string;
    sectorId: string;
    active: boolean;
  }): Promise<Checklist>;
  updateChecklist(
    checklistId: string,
    input: Partial<{
      module: ModuleType;
      inspectionScope?: InspectionScope;
      name: string;
      description?: string;
      sectorId: string;
      active: boolean;
    }>
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
  uploadChecklistItemReferenceImage(
    checklistId: string,
    itemId: string,
    file: File
  ): Promise<ChecklistItem>;

  getServiceOrders(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
    sectorId?: string;
    contractId?: string;
    periodFrom?: string;
    periodTo?: string;
    field?: boolean;
    remote?: boolean;
    postWork?: boolean;
  }): Promise<PaginatedResponse<ServiceOrder>>;
  importServiceOrders(file: File, contractId: string): Promise<{
    inserted: number;
    skipped: number;
    deleted: number;
    errors: string[];
  }>;

  getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    inspectionScope?: InspectionScope;
    teamId?: string;
    status?: InspectionStatus;
    osNumber?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InspectionListItem>>;
  getMyInspections(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
    inspectionScope?: InspectionScope;
  }): Promise<PaginatedResponse<InspectionListItem>>;
  getDashboardSummary(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }): Promise<{ averagePercent: number; inspectionsCount: number; pendingCount: number }>;
  getDashboardTeamRanking(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
    contractId?: string;
  }): Promise<
    Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      pendingCount: number;
      paralyzedCount: number;
      paralysisRatePercent: number;
    }>
  >;
  getDashboardTeam(
    teamId: string,
    params?: { from?: string; to?: string; module?: ModuleType; contractId?: string }
  ): Promise<{
    teamId: string;
    teamName: string;
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
    paralyzedCount: number;
    paralysisRatePercent: number;
  }>;
  getDashboardQualityByService(params: {
    from: string;
    to: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }): Promise<{
    period: string[];
    services: Array<{
      serviceKey: string;
      serviceLabel: string;
      series: Array<{
        month: string;
        qualityPercent: number;
        inspectionsCount: number;
      }>;
      growth: {
        fromMonth: string;
        toMonth: string;
        growthPercent: number;
        deltaPoints: number;
      } | null;
    }>;
  }>;
  getDashboardCurrentMonthByService(params?: {
    month?: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }): Promise<{
    month: string;
    summary: {
      averagePercent: number;
      inspectionsCount: number;
      pendingAdjustmentsCount: number;
    };
    services: Array<{
      serviceKey: string;
      serviceLabel: string;
      qualityPercent: number;
      inspectionsCount: number;
    }>;
  }>;
  getDashboardNonConformitiesByChecklist(params: {
    from: string;
    to: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
    limitPerChecklist?: number;
  }): Promise<{
    from: string;
    to: string;
    module?: ModuleType;
    teamId?: string;
    limitPerChecklist: number;
    checklists: Array<{
      checklistId: string;
      checklistName: string;
      totalNonConformities: number;
      questions: Array<{
        checklistItemId: string;
        checklistItemTitle: string;
        nonConformitiesCount: number;
        answersCount: number;
        nonConformityRatePercent: number;
      }>;
    }>;
  }>;
  getDashboardSafetyWorkLowScoreCollaborators(params: {
    from: string;
    to: string;
    contractId?: string;
    lowScoreThreshold?: number;
    limit?: number;
  }): Promise<{
    from: string;
    to: string;
    lowScoreThreshold: number;
    collaborators: Array<{
      collaboratorId: string;
      collaboratorName: string;
      inspectionsCount: number;
      badScoresCount: number;
      badScoreRatePercent: number;
      averagePercent: number;
      worstScorePercent: number;
      bestScorePercent: number;
    }>;
  }>;
  getDashboardTeamPerformanceByTeams(params: {
    from: string;
    to: string;
    teamIds: string[];
    contractId?: string;
  }): Promise<{
    from: string;
    to: string;
    teamIds: string[];
    summary: {
      averagePercent: number;
      previousAveragePercent: number;
      inspectionsCount: number;
      pendingAdjustmentsCount: number;
    };
    teams: Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      pendingAdjustmentsCount: number;
      collaborators: Array<{
        collaboratorId: string;
        collaboratorName: string;
        qualityPercent: number;
        inspectionsCount: number;
      }>;
    }>;
  }>;

  createInspection(input: {
    module: ModuleType;
    inspectionScope?: InspectionScope;
    teamId?: string;
    checklistId: string;
    serviceOrderId?: string;
    collaboratorIds?: string[];
    serviceDescription: string;
    locationDescription: string;
    createdByUserId: string;
  }): Promise<Inspection>;
  getInspection(externalId: string, forceApi?: boolean): Promise<Inspection | null>;
  deleteInspection(externalId: string): Promise<void>;
  listInspections(): Promise<InspectionListItem[]>;
  listInspectionsByUser(userId: string): Promise<InspectionListItem[]>;
  /** Lista para perfil FISCAL: online = API + local (rascunhos); offline = só local. */
  listInspectionsForFiscal(userId: string): Promise<InspectionListItem[]>;
  listPendingAdjustments(): Promise<InspectionListItem[]>;
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
  removeEvidence(externalId: string, evidenceId: string): Promise<void>;
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

  getReportTypes(): Promise<ReportType[]>;
  getReportTypeFields(code: string): Promise<ReportTypeField[]>;
}
