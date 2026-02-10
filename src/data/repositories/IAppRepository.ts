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

export interface IAppRepository {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | null>;
  createTeam(team: Omit<Team, 'id'>): Promise<Team>;
  updateTeam(id: string, team: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;

  // Collaborators
  getCollaborators(): Promise<Collaborator[]>;
  getCollaboratorById(id: string): Promise<Collaborator | null>;
  createCollaborator(
    collaborator: Omit<Collaborator, 'id'>
  ): Promise<Collaborator>;
  updateCollaborator(
    id: string,
    collaborator: Partial<Collaborator>
  ): Promise<Collaborator>;
  deleteCollaborator(id: string): Promise<void>;

  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklistsByModule(module: ModuleType): Promise<Checklist[]>;
  getChecklistById(id: string): Promise<Checklist | null>;
  createChecklist(
    checklist: Omit<Checklist, 'id'>
  ): Promise<Checklist>;
  updateChecklist(
    id: string,
    checklist: Partial<Checklist>
  ): Promise<Checklist>;
  deleteChecklist(id: string): Promise<void>;

  // Checklist Items
  getChecklistItems(checklistId: string): Promise<ChecklistItem[]>;
  getChecklistItemById(id: string): Promise<ChecklistItem | null>;
  createChecklistItem(
    item: Omit<ChecklistItem, 'id'>
  ): Promise<ChecklistItem>;
  updateChecklistItem(
    id: string,
    item: Partial<ChecklistItem>
  ): Promise<ChecklistItem>;
  deleteChecklistItem(id: string): Promise<void>;
  reorderChecklistItems(
    checklistId: string,
    itemIds: string[]
  ): Promise<void>;

  // Inspections
  getInspections(): Promise<Inspection[]>;
  getInspectionsByUser(userId: string): Promise<Inspection[]>;
  getInspectionById(id: string): Promise<Inspection | null>;
  createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Inspection>;
  updateInspection(
    id: string,
    inspection: Partial<Inspection>
  ): Promise<Inspection>;
  deleteInspection(id: string): Promise<void>;

  // Inspection Items
  getInspectionItems(inspectionId: string): Promise<InspectionItem[]>;
  getInspectionItemById(id: string): Promise<InspectionItem | null>;
  createInspectionItem(
    item: Omit<InspectionItem, 'id'>
  ): Promise<InspectionItem>;
  updateInspectionItem(
    id: string,
    item: Partial<InspectionItem>
  ): Promise<InspectionItem>;
  deleteInspectionItem(id: string): Promise<void>;

  // Evidences
  getEvidences(inspectionId: string): Promise<Evidence[]>;
  getEvidenceById(id: string): Promise<Evidence | null>;
  createEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt'>
  ): Promise<Evidence>;
  deleteEvidence(id: string): Promise<void>;

  // Signatures
  getSignature(inspectionId: string): Promise<Signature | null>;
  createSignature(
    signature: Omit<Signature, 'id' | 'signedAt'>
  ): Promise<Signature>;
  updateSignature(
    id: string,
    signature: Partial<Signature>
  ): Promise<Signature>;

  // Pending Adjustments
  getPendingAdjustments(): Promise<PendingAdjustment[]>;
  getPendingAdjustment(
    inspectionId: string
  ): Promise<PendingAdjustment | null>;
  updatePendingAdjustment(
    inspectionId: string,
    adjustment: Partial<PendingAdjustment>
  ): Promise<PendingAdjustment>;

  // Dashboard
  getDashboardData(filters: {
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
  }>;
}
