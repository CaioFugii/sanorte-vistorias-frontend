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
} from '@/domain';
import apiClient from '@/services/apiClient';

/**
 * Implementação futura do repositório que fará chamadas à API real
 * Por enquanto, apenas estrutura com métodos stub e comentários dos endpoints
 */
class ApiAppRepository implements IAppRepository {
  // Users
  async getUsers(): Promise<User[]> {
    // GET /api/users
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  }

  async getUserById(id: string): Promise<User | null> {
    // GET /api/users/:id
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // GET /api/users?email=:email
    const response = await apiClient.get<User>(`/users?email=${email}`);
    return response.data;
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    // GET /api/teams
    const response = await apiClient.get<Team[]>('/teams');
    return response.data;
  }

  async getTeamById(id: string): Promise<Team | null> {
    // GET /api/teams/:id
    const response = await apiClient.get<Team>(`/teams/${id}`);
    return response.data;
  }

  async createTeam(team: Omit<Team, 'id'>): Promise<Team> {
    // POST /api/teams
    const response = await apiClient.post<Team>('/teams', team);
    return response.data;
  }

  async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
    // PUT /api/teams/:id
    const response = await apiClient.put<Team>(`/teams/${id}`, team);
    return response.data;
  }

  async deleteTeam(id: string): Promise<void> {
    // DELETE /api/teams/:id
    await apiClient.delete(`/teams/${id}`);
  }

  // Collaborators
  async getCollaborators(): Promise<Collaborator[]> {
    // GET /api/collaborators
    const response = await apiClient.get<Collaborator[]>('/collaborators');
    return response.data;
  }

  async getCollaboratorById(id: string): Promise<Collaborator | null> {
    // GET /api/collaborators/:id
    const response = await apiClient.get<Collaborator>(`/collaborators/${id}`);
    return response.data;
  }

  async createCollaborator(
    collaborator: Omit<Collaborator, 'id'>
  ): Promise<Collaborator> {
    // POST /api/collaborators
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
    // PUT /api/collaborators/:id
    const response = await apiClient.put<Collaborator>(
      `/collaborators/${id}`,
      collaborator
    );
    return response.data;
  }

  async deleteCollaborator(id: string): Promise<void> {
    // DELETE /api/collaborators/:id
    await apiClient.delete(`/collaborators/${id}`);
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    // GET /api/checklists
    const response = await apiClient.get<Checklist[]>('/checklists');
    return response.data;
  }

  async getChecklistsByModule(module: ModuleType): Promise<Checklist[]> {
    // GET /api/checklists?module=:module
    const response = await apiClient.get<Checklist[]>(
      `/checklists?module=${module}`
    );
    return response.data;
  }

  async getChecklistById(id: string): Promise<Checklist | null> {
    // GET /api/checklists/:id
    const response = await apiClient.get<Checklist>(`/checklists/${id}`);
    return response.data;
  }

  async createChecklist(
    checklist: Omit<Checklist, 'id'>
  ): Promise<Checklist> {
    // POST /api/checklists
    const response = await apiClient.post<Checklist>('/checklists', checklist);
    return response.data;
  }

  async updateChecklist(
    id: string,
    checklist: Partial<Checklist>
  ): Promise<Checklist> {
    // PUT /api/checklists/:id
    const response = await apiClient.put<Checklist>(
      `/checklists/${id}`,
      checklist
    );
    return response.data;
  }

  async deleteChecklist(id: string): Promise<void> {
    // DELETE /api/checklists/:id
    await apiClient.delete(`/checklists/${id}`);
  }

  // Checklist Items
  async getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
    // GET /api/checklists/:checklistId/items
    const response = await apiClient.get<ChecklistItem[]>(
      `/checklists/${checklistId}/items`
    );
    return response.data;
  }

  async getChecklistItemById(id: string): Promise<ChecklistItem | null> {
    // GET /api/checklist-items/:id
    const response = await apiClient.get<ChecklistItem>(
      `/checklist-items/${id}`
    );
    return response.data;
  }

  async createChecklistItem(
    item: Omit<ChecklistItem, 'id'>
  ): Promise<ChecklistItem> {
    // POST /api/checklist-items
    const response = await apiClient.post<ChecklistItem>(
      '/checklist-items',
      item
    );
    return response.data;
  }

  async updateChecklistItem(
    id: string,
    item: Partial<ChecklistItem>
  ): Promise<ChecklistItem> {
    // PUT /api/checklist-items/:id
    const response = await apiClient.put<ChecklistItem>(
      `/checklist-items/${id}`,
      item
    );
    return response.data;
  }

  async deleteChecklistItem(id: string): Promise<void> {
    // DELETE /api/checklist-items/:id
    await apiClient.delete(`/checklist-items/${id}`);
  }

  async reorderChecklistItems(
    checklistId: string,
    itemIds: string[]
  ): Promise<void> {
    // PUT /api/checklists/:checklistId/items/reorder
    await apiClient.put(`/checklists/${checklistId}/items/reorder`, {
      itemIds,
    });
  }

  // Inspections
  async getInspections(): Promise<Inspection[]> {
    // GET /api/inspections
    const response = await apiClient.get<Inspection[]>('/inspections');
    return response.data;
  }

  async getInspectionsByUser(userId: string): Promise<Inspection[]> {
    // GET /api/inspections?userId=:userId
    const response = await apiClient.get<Inspection[]>(
      `/inspections?userId=${userId}`
    );
    return response.data;
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    // GET /api/inspections/:id
    const response = await apiClient.get<Inspection>(`/inspections/${id}`);
    return response.data;
  }

  async createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Inspection> {
    // POST /api/inspections
    const response = await apiClient.post<Inspection>(
      '/inspections',
      inspection
    );
    return response.data;
  }

  async updateInspection(
    id: string,
    inspection: Partial<Inspection>
  ): Promise<Inspection> {
    // PUT /api/inspections/:id
    const response = await apiClient.put<Inspection>(
      `/inspections/${id}`,
      inspection
    );
    return response.data;
  }

  async deleteInspection(id: string): Promise<void> {
    // DELETE /api/inspections/:id
    await apiClient.delete(`/inspections/${id}`);
  }

  // Inspection Items
  async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    // GET /api/inspections/:inspectionId/items
    const response = await apiClient.get<InspectionItem[]>(
      `/inspections/${inspectionId}/items`
    );
    return response.data;
  }

  async getInspectionItemById(id: string): Promise<InspectionItem | null> {
    // GET /api/inspection-items/:id
    const response = await apiClient.get<InspectionItem>(
      `/inspection-items/${id}`
    );
    return response.data;
  }

  async createInspectionItem(
    item: Omit<InspectionItem, 'id'>
  ): Promise<InspectionItem> {
    // POST /api/inspection-items
    const response = await apiClient.post<InspectionItem>(
      '/inspection-items',
      item
    );
    return response.data;
  }

  async updateInspectionItem(
    id: string,
    item: Partial<InspectionItem>
  ): Promise<InspectionItem> {
    // PUT /api/inspection-items/:id
    const response = await apiClient.put<InspectionItem>(
      `/inspection-items/${id}`,
      item
    );
    return response.data;
  }

  async deleteInspectionItem(id: string): Promise<void> {
    // DELETE /api/inspection-items/:id
    await apiClient.delete(`/inspection-items/${id}`);
  }

  // Evidences
  async getEvidences(inspectionId: string): Promise<Evidence[]> {
    // GET /api/inspections/:inspectionId/evidences
    const response = await apiClient.get<Evidence[]>(
      `/inspections/${inspectionId}/evidences`
    );
    return response.data;
  }

  async getEvidenceById(id: string): Promise<Evidence | null> {
    // GET /api/evidences/:id
    const response = await apiClient.get<Evidence>(`/evidences/${id}`);
    return response.data;
  }

  async createEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt'>
  ): Promise<Evidence> {
    // POST /api/evidences
    const response = await apiClient.post<Evidence>('/evidences', evidence);
    return response.data;
  }

  async deleteEvidence(id: string): Promise<void> {
    // DELETE /api/evidences/:id
    await apiClient.delete(`/evidences/${id}`);
  }

  // Signatures
  async getSignature(inspectionId: string): Promise<Signature | null> {
    // GET /api/inspections/:inspectionId/signature
    const response = await apiClient.get<Signature>(
      `/inspections/${inspectionId}/signature`
    );
    return response.data;
  }

  async createSignature(
    signature: Omit<Signature, 'id' | 'signedAt'>
  ): Promise<Signature> {
    // POST /api/signatures
    const response = await apiClient.post<Signature>('/signatures', signature);
    return response.data;
  }

  async updateSignature(
    id: string,
    signature: Partial<Signature>
  ): Promise<Signature> {
    // PUT /api/signatures/:id
    const response = await apiClient.put<Signature>(
      `/signatures/${id}`,
      signature
    );
    return response.data;
  }

  // Pending Adjustments
  async getPendingAdjustments(): Promise<PendingAdjustment[]> {
    // GET /api/pending-adjustments
    const response = await apiClient.get<PendingAdjustment[]>(
      '/pending-adjustments'
    );
    return response.data;
  }

  async getPendingAdjustment(
    inspectionId: string
  ): Promise<PendingAdjustment | null> {
    // GET /api/pending-adjustments/:inspectionId
    const response = await apiClient.get<PendingAdjustment>(
      `/pending-adjustments/${inspectionId}`
    );
    return response.data;
  }

  async updatePendingAdjustment(
    inspectionId: string,
    adjustment: Partial<PendingAdjustment>
  ): Promise<PendingAdjustment> {
    // PUT /api/pending-adjustments/:inspectionId
    const response = await apiClient.put<PendingAdjustment>(
      `/pending-adjustments/${inspectionId}`,
      adjustment
    );
    return response.data;
  }

  // Dashboard
  async getDashboardData(filters: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }): Promise<{
    averageScore: number;
    totalInspections: number;
    pendingCount: number;
    teamRanking: Array<{
      teamId: string;
      teamName: string;
      averageScore: number;
      totalInspections: number;
      pendingCount: number;
    }>;
  }> {
    // GET /api/dashboard?from=:from&to=:to&module=:module&teamId=:teamId
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.module) params.append('module', filters.module);
    if (filters.teamId) params.append('teamId', filters.teamId);

    const response = await apiClient.get(
      `/dashboard?${params.toString()}`
    );
    return response.data;
  }
}

export default ApiAppRepository;
