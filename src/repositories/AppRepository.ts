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
  Signature,
  SyncInspectionResult,
  Team,
  User,
} from "@/domain";
import { SyncState, UserRole } from "@/domain/enums";
import { OfflineRepository } from "@/offline/repositories/OfflineRepository";
import { SyncService } from "@/offline/sync/SyncService";
import { OFFLINE_RETENTION_DAYS } from "@/offline/constants";
import { IAppRepository } from "./IAppRepository";

function nowIso(): string {
  return new Date().toISOString();
}

/** Normaliza inspeção vinda da API: serverId (id interno), externalId e itens. */
function normalizeInspectionFromApi(inspection: Inspection, externalId: string): Inspection {
  const apiInspection = inspection as Inspection & { id?: string };
  const serverId = apiInspection.id ?? inspection.serverId;
  const items = inspection.items?.map((item) => ({
    ...item,
    inspectionExternalId: item.inspectionExternalId ?? externalId,
  }));
  return {
    ...inspection,
    serverId,
    items: items ?? inspection.items,
  };
}

export class AppRepository implements IAppRepository {
  private readonly offlineRepository = new OfflineRepository();
  private readonly apiRepository = new ApiRepository();
  private readonly syncService = new SyncService(
    this.offlineRepository,
    this.apiRepository
  );

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

  async loadTeams(forceApi = false): Promise<Team[]> {
    if (!navigator.onLine && !forceApi) {
      return this.offlineRepository.getTeams();
    }
    try {
      const result = await this.apiRepository.getTeams({ page: 1, limit: 100 });
      await this.offlineRepository.cacheTeams(result.data);
      return result.data;
    } catch {
      return this.offlineRepository.getTeams();
    }
  }

  async loadChecklists(forceApi = false): Promise<Checklist[]> {
    if (!navigator.onLine && !forceApi) {
      return this.offlineRepository.getChecklists();
    }
    try {
      const result = await this.apiRepository.getChecklists({ page: 1, limit: 100 });
      await this.offlineRepository.cacheChecklists(result.data);
      return result.data;
    } catch {
      return this.offlineRepository.getChecklists();
    }
  }

  async getCachedTeams(): Promise<Team[]> {
    return this.offlineRepository.getTeams();
  }

  async getCachedChecklists(): Promise<Checklist[]> {
    return this.offlineRepository.getChecklists();
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

  async getCollaborators(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Collaborator>> {
    return this.apiRepository.getCollaborators(params);
  }

  async createCollaborator(input: { name: string; active: boolean }): Promise<Collaborator> {
    return this.apiRepository.createCollaborator(input);
  }

  async updateCollaborator(
    collaboratorId: string,
    input: Partial<{ name: string; active: boolean }>
  ): Promise<Collaborator> {
    return this.apiRepository.updateCollaborator(collaboratorId, input);
  }

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    return this.apiRepository.deleteCollaborator(collaboratorId);
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
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Checklist>> {
    return this.apiRepository.getChecklists(params);
  }

  async createChecklist(input: {
    module: ModuleType;
    name: string;
    description?: string;
    active: boolean;
  }): Promise<Checklist> {
    const checklist = await this.apiRepository.createChecklist(input);
    await this.loadChecklists(true);
    return checklist;
  }

  async updateChecklist(
    checklistId: string,
    input: Partial<{ name: string; description?: string; active: boolean }>
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

  async getInspections(params?: {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Inspection>> {
    return this.apiRepository.getInspections(params);
  }

  async getMyInspections(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Inspection>> {
    return this.apiRepository.getMyInspections(params);
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
    collaboratorIds?: string[];
    serviceDescription: string;
    locationDescription: string;
    createdByUserId: string;
  }): Promise<Inspection> {
    const inspection: Inspection = {
      externalId: crypto.randomUUID(),
      module: input.module,
      checklistId: input.checklistId,
      teamId: input.teamId,
      collaboratorIds: input.collaboratorIds,
      serviceDescription: input.serviceDescription,
      locationDescription: input.locationDescription,
      status: InspectionStatus.RASCUNHO,
      syncState: SyncState.PENDING_SYNC,
      createdByUserId: input.createdByUserId,
      createdOffline: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return this.offlineRepository.createInspection(inspection);
  }

  async getInspection(externalId: string, forceApi = false): Promise<Inspection | null> {
    if (forceApi && navigator.onLine) {
      try {
        const inspection = await this.apiRepository.getInspection(externalId);
        return normalizeInspectionFromApi(inspection, externalId);
      } catch {
        return null;
      }
    }
    const local = await this.offlineRepository.getInspectionByExternalId(externalId);
    if (local) {
      const items = await this.offlineRepository.getInspectionItems(externalId);
      return { ...local, items: items.length > 0 ? items : local.items };
    }
    if (navigator.onLine) {
      try {
        const inspection = await this.apiRepository.getInspection(externalId);
        return normalizeInspectionFromApi(inspection, externalId);
      } catch {
        return null;
      }
    }
    return null;
  }

  async listInspections(): Promise<Inspection[]> {
    return this.offlineRepository.listInspections();
  }

  async listInspectionsByUser(userId: string): Promise<Inspection[]> {
    return this.offlineRepository.listInspectionsByUser(userId);
  }

  /** Lista para FISCAL: quando online, une API + local (rascunhos não sincronizados aparecem). */
  async listInspectionsForFiscal(userId: string): Promise<Inspection[]> {
    if (!navigator.onLine) {
      return this.offlineRepository.listInspectionsByUser(userId);
    }
    const [apiRes, local] = await Promise.all([
      this.apiRepository.getMyInspections({ page: 1, limit: 500 }).catch(() => ({ data: [] as Inspection[] })),
      this.offlineRepository.listInspectionsByUser(userId),
    ]);
    const apiList = apiRes.data ?? [];
    const byExternalId = new Map<string, Inspection>();
    for (const i of apiList) byExternalId.set(i.externalId, i);
    for (const i of local) byExternalId.set(i.externalId, i);
    return Array.from(byExternalId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async listPendingAdjustments(): Promise<Inspection[]> {
    return this.offlineRepository.listPendingAdjustments();
  }

  async updateInspection(externalId: string, updates: Partial<Inspection>): Promise<Inspection> {
    return this.offlineRepository.updateInspection(externalId, {
      ...updates,
      syncState: SyncState.PENDING_SYNC,
    });
  }

  async resolvePendingInspection(
    externalId: string,
    options: {
      resolutionNotes?: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<Inspection> {
    if (navigator.onLine) {
      const evidence =
        options.resolutionEvidenceUrl ?? options.resolutionEvidenceBase64;
      const resolved = await this.apiRepository.resolveInspection(externalId, {
        resolutionNotes: options.resolutionNotes,
        resolutionEvidence: evidence,
      });
      try {
        await this.offlineRepository.updateInspection(externalId, {
          status: InspectionStatus.RESOLVIDA,
          pendingResolutionNotes: options.resolutionNotes,
          syncState: SyncState.SYNCED,
          updatedAt: resolved.updatedAt ?? new Date().toISOString(),
        });
      } catch {
        // Inspection may not exist locally (e.g. admin only saw it from API list)
      }
      return resolved;
    }
    return this.offlineRepository.updateInspection(externalId, {
      status: InspectionStatus.RESOLVIDA,
      pendingResolutionNotes: options.resolutionNotes,
      syncState: SyncState.PENDING_SYNC,
    });
  }

  /** Resolve um item não conforme. Só disponível online. Use inspection.serverId na URL (id interno da API). */
  async resolveInspectionItem(
    inspectionServerId: string,
    itemId: string,
    options: {
      resolutionNotes: string;
      resolutionEvidenceUrl?: string;
      resolutionEvidenceBase64?: string;
    }
  ): Promise<InspectionItem> {
    if (!navigator.onLine) {
      throw new Error("Resolução por item está disponível apenas online.");
    }
    const evidence =
      options.resolutionEvidenceUrl ?? options.resolutionEvidenceBase64;
    return this.apiRepository.resolveInspectionItem(inspectionServerId, itemId, {
      resolutionNotes: options.resolutionNotes,
      resolutionEvidence: evidence,
    });
  }

  async setInspectionItems(externalId: string, items: InspectionItem[]): Promise<void> {
    await this.offlineRepository.replaceInspectionItems(externalId, items);
    await this.offlineRepository.updateInspection(externalId, {
      syncState: SyncState.PENDING_SYNC,
    });
  }

  async getInspectionItems(externalId: string): Promise<InspectionItem[]> {
    return this.offlineRepository.getInspectionItems(externalId);
  }

  async saveEvidence(evidence: Evidence): Promise<Evidence> {
    const saved = await this.offlineRepository.saveEvidence(evidence);
    await this.offlineRepository.updateInspection(evidence.inspectionExternalId, {
      syncState: SyncState.PENDING_SYNC,
    });
    return saved;
  }

  async removeEvidence(evidenceId: string): Promise<void> {
    await this.offlineRepository.deleteEvidence(evidenceId);
  }

  async getEvidences(externalId: string): Promise<Evidence[]> {
    return this.offlineRepository.getEvidences(externalId);
  }

  async saveSignature(signature: Signature): Promise<Signature> {
    const saved = await this.offlineRepository.saveSignature(signature);
    await this.offlineRepository.updateInspection(signature.inspectionExternalId, {
      syncState: SyncState.PENDING_SYNC,
    });
    return saved;
  }

  async getSignature(externalId: string): Promise<Signature | null> {
    return this.offlineRepository.getSignature(externalId);
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

  async syncAll(): Promise<SyncInspectionResult[]> {
    return this.syncService.syncAll();
  }

  async countPendingSync(): Promise<number> {
    const inspections = await this.offlineRepository.getInspectionsToSync();
    return inspections.length;
  }

  /** Remove vistorias já sincronizadas mais antigas que OFFLINE_RETENTION_DAYS. Chamado na abertura do app. */
  async runRetentionCleanup(): Promise<number> {
    return this.offlineRepository.purgeSyncedOlderThanDays(OFFLINE_RETENTION_DAYS);
  }
}

export const appRepository = new AppRepository();
