import { ApiRepository } from "@/api/repositories/ApiRepository";
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
} from "@/domain";
import { UserRole } from "@/domain/enums";
import { IAppRepository } from "./IAppRepository";

/** Normaliza inspeção vinda da API: serverId (id interno), externalId e itens. */
function normalizeInspectionFromApi(inspection: Inspection & { id?: string }, externalId: string): Inspection {
  const serverId = inspection.id ?? inspection.serverId;
  const routeId = externalId || inspection.externalId || (inspection as { id?: string }).id || "";
  const items = inspection.items?.map((item) => ({
    ...item,
    inspectionExternalId: item.inspectionExternalId ?? routeId,
  }));
  return {
    ...inspection,
    externalId: routeId,
    serverId,
    items: items ?? inspection.items,
  };
}

/** Garante externalId preenchido (id da API como fallback) para itens de listagem. */
function normalizeInspectionListItem(inspection: Inspection & { id?: string }): Inspection {
  const routeId = inspection.externalId ?? inspection.id ?? "";
  return normalizeInspectionFromApi(inspection, routeId);
}

export class AppRepository implements IAppRepository {
  private readonly apiRepository = new ApiRepository();

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.apiRepository.login(email, password);
    localStorage.setItem("auth_token", data.accessToken);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    return { token: data.accessToken, user: data.user };
  }

  async me(): Promise<User> {
    const user = await this.apiRepository.me();
    localStorage.setItem("auth_user", JSON.stringify(user));
    return user;
  }

  logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }

  async loadTeams(_forceApi = false): Promise<Team[]> {
    const result = await this.apiRepository.getTeams({ page: 1, limit: 100 });
    return result.data;
  }

  async loadSectors(_forceApi = false): Promise<Sector[]> {
    const result = await this.apiRepository.getSectors({ page: 1, limit: 100 });
    return result.data;
  }

  async loadChecklists(_forceApi = false): Promise<Checklist[]> {
    const result = await this.apiRepository.getChecklists({ page: 1, limit: 100 });
    return result.data;
  }

  async getCachedTeams(): Promise<Team[]> {
    return this.loadTeams();
  }

  async getCachedSectors(): Promise<Sector[]> {
    return this.loadSectors();
  }

  async getCachedChecklists(): Promise<Checklist[]> {
    return this.loadChecklists();
  }

  async getUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    return this.apiRepository.getUsers(params);
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<User> {
    return this.apiRepository.createUser(input);
  }

  async updateUser(
    userId: string,
    input: Partial<{ name: string; email: string; password: string; role: UserRole }>
  ): Promise<User> {
    return this.apiRepository.updateUser(userId, input);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.apiRepository.deleteUser(userId);
  }

  async getCollaborators(params?: {
    page?: number;
    limit?: number;
    sectorId?: string;
  }): Promise<PaginatedResponse<Collaborator>> {
    return this.apiRepository.getCollaborators(params);
  }

  async createCollaborator(input: { name: string; sectorId: string; active: boolean }): Promise<Collaborator> {
    return this.apiRepository.createCollaborator(input);
  }

  async updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; sectorId: string; active: boolean }>
  ): Promise<Collaborator> {
    return this.apiRepository.updateCollaborator(collaboratorId, input);
  }

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    return this.apiRepository.deleteCollaborator(collaboratorId);
  }

  async createSector(input: { name: string; active: boolean }): Promise<Sector> {
    const sector = await this.apiRepository.createSector(input);
    await this.loadSectors(true);
    return sector;
  }

  async updateSector(
    sectorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Sector> {
    const sector = await this.apiRepository.updateSector(sectorId, input);
    await this.loadSectors(true);
    return sector;
  }

  async deleteSector(sectorId: string): Promise<void> {
    await this.apiRepository.deleteSector(sectorId);
    await this.loadSectors(true);
  }

  async createTeam(input: { name: string; active: boolean; collaboratorIds?: string[] }): Promise<Team> {
    const team = await this.apiRepository.createTeam(input);
    await this.loadTeams(true);
    return team;
  }

  async updateTeam(
    teamId: string,
    input: Partial<{ name: string; active: boolean; collaboratorIds?: string[] }>
  ): Promise<Team> {
    const team = await this.apiRepository.updateTeam(teamId, input);
    await this.loadTeams(true);
    return team;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.apiRepository.deleteTeam(teamId);
    await this.loadTeams(true);
  }

  async getChecklists(params?: {
    module?: ModuleType;
    sectorId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>> {
    return this.apiRepository.getChecklists(params);
  }

  async createChecklist(input: {
    module: ModuleType;
    name: string;
    description?: string;
    sectorId: string;
    active: boolean;
  }): Promise<Checklist> {
    const checklist = await this.apiRepository.createChecklist(input);
    await this.loadChecklists(true);
    return checklist;
  }

  async updateChecklist(
    checklistId: string,
    input: Partial<{ name: string; description?: string; sectorId: string; active: boolean }>
  ): Promise<Checklist> {
    const checklist = await this.apiRepository.updateChecklist(checklistId, input);
    await this.loadChecklists(true);
    return checklist;
  }

  async deleteChecklist(checklistId: string): Promise<void> {
    await this.apiRepository.deleteChecklist(checklistId);
    await this.loadChecklists(true);
  }

  async createChecklistSection(
    checklistId: string,
    input: { name: string; order: number; active: boolean }
  ): Promise<void> {
    await this.apiRepository.createChecklistSection(checklistId, input);
    await this.loadChecklists(true);
  }

  async updateChecklistSection(
    checklistId: string,
    sectionId: string,
    input: Partial<{ name: string; order: number; active: boolean }>
  ): Promise<void> {
    await this.apiRepository.updateChecklistSection(checklistId, sectionId, input);
    await this.loadChecklists(true);
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
    const item = await this.apiRepository.createChecklistItem(checklistId, input);
    await this.loadChecklists(true);
    return item;
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
    const item = await this.apiRepository.updateChecklistItem(checklistId, itemId, input);
    await this.loadChecklists(true);
    return item;
  }

  async deleteChecklistItem(checklistId: string, itemId: string): Promise<void> {
    await this.apiRepository.deleteChecklistItem(checklistId, itemId);
    await this.loadChecklists(true);
  }

  async getServiceOrders(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
    sectorId?: string;
  }): Promise<PaginatedResponse<ServiceOrder>> {
    return this.apiRepository.getServiceOrders(params);
  }

  async importServiceOrders(file: File): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    return this.apiRepository.importServiceOrders(file);
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
    const res = await this.apiRepository.getInspections(params);
    return {
      ...res,
      data: res.data.map((i) => normalizeInspectionListItem(i as Inspection & { id?: string })),
    };
  }

  async getMyInspections(params?: {
    page?: number;
    limit?: number;
    osNumber?: string;
  }): Promise<PaginatedResponse<Inspection>> {
    const res = await this.apiRepository.getMyInspections(params);
    return {
      ...res,
      data: res.data.map((i) => normalizeInspectionListItem(i as Inspection & { id?: string })),
    };
  }

  async getDashboardSummary(params?: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }): Promise<{ averagePercent: number; inspectionsCount: number; pendingCount: number }> {
    return this.apiRepository.getDashboardSummary(params);
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
    return this.apiRepository.getDashboardTeamRanking(params);
  }

  async createInspection(input: {
    module: ModuleType;
    teamId: string;
    checklistId: string;
    serviceOrderId: string;
    collaboratorIds?: string[];
    serviceDescription: string;
    locationDescription: string;
    createdByUserId: string;
  }): Promise<Inspection> {
    const created = await this.apiRepository.createInspection({
      module: input.module,
      checklistId: input.checklistId,
      teamId: input.teamId,
      serviceOrderId: input.serviceOrderId,
      collaboratorIds: input.collaboratorIds,
      serviceDescription: input.serviceDescription,
      locationDescription: input.locationDescription,
    });
    const createdWithId = created as Inspection & { id?: string };
    const routeId = createdWithId.externalId ?? createdWithId.id;
    if (!routeId) {
      throw new Error("API retornou vistoria sem id nem externalId");
    }
    return normalizeInspectionFromApi(createdWithId, routeId);
  }

  async finalizeInspection(inspectionId: string): Promise<Inspection> {
    return this.apiRepository.finalizeInspection(inspectionId);
  }

  async getInspectionPdf(inspectionId: string): Promise<Blob> {
    return this.apiRepository.getInspectionPdf(inspectionId);
  }

  async getInspection(externalId: string, _forceApi = false): Promise<Inspection | null> {
    try {
      const inspection = await this.apiRepository.getInspection(externalId);
      return normalizeInspectionFromApi(inspection as Inspection & { id?: string }, externalId);
    } catch {
      return null;
    }
  }

  async listInspections(): Promise<Inspection[]> {
    const res = await this.getInspections({ page: 1, limit: 100 });
    return res.data;
  }

  async listInspectionsByUser(_userId: string): Promise<Inspection[]> {
    const res = await this.getMyInspections({ page: 1, limit: 100 });
    return res.data;
  }

  async listInspectionsForFiscal(userId: string): Promise<Inspection[]> {
    return this.listInspectionsByUser(userId);
  }

  async listPendingAdjustments(): Promise<Inspection[]> {
    const res = await this.getInspections({
      status: InspectionStatus.PENDENTE_AJUSTE,
      page: 1,
      limit: 100,
    });
    return res.data;
  }

  async updateInspection(externalId: string, updates: Partial<Inspection>): Promise<Inspection> {
    const inspection = await this.getInspection(externalId);
    const inspectionId = inspection?.serverId ?? externalId;
    return this.apiRepository.updateInspection(inspectionId, updates);
  }

  async updateInspectionOnline(externalId: string, updates: Partial<Inspection>): Promise<Inspection> {
    return this.updateInspection(externalId, updates);
  }

  async setInspectionItemsOnline(externalId: string, items: InspectionItem[]): Promise<InspectionItem[]> {
    const inspection = await this.getInspection(externalId);
    if (!inspection) throw new Error("Vistoria não encontrada.");
    const inspectionId = inspection.serverId ?? externalId;
    return this.apiRepository.setInspectionItems(
      inspectionId,
      items.map((item) => ({
        inspectionItemId: item.id,
        answer: item.answer,
        notes: item.notes,
      }))
    );
  }

  async addInspectionEvidenceOnline(
    inspectionId: string,
    inspectionExternalId: string,
    file: File,
    inspectionItemId?: string
  ): Promise<Evidence> {
    const created = await this.apiRepository.addInspectionEvidence(inspectionId, file, inspectionItemId);
    return {
      id: created.id,
      inspectionExternalId,
      inspectionItemId: created.inspectionItemId,
      fileName: created.fileName,
      mimeType: created.mimeType,
      cloudinaryPublicId: created.cloudinaryPublicId,
      url: created.url,
      size: created.bytes,
      bytes: created.bytes,
      format: created.format,
      width: created.width,
      height: created.height,
      createdAt: created.createdAt,
    };
  }

  async resolvePendingInspection(
    externalId: string,
    options: {
      resolutionNotes?: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<Inspection> {
    const evidence = options.resolutionEvidenceUrl ?? options.resolutionEvidenceBase64;
    return this.apiRepository.resolveInspection(externalId, {
      resolutionNotes: options.resolutionNotes,
      resolutionEvidence: evidence,
    });
  }

  async paralyzeInspection(id: string, reason: string): Promise<Inspection> {
    return this.apiRepository.paralyzeInspection(id, reason);
  }

  async unparalyzeInspection(id: string): Promise<Inspection> {
    return this.apiRepository.unparalyzeInspection(id);
  }

  async resolveInspectionItem(
    inspectionServerId: string,
    itemId: string,
    options: {
      resolutionNotes: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<InspectionItem> {
    const evidence = options.resolutionEvidenceUrl ?? options.resolutionEvidenceBase64;
    return this.apiRepository.resolveInspectionItem(inspectionServerId, itemId, {
      resolutionNotes: options.resolutionNotes,
      resolutionEvidence: evidence,
    });
  }

  async setInspectionItems(externalId: string, items: InspectionItem[]): Promise<void> {
    const inspection = await this.getInspection(externalId);
    if (!inspection) throw new Error("Vistoria não encontrada.");
    const inspectionId = inspection.serverId ?? externalId;
    await this.apiRepository.setInspectionItems(
      inspectionId,
      items.map((item) => ({
        inspectionItemId: item.id,
        answer: item.answer,
        notes: item.notes,
      }))
    );
  }

  async getInspectionItems(externalId: string): Promise<InspectionItem[]> {
    const inspection = await this.getInspection(externalId);
    return inspection?.items ?? [];
  }

  async saveEvidence(evidence: Evidence): Promise<Evidence> {
    if (evidence.cloudinaryPublicId && evidence.url) {
      return evidence;
    }
    if (evidence.dataUrl) {
      const res = await fetch(evidence.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], evidence.fileName, { type: evidence.mimeType });
      const inspectionId = (await this.getInspection(evidence.inspectionExternalId))?.serverId ?? evidence.inspectionExternalId;
      const created = await this.apiRepository.addInspectionEvidence(
        inspectionId,
        file,
        evidence.inspectionItemId
      );
      return {
        ...evidence,
        id: created.id,
        cloudinaryPublicId: created.cloudinaryPublicId,
        url: created.url,
        bytes: created.bytes,
        format: created.format,
        width: created.width,
        height: created.height,
      };
    }
    throw new Error("Evidência sem dados para upload (dataUrl ou cloudinaryPublicId).");
  }

  async removeEvidence(_evidenceId: string): Promise<void> {
    // TODO: Backend não possui endpoint de remoção de evidência; remoção é apenas local.
  }

  async getEvidences(externalId: string): Promise<Evidence[]> {
    const inspection = await this.getInspection(externalId);
    const list = inspection?.evidences ?? [];
    return list.map((e) => ({
      ...e,
      inspectionExternalId: e.inspectionExternalId ?? externalId,
    }));
  }

  async saveSignature(signature: Signature): Promise<Signature> {
    const inspectionId = signature.inspectionExternalId;
    let imageBase64 = "";
    if (signature.dataUrl?.startsWith("data:")) {
      imageBase64 = signature.dataUrl.split(",")[1] ?? "";
    } else if (signature.url) {
      const res = await fetch(signature.url);
      const blob = await res.blob();
      const reader = new FileReader();
      imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string)?.split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    if (!imageBase64) throw new Error("Assinatura sem imagem (dataUrl ou url).");
    const result = await this.apiRepository.addInspectionSignature(
      inspectionId,
      signature.signerName,
      imageBase64
    );
    return {
      id: result.id,
      inspectionExternalId: signature.inspectionExternalId,
      signerName: result.signerName,
      signerRoleLabel: result.signerRoleLabel,
      cloudinaryPublicId: result.cloudinaryPublicId,
      url: result.url,
      signedAt: result.signedAt,
    };
  }

  async getSignature(externalId: string): Promise<Signature | null> {
    const inspection = await this.getInspection(externalId);
    const sig = inspection?.signatures?.[0];
    if (!sig) return null;
    return {
      ...sig,
      inspectionExternalId: sig.inspectionExternalId ?? externalId,
    };
  }

  async uploadToCloudinary(
    file: File,
    folder: "quality/evidences" | "quality/signatures" | "evidences" | "signatures" = "quality/evidences"
  ): Promise<{
    publicId: string;
    url: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  }> {
    return this.apiRepository.uploadToCloudinary(file, folder);
  }

  async deleteFromCloudinary(publicId: string): Promise<void> {
    return this.apiRepository.deleteFromCloudinary(publicId);
  }
}

export const appRepository = new AppRepository();
