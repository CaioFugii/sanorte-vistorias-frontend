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
  Team,
  SyncInspectionPayload,
  SyncInspectionResult,
  User,
} from "@/domain";
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

interface SyncApiEvidence {
  /** ID do item no app (opcional). Servidor usa apenas se existir para a vistoria. */
  inspectionItemId?: string;
  /** ID estável do item do checklist; permite ao servidor resolver o inspection_item correto. */
  checklistItemId?: string;
  cloudinaryPublicId: string;
  url: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}

interface SyncApiItem {
  externalId: string;
  module: ModuleType;
  checklistId: string;
  teamId: string;
  collaboratorIds?: string[];
  serviceDescription: string;
  locationDescription?: string;
  createdOffline: boolean;
  syncedAt?: string;
  items: Array<{
    checklistItemId: string;
    answer?: string;
    notes?: string;
  }>;
  evidences: SyncApiEvidence[];
  signature?: {
    signerName: string;
    cloudinaryPublicId: string;
    url: string;
  };
  finalize: boolean;
}

interface SyncApiResponse {
  results?: Array<{
    externalId: string;
    serverId?: string;
    status: "CREATED" | "UPDATED" | "ERROR";
    message?: string;
  }>;
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

/** Converte dataUrl em File para upload no Cloudinary. */
async function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: mimeType });
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

  async getCollaborators(params?: {
    page?: number;
    limit?: number;
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

  async createCollaborator(input: { name: string; active: boolean }): Promise<Collaborator> {
    const response = await apiClient.post<Collaborator>("/collaborators", input);
    return response.data;
  }

  async updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Collaborator> {
    const response = await apiClient.put<Collaborator>(`/collaborators/${collaboratorId}`, input);
    return response.data;
  }

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    await apiClient.delete(`/collaborators/${collaboratorId}`);
  }

  async getChecklists(params?: {
    module?: ModuleType;
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
    active: boolean;
  }): Promise<Checklist> {
    const response = await apiClient.post<Checklist>("/checklists", input);
    return normalizeChecklistSections(response.data);
  }

  async updateChecklist(
    checklistId: string,
    input: Partial<{ name: string; description?: string; active: boolean }>
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

  async getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Inspection>> {
    const response = await apiClient.get<PaginatedResponse<Inspection>>("/inspections", { params });
    return response.data;
  }

  async getMyInspections(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Inspection>> {
    const response = await apiClient.get<PaginatedResponse<Inspection>>("/inspections/mine", { params });
    return response.data;
  }

  async getInspection(id: string): Promise<Inspection> {
    const response = await apiClient.get<Inspection>(`/inspections/${id}`);
    return response.data;
  }

  async resolveInspection(
    id: string,
    body: { resolutionNotes?: string; resolutionEvidence?: string }
  ): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(`/inspections/${id}/resolve`, body);
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
    }>
  > {
    const response = await apiClient.get<
      Array<{
        teamId: string;
        teamName: string;
        averagePercent: number;
        inspectionsCount: number;
        pendingCount: number;
      }>
    >("/dashboards/ranking/teams", { params });
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

  async syncInspections(payload: SyncInspectionPayload[]): Promise<SyncInspectionResult[]> {
    const inspections: SyncApiItem[] = [];

    for (const entry of payload) {
      const inspection = entry.inspection;
      const evidences: SyncApiEvidence[] = [];

      for (const evidence of entry.evidences) {
        let publicId = evidence.cloudinaryPublicId;
        let url = evidence.url;
        let size = evidence.size ?? evidence.bytes ?? 0;
        let bytes = evidence.bytes;
        let format = evidence.format;
        let width = evidence.width;
        let height = evidence.height;

        if ((!publicId || !url) && evidence.dataUrl) {
          const file = await dataUrlToFile(evidence.dataUrl, evidence.fileName, evidence.mimeType);
          const result = await this.uploadToCloudinary(file, "quality/evidences");
          publicId = result.publicId;
          url = result.url;
          size = result.bytes;
          bytes = result.bytes;
          format = result.format;
          width = result.width;
          height = result.height;
        }

        if (!publicId || !url) {
          throw new Error("Evidência sem upload no Cloudinary. Faça upload antes de sincronizar.");
        }
        const item = evidence.inspectionItemId
          ? entry.inspectionItems.find((i) => i.id === evidence.inspectionItemId)
          : undefined;
        evidences.push({
          inspectionItemId: evidence.inspectionItemId,
          checklistItemId: item?.checklistItemId,
          cloudinaryPublicId: publicId,
          url,
          filePath: url,
          fileName: evidence.fileName,
          mimeType: evidence.mimeType,
          size,
          bytes,
          format,
          width,
          height,
        });
      }

      let signaturePayload: { signerName: string; cloudinaryPublicId: string; url: string } | undefined;
      if (entry.signature) {
        const sig = entry.signature;
        let publicId = sig.cloudinaryPublicId;
        let url = sig.url;

        if ((!publicId || !url) && sig.dataUrl) {
          const file = await dataUrlToFile(sig.dataUrl, "signature.png", "image/png");
          const result = await this.uploadToCloudinary(file, "quality/signatures");
          publicId = result.publicId;
          url = result.url;
        }

        if (!publicId || !url) {
          throw new Error("Assinatura sem upload no Cloudinary. Faça upload antes de sincronizar.");
        }
        signaturePayload = {
          signerName: sig.signerName,
          cloudinaryPublicId: publicId,
          url,
        };
      }

      inspections.push({
        externalId: inspection.externalId,
        module: inspection.module ?? ModuleType.QUALIDADE,
        checklistId: inspection.checklistId,
        teamId: inspection.teamId,
        collaboratorIds: inspection.collaboratorIds,
        serviceDescription: inspection.serviceDescription,
        locationDescription: inspection.locationDescription,
        createdOffline: inspection.createdOffline,
        syncedAt: inspection.syncedAt,
        items: entry.inspectionItems.map((item) => ({
          checklistItemId: item.checklistItemId,
          answer: item.answer,
          notes: item.notes,
        })),
        evidences,
        signature: signaturePayload,
        finalize: inspection.status !== "RASCUNHO",
      });
    }

    const response = await apiClient.post<SyncApiResponse>(
      "/sync/inspections",
      { inspections }
    );
    return (response.data.results || []).map((result) => ({
      externalId: result.externalId,
      serverId: result.serverId,
      status: result.status,
      message: result.message,
    }));
  }
}
