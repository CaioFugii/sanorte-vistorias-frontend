import {
  AuthLoginResponse,
  Checklist,
  ChecklistItem,
  Collaborator,
  Contract,
  Inspection,
  InspectionListItem,
  InspectionScope,
  InspectionItem,
  InspectionStatus,
  ModuleType,
  PaginatedResponse,
  Sector,
  ServiceOrder,
  Team,
  User,
  ReportFileReference,
  ReportRecord,
  ReportType,
  ReportTypeField,
} from "@/domain";

export interface ServiceOrdersParams {
  page?: number;
  limit?: number;
  osNumber?: string;
  sectorId?: string;
  contractId?: string;
  periodFrom?: string;
  periodTo?: string;
  /** Filtra OS já usadas em vistoria CAMPO */
  field?: boolean;
  /** Filtra OS já usadas em vistoria REMOTO */
  remote?: boolean;
  /** Filtra OS já usadas em vistoria POS_OBRA */
  postWork?: boolean;
}
import { apiClient } from "../apiClient";
import { UserRole } from "@/domain/enums";

/** Resposta do POST /uploads (Cloudinary). */
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  resourceType: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
}

function normalizeChecklistSections(checklist: Checklist): Checklist {
  const sectionItemsById = new Map<string, ChecklistItem[]>();

  for (const item of checklist.items || []) {
    if (!sectionItemsById.has(item.sectionId)) {
      sectionItemsById.set(item.sectionId, []);
    }
    sectionItemsById.get(item.sectionId)?.push(item);
  }

  return {
    ...checklist,
    sections: (checklist.sections || []).map((section) => ({
      ...section,
      title: section.title ?? section.name,
      items: [...(section.items || []), ...(sectionItemsById.get(section.id) || [])]
        .filter(
          (item, index, allItems) => allItems.findIndex((existing) => existing.id === item.id) === index
        )
        .sort((a, b) => a.order - b.order),
    })),
  };
}

export class ApiRepository {
  async login(email: string, password: string): Promise<AuthLoginResponse> {
    const response = await apiClient.post<AuthLoginResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async me(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  }

  private unwrapPaginated<T>(data: PaginatedResponse<T> | T[]): T[] {
    return Array.isArray(data) ? data : data.data;
  }

  async getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>("/users", { params });
    return response.data;
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    contractIds: string[];
  }): Promise<User> {
    const response = await apiClient.post<User>("/users", input);
    return response.data;
  }

  async updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole; contractIds: string[] }>
  ): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}`, input);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  async getContracts(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Contract>> {
    const response = await apiClient.get<PaginatedResponse<Contract> | Contract[]>("/contracts", { params });
    const data = this.unwrapPaginated(response.data);
    if (Array.isArray(response.data)) {
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return response.data;
  }

  async getContract(contractId: string): Promise<Contract> {
    const response = await apiClient.get<Contract>(`/contracts/${contractId}`);
    return response.data;
  }

  async createContract(input: { name: string }): Promise<Contract> {
    const response = await apiClient.post<Contract>("/contracts", input);
    return response.data;
  }

  async updateContract(contractId: string, input: Partial<{ name: string }>): Promise<Contract> {
    const response = await apiClient.put<Contract>(`/contracts/${contractId}`, input);
    return response.data;
  }

  async deleteContract(contractId: string): Promise<void> {
    await apiClient.delete(`/contracts/${contractId}`);
  }


  async getTeams(params?: {
    page?: number;
    limit?: number;
    name?: string;
    contractId?: string;
  }): Promise<PaginatedResponse<Team>> {
    const response = await apiClient.get<PaginatedResponse<Team> | Team[]>("/teams", { params });
    const data = this.unwrapPaginated(response.data);
    if (Array.isArray(response.data)) {
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return response.data;
  }

  async createTeam(input: {
    name: string;
    active: boolean;
    isContractor?: boolean;
    collaboratorIds?: string[];
    contractIds: string[];
  }): Promise<Team> {
    const response = await apiClient.post<Team>("/teams", input);
    return response.data;
  }

  async updateTeam(
    teamId: string,
    input: Partial<{ name: string; active: boolean; isContractor: boolean; collaboratorIds?: string[]; contractIds: string[] }>
  ): Promise<Team> {
    const response = await apiClient.put<Team>(`/teams/${teamId}`, input);
    return response.data;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await apiClient.delete(`/teams/${teamId}`);
  }

  async getSectors(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Sector>> {
    const response = await apiClient.get<PaginatedResponse<Sector> | Sector[]>("/sectors", { params });
    const data = this.unwrapPaginated(response.data);
    if (Array.isArray(response.data)) {
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return response.data;
  }

  async createSector(input: { name: string; active: boolean }): Promise<Sector> {
    const response = await apiClient.post<Sector>("/sectors", input);
    return response.data;
  }

  async updateSector(
    sectorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Sector> {
    const response = await apiClient.put<Sector>(`/sectors/${sectorId}`, input);
    return response.data;
  }

  async deleteSector(sectorId: string): Promise<void> {
    await apiClient.delete(`/sectors/${sectorId}`);
  }

  async getCollaborators(params?: {
    page?: number;
    limit?: number;
    name?: string;
    sectorId?: string;
    contractId?: string;
  }): Promise<PaginatedResponse<Collaborator>> {
    const response = await apiClient.get<PaginatedResponse<Collaborator> | Collaborator[]>(
      "/collaborators",
      { params }
    );
    const data = this.unwrapPaginated(response.data);
    if (Array.isArray(response.data)) {
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return response.data;
  }

  async createCollaborator(input: {
    name: string;
    sectorId: string;
    contractId: string;
    active: boolean;
  }): Promise<Collaborator> {
    const response = await apiClient.post<Collaborator>("/collaborators", input);
    return response.data;
  }

  async updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; sectorId: string; contractId: string; active: boolean }>
  ): Promise<Collaborator> {
    const response = await apiClient.put<Collaborator>(`/collaborators/${collaboratorId}`, input);
    return response.data;
  }

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    await apiClient.delete(`/collaborators/${collaboratorId}`);
  }

  async getChecklists(params?: {
    module?: ModuleType;
    inspectionScope?: InspectionScope;
    sectorId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>> {
    const response = await apiClient.get<PaginatedResponse<Checklist> | Checklist[]>(
      "/checklists",
      {
        params,
      }
    );
    const data = this.unwrapPaginated(response.data).map(normalizeChecklistSections);
    if (Array.isArray(response.data)) {
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return { ...response.data, data };
  }

  async createChecklist(input: {
    module: ModuleType;
    inspectionScope?: InspectionScope;
    name: string;
    description?: string;
    sectorId: string;
    active: boolean;
  }): Promise<Checklist> {
    const response = await apiClient.post<Checklist>("/checklists", input);
    return normalizeChecklistSections(response.data);
  }

  async updateChecklist(
    checklistId: string,
    input: Partial<{
      module: ModuleType;
      inspectionScope?: InspectionScope;
      name: string;
      description?: string;
      sectorId: string;
      active: boolean;
    }>
  ): Promise<Checklist> {
    const response = await apiClient.put<Checklist>(`/checklists/${checklistId}`, input);
    return normalizeChecklistSections(response.data);
  }

  async deleteChecklist(checklistId: string): Promise<void> {
    await apiClient.delete(`/checklists/${checklistId}`);
  }

  async createChecklistSection(
    checklistId: string,
    input: { name: string; order: number; active: boolean }
  ): Promise<void> {
    await apiClient.post(`/checklists/${checklistId}/sections`, input);
  }

  async updateChecklistSection(
    checklistId: string,
    sectionId: string,
    input: Partial<{ name: string; order: number; active: boolean }>
  ): Promise<void> {
    await apiClient.put(`/checklists/${checklistId}/sections/${sectionId}`, input);
  }

  async createChecklistItem(
    checklistId: string,
    input: {
      title: string;
      description?: string;
      order: number;
      sectionId: string;
      requiresPhotoOnNonConformity: boolean;
      active: boolean;
    }
  ): Promise<ChecklistItem> {
    const response = await apiClient.post<ChecklistItem>(`/checklists/${checklistId}/items`, input);
    return response.data;
  }

  async updateChecklistItem(
    checklistId: string,
    itemId: string,
    input: Partial<{
      title: string;
      description?: string;
      order: number;
      requiresPhotoOnNonConformity: boolean;
      active: boolean;
    }>
  ): Promise<ChecklistItem> {
    const response = await apiClient.put<ChecklistItem>(`/checklists/${checklistId}/items/${itemId}`, input);
    return response.data;
  }

  async deleteChecklistItem(checklistId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/checklists/${checklistId}/items/${itemId}`);
  }

  async uploadChecklistItemReferenceImage(
    checklistId: string,
    itemId: string,
    file: File
  ): Promise<ChecklistItem> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ChecklistItem>(
      `/checklists/${checklistId}/items/${itemId}/reference-image`,
      formData
    );
    return response.data;
  }

  async getServiceOrders(
    params?: ServiceOrdersParams
  ): Promise<PaginatedResponse<ServiceOrder>> {
    const response = await apiClient.get<PaginatedResponse<ServiceOrder>>(
      "/service-orders",
      { params }
    );
    return response.data;
  }

  async importServiceOrders(file: File, contractId: string): Promise<{
    inserted: number;
    skipped: number;
    deleted: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contractId", contractId);
    const response = await apiClient.post<{
      inserted: number;
      skipped: number;
      deleted: number;
      errors: string[];
    }>("/service-orders/import", formData);
    return response.data;
  }

  async getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    inspectionScope?: InspectionScope;
    teamId?: string;
    status?: InspectionStatus;
    osNumber?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InspectionListItem>> {
    const response = await apiClient.get<PaginatedResponse<InspectionListItem>>("/inspections", { params });
    return response.data;
  }

  async getMyInspections(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
    inspectionScope?: InspectionScope;
  }): Promise<PaginatedResponse<InspectionListItem>> {
    const response = await apiClient.get<PaginatedResponse<InspectionListItem>>("/inspections/mine", { params });
    return response.data;
  }

  async getInspection(id: string): Promise<Inspection> {
    const response = await apiClient.get<Inspection>(`/inspections/${id}`);
    return response.data;
  }

  async getReportTypes(): Promise<ReportType[]> {
    const response = await apiClient.get<ReportType[]>("/reports/types");
    return response.data;
  }

  async getReportTypeFields(code: string): Promise<ReportTypeField[]> {
    const response = await apiClient.get<ReportTypeField[]>(`/reports/types/${code}/fields`);
    return response.data;
  }

  async uploadReportFile(
    file: File,
    input: {
      reportTypeCode: string;
      fieldKey: string;
      reportRecordId?: string;
    }
  ): Promise<ReportFileReference> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reportTypeCode", input.reportTypeCode);
    formData.append("fieldKey", input.fieldKey);
    if (input.reportRecordId) {
      formData.append("reportRecordId", input.reportRecordId);
    }
    const response = await apiClient.post<ReportFileReference>("/reports/files", formData);
    return response.data;
  }

  async createReportRecord(input: {
    reportTypeCode: string;
    formData: Record<string, unknown>;
  }): Promise<ReportRecord> {
    const response = await apiClient.post<ReportRecord>("/reports/records", input);
    return response.data;
  }

  async getReportRecord(id: string): Promise<ReportRecord> {
    const response = await apiClient.get<ReportRecord>(`/reports/records/${id}`);
    return response.data;
  }

  async deleteInspection(id: string): Promise<void> {
    await apiClient.delete(`/inspections/${id}`);
  }

  async createInspection(input: {
    module: ModuleType;
    inspectionScope?: InspectionScope;
    checklistId: string;
    teamId?: string;
    serviceOrderId?: string;
    serviceDescription: string;
    locationDescription?: string;
    collaboratorIds?: string[];
    externalId?: string;
    createdOffline?: boolean;
    syncedAt?: string;
  }): Promise<Inspection> {
    const payload: Record<string, unknown> = {
      module: input.module,
      inspectionScope: input.inspectionScope,
      checklistId: input.checklistId,
      serviceDescription: input.serviceDescription,
      locationDescription: input.locationDescription ?? "",
      collaboratorIds: input.collaboratorIds,
    };
    if (input.teamId) payload.teamId = input.teamId;
    if (input.serviceOrderId) payload.serviceOrderId = input.serviceOrderId;
    if (input.externalId) payload.externalId = input.externalId;
    if (input.createdOffline !== undefined) payload.createdOffline = input.createdOffline;
    if (input.syncedAt) payload.syncedAt = input.syncedAt;
    const response = await apiClient.post<Inspection>("/inspections", payload);
    return response.data;
  }

  async addInspectionSignature(
    inspectionId: string,
    signerName: string,
    imageBase64: string
  ): Promise<{
    id: string;
    inspectionId: string;
    signerName: string;
    signerRoleLabel: string;
    imagePath: string;
    cloudinaryPublicId: string;
    url: string;
    signedAt: string;
  }> {
    const response = await apiClient.post(`/inspections/${inspectionId}/signature`, {
      signerName,
      imageBase64,
    });
    return response.data;
  }

  async finalizeInspection(inspectionId: string): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(`/inspections/${inspectionId}/finalize`);
    return response.data;
  }

  async getInspectionPdf(inspectionId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/inspections/${inspectionId}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  }

  async addInspectionEvidence(
    inspectionId: string,
    file: File,
    inspectionItemId?: string
  ): Promise<{
    id: string;
    inspectionId?: string;
    inspectionItemId?: string;
    fileName: string;
    mimeType: string;
    cloudinaryPublicId?: string;
    url?: string;
    bytes?: number;
    format?: string;
    width?: number;
    height?: number;
    createdAt: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    if (inspectionItemId) {
      formData.append("inspectionItemId", inspectionItemId);
    }
    const response = await apiClient.post(`/inspections/${inspectionId}/evidences`, formData);
    return response.data;
  }

  async deleteInspectionEvidence(inspectionId: string, evidenceId: string): Promise<void> {
    await apiClient.delete(`/inspections/${inspectionId}/evidences/${evidenceId}`);
  }

  async updateInspection(id: string, input: Partial<Inspection>): Promise<Inspection> {
    const response = await apiClient.put<Inspection>(`/inspections/${id}`, input);
    return response.data;
  }

  async setInspectionItems(
    id: string,
    items: Array<{ inspectionItemId: string; answer?: string; notes?: string }>
  ): Promise<InspectionItem[]> {
    const response = await apiClient.put<InspectionItem[]>(`/inspections/${id}/items`, items);
    return response.data;
  }

  async resolveInspection(
    id: string,
    body: { resolutionNotes?: string; resolutionEvidence?: string }
  ): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(`/inspections/${id}/resolve`, body);
    return response.data;
  }

  async paralyzeInspection(id: string, reason: string): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(`/inspections/${id}/paralyze`, { reason });
    return response.data;
  }

  async unparalyzeInspection(id: string): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(`/inspections/${id}/unparalyze`);
    return response.data;
  }

  /** Resolve um item não conforme. Quando todos estiverem resolvidos, a vistoria passa a RESOLVIDA. */
  async resolveInspectionItem(
    inspectionId: string,
    itemId: string,
    body: { resolutionNotes: string; resolutionEvidence?: string }
  ): Promise<InspectionItem> {
    const response = await apiClient.post<InspectionItem>(
      `/inspections/${inspectionId}/items/${itemId}/resolve`,
      body
    );
    return response.data;
  }

  async getDashboardSummary(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }): Promise<{ averagePercent: number; inspectionsCount: number; pendingCount: number }> {
    const response = await apiClient.get<{ averagePercent: number; inspectionsCount: number; pendingCount: number }>(
      "/dashboards/summary",
      { params }
    );
    return response.data;
  }

  async getDashboardTeamRanking(params?: {
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
  > {
    const response = await apiClient.get<
      Array<{
        teamId: string;
        teamName: string;
        averagePercent: number;
        inspectionsCount: number;
        pendingCount: number;
        paralyzedCount: number;
        paralysisRatePercent: number;
      }>
    >("/dashboards/ranking/teams", { params });
    return response.data;
  }

  async getDashboardTeam(
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
  }> {
    const response = await apiClient.get<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      pendingCount: number;
      paralyzedCount: number;
      paralysisRatePercent: number;
    }>(`/dashboards/teams/${teamId}`, { params });
    return response.data;
  }

  async getDashboardQualityByService(params: {
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
  }> {
    const response = await apiClient.get<{
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
    }>("/dashboards/quality-by-service", { params });
    return response.data;
  }

  async getDashboardCurrentMonthByService(params?: {
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
  }> {
    const response = await apiClient.get<{
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
    }>("/dashboards/current-month-by-service", { params });
    return response.data;
  }

  async getDashboardNonConformitiesByChecklist(params: {
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
  }> {
    const response = await apiClient.get<{
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
    }>("/dashboards/non-conformities/by-checklist", { params });
    return response.data;
  }

  async getDashboardSafetyWorkLowScoreCollaborators(params: {
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
  }> {
    const response = await apiClient.get<{
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
    }>("/dashboards/safety-work/low-score-collaborators", { params });
    return response.data;
  }

  async getDashboardTeamPerformanceByTeams(params: {
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
  }> {
    const response = await apiClient.get<{
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
    }>("/dashboards/team-performance-by-teams", {
      params: {
        from: params.from,
        to: params.to,
        teamIds: params.teamIds.join(","),
      },
    });
    return response.data;
  }

  /**
   * Upload de imagem para o Cloudinary (POST /uploads).
   * @param file - Arquivo de imagem
   * @param folder - Pasta no Cloudinary: 'quality/evidences' | 'quality/signatures' ou alias 'evidences' | 'signatures'
   */
  async uploadToCloudinary(
    file: File,
    folder: "quality/evidences" | "quality/signatures" | "evidences" | "signatures" = "quality/evidences"
  ): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    const folderValue =
      folder === "evidences" ? "quality/evidences" : folder === "signatures" ? "quality/signatures" : folder;
    formData.append("folder", folderValue);

    const response = await apiClient.post<CloudinaryUploadResult>("/uploads", formData);
    return response.data;
  }

  /**
   * Remove asset do Cloudinary (DELETE /uploads/:publicId).
   * @param publicId - ID público (ex: quality/evidences/abc123); será encodado na URL
   */
  async deleteFromCloudinary(publicId: string): Promise<void> {
    const encoded = encodeURIComponent(publicId);
    await apiClient.delete(`/uploads/${encoded}`);
  }
}
