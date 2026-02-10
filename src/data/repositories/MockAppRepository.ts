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
import {
  mockUsers,
  mockTeams,
  mockCollaborators,
  mockChecklists,
  mockChecklistItems,
  mockInspections,
  mockInspectionItems,
  mockEvidences,
  mockSignatures,
  mockPendingAdjustments,
} from '../mocks/initialData';

const STORAGE_KEYS = {
  TEAMS: 'sanorte_teams',
  COLLABORATORS: 'sanorte_collaborators',
  CHECKLISTS: 'sanorte_checklists',
  CHECKLIST_ITEMS: 'sanorte_checklist_items',
  INSPECTIONS: 'sanorte_inspections',
  INSPECTION_ITEMS: 'sanorte_inspection_items',
  EVIDENCES: 'sanorte_evidences',
  SIGNATURES: 'sanorte_signatures',
  PENDING_ADJUSTMENTS: 'sanorte_pending_adjustments',
};

class MockAppRepository implements IAppRepository {
  private loadFromStorage<T>(key: string, defaultValue: T[]): T[] {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
    }
    return defaultValue;
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }

  private _getTeams(): Team[] {
    return this.loadFromStorage(STORAGE_KEYS.TEAMS, mockTeams);
  }

  private _getCollaborators(): Collaborator[] {
    return this.loadFromStorage(STORAGE_KEYS.COLLABORATORS, mockCollaborators);
  }

  private _getChecklists(): Checklist[] {
    return this.loadFromStorage(STORAGE_KEYS.CHECKLISTS, mockChecklists);
  }

  private _getChecklistItems(): ChecklistItem[] {
    return this.loadFromStorage(
      STORAGE_KEYS.CHECKLIST_ITEMS,
      mockChecklistItems
    );
  }

  private _getInspections(): Inspection[] {
    return this.loadFromStorage(STORAGE_KEYS.INSPECTIONS, mockInspections);
  }

  private _getInspectionItems(): InspectionItem[] {
    return this.loadFromStorage(
      STORAGE_KEYS.INSPECTION_ITEMS,
      mockInspectionItems
    );
  }

  private _getEvidences(): Evidence[] {
    return this.loadFromStorage(STORAGE_KEYS.EVIDENCES, mockEvidences);
  }

  private _getSignatures(): Signature[] {
    return this.loadFromStorage(STORAGE_KEYS.SIGNATURES, mockSignatures);
  }

  private _getPendingAdjustments(): PendingAdjustment[] {
    return this.loadFromStorage(
      STORAGE_KEYS.PENDING_ADJUSTMENTS,
      mockPendingAdjustments
    );
  }

  // Users
  async getUsers(): Promise<User[]> {
    return [...mockUsers];
  }

  async getUserById(id: string): Promise<User | null> {
    return mockUsers.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return mockUsers.find((u) => u.email === email) || null;
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return [...this._getTeams()];
  }

  async getTeamById(id: string): Promise<Team | null> {
    return this._getTeams().find((t) => t.id === id) || null;
  }

  async createTeam(team: Omit<Team, 'id'>): Promise<Team> {
    const teams = this._getTeams();
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
    };
    teams.push(newTeam);
    this.saveToStorage(STORAGE_KEYS.TEAMS, teams);
    return newTeam;
  }

  async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
    const teams = this._getTeams();
    const index = teams.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Team not found');
    teams[index] = { ...teams[index], ...team };
    this.saveToStorage(STORAGE_KEYS.TEAMS, teams);
    return teams[index];
  }

  async deleteTeam(id: string): Promise<void> {
    const teams = this._getTeams().filter((t) => t.id !== id);
    this.saveToStorage(STORAGE_KEYS.TEAMS, teams);
  }

  // Collaborators
  async getCollaborators(): Promise<Collaborator[]> {
    return [...this._getCollaborators()];
  }

  async getCollaboratorById(id: string): Promise<Collaborator | null> {
    return this._getCollaborators().find((c) => c.id === id) || null;
  }

  async createCollaborator(
    collaborator: Omit<Collaborator, 'id'>
  ): Promise<Collaborator> {
    const collaborators = this._getCollaborators();
    const newCollaborator: Collaborator = {
      ...collaborator,
      id: `collab-${Date.now()}`,
    };
    collaborators.push(newCollaborator);
    this.saveToStorage(STORAGE_KEYS.COLLABORATORS, collaborators);
    return newCollaborator;
  }

  async updateCollaborator(
    id: string,
    collaborator: Partial<Collaborator>
  ): Promise<Collaborator> {
    const collaborators = this._getCollaborators();
    const index = collaborators.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Collaborator not found');
    collaborators[index] = { ...collaborators[index], ...collaborator };
    this.saveToStorage(STORAGE_KEYS.COLLABORATORS, collaborators);
    return collaborators[index];
  }

  async deleteCollaborator(id: string): Promise<void> {
    const collaborators = this._getCollaborators().filter((c) => c.id !== id);
    this.saveToStorage(STORAGE_KEYS.COLLABORATORS, collaborators);
  }

  // Checklists
  async getChecklists(): Promise<Checklist[]> {
    return [...this._getChecklists()];
  }

  async getChecklistsByModule(module: ModuleType): Promise<Checklist[]> {
    return this._getChecklists().filter((c) => c.module === module && c.active);
  }

  async getChecklistById(id: string): Promise<Checklist | null> {
    return this._getChecklists().find((c) => c.id === id) || null;
  }

  async createChecklist(
    checklist: Omit<Checklist, 'id'>
  ): Promise<Checklist> {
    const checklists = this._getChecklists();
    const newChecklist: Checklist = {
      ...checklist,
      id: `checklist-${Date.now()}`,
    };
    checklists.push(newChecklist);
    this.saveToStorage(STORAGE_KEYS.CHECKLISTS, checklists);
    return newChecklist;
  }

  async updateChecklist(
    id: string,
    checklist: Partial<Checklist>
  ): Promise<Checklist> {
    const checklists = this._getChecklists();
    const index = checklists.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Checklist not found');
    checklists[index] = { ...checklists[index], ...checklist };
    this.saveToStorage(STORAGE_KEYS.CHECKLISTS, checklists);
    return checklists[index];
  }

  async deleteChecklist(id: string): Promise<void> {
    const checklists = this._getChecklists().filter((c) => c.id !== id);
    this.saveToStorage(STORAGE_KEYS.CHECKLISTS, checklists);
  }

  // Checklist Items
  async getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
    return this._getChecklistItems()
      .filter((item) => item.checklistId === checklistId)
      .sort((a, b) => a.order - b.order);
  }

  async getChecklistItemById(id: string): Promise<ChecklistItem | null> {
    return this._getChecklistItems().find((item) => item.id === id) || null;
  }

  async createChecklistItem(
    item: Omit<ChecklistItem, 'id'>
  ): Promise<ChecklistItem> {
    const items = this._getChecklistItems();
    const newItem: ChecklistItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    items.push(newItem);
    this.saveToStorage(STORAGE_KEYS.CHECKLIST_ITEMS, items);
    return newItem;
  }

  async updateChecklistItem(
    id: string,
    item: Partial<ChecklistItem>
  ): Promise<ChecklistItem> {
    const items = this._getChecklistItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Checklist item not found');
    items[index] = { ...items[index], ...item };
    this.saveToStorage(STORAGE_KEYS.CHECKLIST_ITEMS, items);
    return items[index];
  }

  async deleteChecklistItem(id: string): Promise<void> {
    const items = this._getChecklistItems().filter((i) => i.id !== id);
    this.saveToStorage(STORAGE_KEYS.CHECKLIST_ITEMS, items);
  }

  async reorderChecklistItems(
    checklistId: string,
    itemIds: string[]
  ): Promise<void> {
    const items = this._getChecklistItems();
    itemIds.forEach((itemId, index) => {
      const item = items.find((i) => i.id === itemId && i.checklistId === checklistId);
      if (item) {
        item.order = index + 1;
      }
    });
    this.saveToStorage(STORAGE_KEYS.CHECKLIST_ITEMS, items);
  }

  // Inspections
  async getInspections(): Promise<Inspection[]> {
    return [...this._getInspections()];
  }

  async getInspectionsByUser(userId: string): Promise<Inspection[]> {
    return this._getInspections().filter((i) => i.createdByUserId === userId);
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    return this._getInspections().find((i) => i.id === id) || null;
  }

  async createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Inspection> {
    const inspections = this._getInspections();
    const now = new Date().toISOString();
    const newInspection: Inspection = {
      ...inspection,
      id: `insp-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    inspections.push(newInspection);
    this.saveToStorage(STORAGE_KEYS.INSPECTIONS, inspections);
    return newInspection;
  }

  async updateInspection(
    id: string,
    inspection: Partial<Inspection>
  ): Promise<Inspection> {
    const inspections = this._getInspections();
    const index = inspections.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inspection not found');
    inspections[index] = {
      ...inspections[index],
      ...inspection,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage(STORAGE_KEYS.INSPECTIONS, inspections);
    return inspections[index];
  }

  async deleteInspection(id: string): Promise<void> {
    const inspections = this._getInspections().filter((i) => i.id !== id);
    this.saveToStorage(STORAGE_KEYS.INSPECTIONS, inspections);
  }

  // Inspection Items
  async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    return this._getInspectionItems().filter(
      (item) => item.inspectionId === inspectionId
    );
  }

  async getInspectionItemById(id: string): Promise<InspectionItem | null> {
    return this._getInspectionItems().find((item) => item.id === id) || null;
  }

  async createInspectionItem(
    item: Omit<InspectionItem, 'id'>
  ): Promise<InspectionItem> {
    const items = this._getInspectionItems();
    const newItem: InspectionItem = {
      ...item,
      id: `insp-item-${Date.now()}`,
    };
    items.push(newItem);
    this.saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, items);
    return newItem;
  }

  async updateInspectionItem(
    id: string,
    item: Partial<InspectionItem>
  ): Promise<InspectionItem> {
    const items = this._getInspectionItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inspection item not found');
    items[index] = { ...items[index], ...item };
    this.saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, items);
    return items[index];
  }

  async deleteInspectionItem(id: string): Promise<void> {
    const items = this._getInspectionItems().filter((i) => i.id !== id);
    this.saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, items);
  }

  // Evidences
  async getEvidences(inspectionId: string): Promise<Evidence[]> {
    return this._getEvidences().filter((e) => e.inspectionId === inspectionId);
  }

  async getEvidenceById(id: string): Promise<Evidence | null> {
    return this._getEvidences().find((e) => e.id === id) || null;
  }

  async createEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt'>
  ): Promise<Evidence> {
    const evidences = this._getEvidences();
    const newEvidence: Evidence = {
      ...evidence,
      id: `evid-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    evidences.push(newEvidence);
    this.saveToStorage(STORAGE_KEYS.EVIDENCES, evidences);
    return newEvidence;
  }

  async deleteEvidence(id: string): Promise<void> {
    const evidences = this._getEvidences().filter((e) => e.id !== id);
    this.saveToStorage(STORAGE_KEYS.EVIDENCES, evidences);
  }

  // Signatures
  async getSignature(inspectionId: string): Promise<Signature | null> {
    return (
      this._getSignatures().find((s) => s.inspectionId === inspectionId) || null
    );
  }

  async createSignature(
    signature: Omit<Signature, 'id' | 'signedAt'>
  ): Promise<Signature> {
    const signatures = this._getSignatures();
    const newSignature: Signature = {
      ...signature,
      id: `sig-${Date.now()}`,
      signedAt: new Date().toISOString(),
    };
    signatures.push(newSignature);
    this.saveToStorage(STORAGE_KEYS.SIGNATURES, signatures);
    return newSignature;
  }

  async updateSignature(
    id: string,
    signature: Partial<Signature>
  ): Promise<Signature> {
    const signatures = this._getSignatures();
    const index = signatures.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Signature not found');
    signatures[index] = { ...signatures[index], ...signature };
    this.saveToStorage(STORAGE_KEYS.SIGNATURES, signatures);
    return signatures[index];
  }

  // Pending Adjustments
  async getPendingAdjustments(): Promise<PendingAdjustment[]> {
    return this._getPendingAdjustments().filter(
      (p) => p.status === InspectionStatus.PENDENTE_AJUSTE
    );
  }

  async getPendingAdjustment(
    inspectionId: string
  ): Promise<PendingAdjustment | null> {
    return (
      this._getPendingAdjustments().find(
        (p) => p.inspectionId === inspectionId
      ) || null
    );
  }

  async updatePendingAdjustment(
    inspectionId: string,
    adjustment: Partial<PendingAdjustment>
  ): Promise<PendingAdjustment> {
    const adjustments = this._getPendingAdjustments();
    const index = adjustments.findIndex(
      (p) => p.inspectionId === inspectionId
    );
    if (index === -1) {
      const newAdjustment: PendingAdjustment = {
        inspectionId,
        status: InspectionStatus.PENDENTE_AJUSTE,
        ...adjustment,
      } as PendingAdjustment;
      adjustments.push(newAdjustment);
      this.saveToStorage(STORAGE_KEYS.PENDING_ADJUSTMENTS, adjustments);
      return newAdjustment;
    }
    adjustments[index] = { ...adjustments[index], ...adjustment };
    this.saveToStorage(STORAGE_KEYS.PENDING_ADJUSTMENTS, adjustments);
    return adjustments[index];
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
    let inspections = this._getInspections().filter(
      (i) => i.status !== InspectionStatus.RASCUNHO
    );

    if (filters.from) {
      inspections = inspections.filter(
        (i) => i.finalizedAt && i.finalizedAt >= filters.from!
      );
    }
    if (filters.to) {
      inspections = inspections.filter(
        (i) => i.finalizedAt && i.finalizedAt <= filters.to!
      );
    }
    if (filters.module) {
      inspections = inspections.filter((i) => i.module === filters.module);
    }
    if (filters.teamId) {
      inspections = inspections.filter((i) => i.teamId === filters.teamId);
    }

    const totalInspections = inspections.length;
    const averageScore =
      totalInspections > 0
        ? Math.round(
            inspections.reduce((sum, i) => sum + i.scorePercent, 0) /
              totalInspections
          )
        : 0;
    const pendingCount = inspections.filter(
      (i) => i.status === InspectionStatus.PENDENTE_AJUSTE
    ).length;

    const teams = this._getTeams();
    const teamRanking = teams.map((team) => {
      const teamInspections = inspections.filter((i) => i.teamId === team.id);
      const teamTotal = teamInspections.length;
      const teamAverage =
        teamTotal > 0
          ? Math.round(
              teamInspections.reduce((sum, i) => sum + i.scorePercent, 0) /
                teamTotal
            )
          : 0;
      const teamPending = teamInspections.filter(
        (i) => i.status === InspectionStatus.PENDENTE_AJUSTE
      ).length;

      return {
        teamId: team.id,
        teamName: team.name,
        averageScore: teamAverage,
        totalInspections: teamTotal,
        pendingCount: teamPending,
      };
    });

    return {
      averageScore,
      totalInspections,
      pendingCount,
      teamRanking: teamRanking.sort((a, b) => b.averageScore - a.averageScore),
    };
  }
}

export default MockAppRepository;
