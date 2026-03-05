import {
  AuthLoginResponse,
  Checklist,
  ChecklistItem,
  Collaborator,
  Inspection,
  InspectionItem,
  InspectionStatus,
  ModuleType,
  PaginatedResponse,
  Sector,
  ServiceOrder,
  Team,
  User,
} from "@/domain";

export interface ServiceOrdersParams {
  page?: number;
  limit?: number;
  osNumber?: string;
  sectorId?: string;
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
  }): Promise<User> {
    const response = await apiClient.post<User>("/users", input);
    return response.data;
  }

  async updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole }>
  ): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}`, input);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  async getTeams(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Team>> {
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

  async createTeam(input: { name: string; active: boolean; collaboratorIds?: string[] }): Promise<Team> {
    const response = await apiClient.post<Team>("/teams", input);
    return response.data;
  }

  async updateTeam(
    teamId: string,
    input: Partial<{ name: string; active: boolean; collaboratorIds?: string[] }>
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
    sectorId?: string;
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

  async createCollaborator(input: { name: string; sectorId: string; active: boolean }): Promise<Collaborator> {
    const response = await apiClient.post<Collaborator>("/collaborators", input);
    return response.data;
  }

  async updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; sectorId: string; active: boolean }>
  ): Promise<Collaborator> {
    const response = await apiClient.put<Collaborator>(`/collaborators/${collaboratorId}`, input);
    return response.data;
  }

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    await apiClient.delete(`/collaborators/${collaboratorId}`);
  }

  async getChecklists(params?: {
    module?: ModuleType;
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
    input: Partial<{ name: string; description?: string; sectorId: string; active: boolean }>
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

  async getServiceOrders(
    params?: ServiceOrdersParams
  ): Promise<PaginatedResponse<ServiceOrder>> {
    const response = await apiClient.get<PaginatedResponse<ServiceOrder>>(
      "/service-orders",
      { params }
    );
    return response.data;
  }

  async importServiceOrders(file: File): Promise<{
    inserted: number;
    skipped: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{
      inserted: number;
      skipped: number;
      errors: string[];
    }>("/service-orders/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
    osNumber?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Inspection>> {
    const response = await apiClient.get<PaginatedResponse<Inspection>>("/inspections", { params });
    return response.data;
  }

  async getMyInspections(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
  }): Promise<PaginatedResponse<Inspection>> {
    const response = await apiClient.get<PaginatedResponse<Inspection>>("/inspections/mine", { params });
    return response.data;
  }

  async getInspection(id: string): Promise<Inspection> {
    const response = await apiClient.get<Inspection>(`/inspections/${id}`);
    return response.data;
  }

  async createInspection(input: {
    module: ModuleType;
    checklistId: string;
    teamId: string;
    serviceOrderId: string;
    serviceDescription: string;
    locationDescription?: string;
    collaboratorIds?: string[];
    externalId?: string;
    createdOffline?: boolean;
    syncedAt?: string;
  }): Promise<Inspection> {
    const payload: Record<string, unknown> = {
      module: input.module,
      checklistId: input.checklistId,
      teamId: input.teamId,
      serviceOrderId: input.serviceOrderId,
      serviceDescription: input.serviceDescription,
      locationDescription: input.locationDescription ?? "",
      collaboratorIds: input.collaboratorIds,
    };
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
    const response = await apiClient.post(`/inspections/${inspectionId}/evidences`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
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
    params?: { from?: string; to?: string; module?: ModuleType }
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

    const response = await apiClient.post<CloudinaryUploadResult>("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
