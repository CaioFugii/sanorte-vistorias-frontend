import { IAppRepository } from './IAppRepository';
import {
  User,
  Team,
  Collaborator,
  Checklist,
  ChecklistItem,
  Inspection,
  InspectionItem,
  Evidence,
  Signature,
  PendingAdjustment,
  ModuleType,
  InspectionStatus,
} from '@/domain';
import { PaginatedResponse, PaginationParams } from '@/domain/pagination';
import apiClient from '@/services/apiClient';

class ApiAppRepository implements IAppRepository {
  // Users
  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<User>>(
      `/users?${queryParams.toString()}`
    );
    return response.data;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(`/users?email=${email}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
    const response = await apiClient.post<User>('/users', user);
    return response.data;
  }

  async updateUser(id: string, user: Partial<User> & { password?: string }): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, user);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // Teams
  async getTeams(params?: PaginationParams): Promise<PaginatedResponse<Team>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<Team>>(
      `/teams?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTeamById(id: string): Promise<Team | null> {
    try {
      const response = await apiClient.get<Team>(`/teams/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const response = await apiClient.post<Team>('/teams', team);
    return response.data;
  }

  async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
    const response = await apiClient.put<Team>(`/teams/${id}`, team);
    return response.data;
  }

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  }

  // Collaborators
  async getCollaborators(params?: PaginationParams): Promise<PaginatedResponse<Collaborator>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<Collaborator>>(
      `/collaborators?${queryParams.toString()}`
    );
    return response.data;
  }

  async getCollaboratorById(id: string): Promise<Collaborator | null> {
    try {
      const response = await apiClient.get<Collaborator>(`/collaborators/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createCollaborator(
    collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Collaborator> {
    const response = await apiClient.post<Collaborator>(
      '/collaborators',
      collaborator
    );
    return response.data;
  }

  async updateCollaborator(
    id: string,
    collaborator: Partial<Collaborator>
  ): Promise<Collaborator> {
    const response = await apiClient.put<Collaborator>(
      `/collaborators/${id}`,
      collaborator
    );
    return response.data;
  }

  async deleteCollaborator(id: string): Promise<void> {
    await apiClient.delete(`/collaborators/${id}`);
  }

  // Checklists
  async getChecklists(params?: PaginationParams & { module?: ModuleType }): Promise<PaginatedResponse<Checklist>> {
    const queryParams = new URLSearchParams();
    if (params?.module) queryParams.append('module', params.module);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<Checklist>>(
      `/checklists?${queryParams.toString()}`
    );
    return response.data;
  }

  async getChecklistById(id: string): Promise<Checklist | null> {
    try {
      const response = await apiClient.get<Checklist>(`/checklists/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createChecklist(
    checklist: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Checklist> {
    const response = await apiClient.post<Checklist>('/checklists', checklist);
    return response.data;
  }

  async updateChecklist(
    id: string,
    checklist: Partial<Checklist>
  ): Promise<Checklist> {
    const response = await apiClient.put<Checklist>(
      `/checklists/${id}`,
      checklist
    );
    return response.data;
  }

  async deleteChecklist(id: string): Promise<void> {
    await apiClient.delete(`/checklists/${id}`);
  }

  // Checklist Items
  async getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
    const checklist = await this.getChecklistById(checklistId);
    return checklist?.items || [];
  }

  async getChecklistItemById(id: string): Promise<ChecklistItem | null> {
    // A API não tem endpoint direto, precisamos buscar pelo checklist
    // Por enquanto retornamos null, pode ser implementado se necessário
    return null;
  }

  async createChecklistItem(
    checklistId: string,
    item: Omit<ChecklistItem, 'id' | 'checklistId'>
  ): Promise<ChecklistItem> {
    const response = await apiClient.post<ChecklistItem>(
      `/checklists/${checklistId}/items`,
      item
    );
    return response.data;
  }

  async updateChecklistItem(
    checklistId: string,
    itemId: string,
    item: Partial<ChecklistItem>
  ): Promise<ChecklistItem> {
    const response = await apiClient.put<ChecklistItem>(
      `/checklists/${checklistId}/items/${itemId}`,
      item
    );
    return response.data;
  }

  async deleteChecklistItem(checklistId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/checklists/${checklistId}/items/${itemId}`);
  }

  // Inspections
  async getInspections(params?: PaginationParams & {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
  }): Promise<PaginatedResponse<Inspection>> {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    if (params?.module) queryParams.append('module', params.module);
    if (params?.teamId) queryParams.append('teamId', params.teamId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<Inspection>>(
      `/inspections?${queryParams.toString()}`
    );
    return response.data;
  }

  async getInspectionsByUser(params?: PaginationParams): Promise<PaginatedResponse<Inspection>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<PaginatedResponse<Inspection>>(
      `/inspections/mine?${queryParams.toString()}`
    );
    return response.data;
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    try {
      const response = await apiClient.get<Inspection>(`/inspections/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'scorePercent' | 'createdByUserId'> & {
      collaboratorIds?: string[];
    }
  ): Promise<Inspection> {
    const response = await apiClient.post<Inspection>('/inspections', inspection);
    return response.data;
  }

  async updateInspection(
    id: string,
    inspection: Partial<Inspection>
  ): Promise<Inspection> {
    const response = await apiClient.put<Inspection>(
      `/inspections/${id}`,
      inspection
    );
    return response.data;
  }

  async deleteInspection(id: string): Promise<void> {
    await apiClient.delete(`/inspections/${id}`);
  }

  async finalizeInspection(id: string): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(
      `/inspections/${id}/finalize`
    );
    return response.data;
  }

  async resolveInspection(id: string, data: {
    resolutionNotes?: string;
    resolutionEvidence?: string;
  }): Promise<Inspection> {
    const response = await apiClient.post<Inspection>(
      `/inspections/${id}/resolve`,
      data
    );
    return response.data;
  }

  // Inspection Items
  async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    const inspection = await this.getInspectionById(inspectionId);
    return inspection?.items || [];
  }

  async getInspectionItemById(id: string): Promise<InspectionItem | null> {
    // A API não tem endpoint direto, precisamos buscar pela vistoria
    return null;
  }

  async updateInspectionItems(
    inspectionId: string,
    items: Array<{
      inspectionItemId: string;
      answer?: string;
      notes?: string;
    }>
  ): Promise<InspectionItem[]> {
    const response = await apiClient.put<InspectionItem[]>(
      `/inspections/${inspectionId}/items`,
      items
    );
    return response.data;
  }

  async deleteInspectionItem(id: string): Promise<void> {
    // A API não tem endpoint para deletar item individual
    throw new Error('Deleting inspection items is not supported by the API');
  }

  // Evidences
  async getEvidences(inspectionId: string): Promise<Evidence[]> {
    const inspection = await this.getInspectionById(inspectionId);
    return inspection?.evidences || [];
  }

  async getEvidenceById(id: string): Promise<Evidence | null> {
    try {
      const response = await apiClient.get<Evidence>(`/evidences/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createEvidence(
    inspectionId: string,
    file: File,
    inspectionItemId?: string
  ): Promise<Evidence> {
    const formData = new FormData();
    formData.append('file', file);
    if (inspectionItemId) {
      formData.append('inspectionItemId', inspectionItemId);
    }

    // Para multipart/form-data, não definir Content-Type manualmente
    // O browser define automaticamente com o boundary correto
    const response = await apiClient.post<Evidence>(
      `/inspections/${inspectionId}/evidences`,
      formData,
      {
        headers: {
          'Content-Type': undefined, // Deixa o axios definir automaticamente
        },
      }
    );
    return response.data;
  }

  async deleteEvidence(id: string): Promise<void> {
    await apiClient.delete(`/evidences/${id}`);
  }

  // Signatures
  async getSignature(inspectionId: string): Promise<Signature | null> {
    try {
      const response = await apiClient.get<Signature>(
        `/inspections/${inspectionId}/signature`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async createSignature(
    inspectionId: string,
    data: {
      signerName: string;
      imageBase64: string;
    }
  ): Promise<Signature> {
    const response = await apiClient.post<Signature>(
      `/inspections/${inspectionId}/signature`,
      data
    );
    return response.data;
  }

  async updateSignature(
    id: string,
    signature: Partial<Signature>
  ): Promise<Signature> {
    const response = await apiClient.put<Signature>(
      `/signatures/${id}`,
      signature
    );
    return response.data;
  }

  // Pending Adjustments
  async getPendingAdjustments(): Promise<PendingAdjustment[]> {
    const response = await this.getInspections({ status: InspectionStatus.PENDENTE_AJUSTE });
    const inspections = response.data;
    const adjustments: PendingAdjustment[] = [];
    
    for (const inspection of inspections) {
      if (inspection.pendingAdjustments && inspection.pendingAdjustments.length > 0) {
        adjustments.push(...inspection.pendingAdjustments);
      }
    }
    
    return adjustments;
  }

  async getPendingAdjustment(
    inspectionId: string
  ): Promise<PendingAdjustment | null> {
    const inspection = await this.getInspectionById(inspectionId);
    return inspection?.pendingAdjustments?.[0] || null;
  }

  // Dashboard
  async getDashboardSummary(filters: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }): Promise<{
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters.from) queryParams.append('from', filters.from);
    if (filters.to) queryParams.append('to', filters.to);
    if (filters.module) queryParams.append('module', filters.module);
    if (filters.teamId) queryParams.append('teamId', filters.teamId);

    const response = await apiClient.get(
      `/dashboards/summary?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTeamRanking(filters: {
    from?: string;
    to?: string;
    module?: ModuleType;
  }): Promise<Array<{
    teamId: string;
    teamName: string;
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  }>> {
    const queryParams = new URLSearchParams();
    if (filters.from) queryParams.append('from', filters.from);
    if (filters.to) queryParams.append('to', filters.to);
    if (filters.module) queryParams.append('module', filters.module);

    const response = await apiClient.get(
      `/dashboards/ranking/teams?${queryParams.toString()}`
    );
    return response.data;
  }
}

export default ApiAppRepository;
