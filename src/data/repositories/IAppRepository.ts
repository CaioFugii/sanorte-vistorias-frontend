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

export interface IAppRepository {
  // Users
  getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User>;
  updateUser(id: string, user: Partial<User> & { password?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Teams
  getTeams(params?: PaginationParams): Promise<PaginatedResponse<Team>>;
  getTeamById(id: string): Promise<Team | null>;
  createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team>;
  updateTeam(id: string, team: Partial<Team>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;

  // Collaborators
  getCollaborators(params?: PaginationParams): Promise<PaginatedResponse<Collaborator>>;
  getCollaboratorById(id: string): Promise<Collaborator | null>;
  createCollaborator(
    collaborator: Omit<Collaborator, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Collaborator>;
  updateCollaborator(
    id: string,
    collaborator: Partial<Collaborator>
  ): Promise<Collaborator>;
  deleteCollaborator(id: string): Promise<void>;

  // Checklists
  getChecklists(params?: PaginationParams & { module?: ModuleType }): Promise<PaginatedResponse<Checklist>>;
  getChecklistById(id: string): Promise<Checklist | null>;
  createChecklist(
    checklist: Omit<Checklist, 'id' | 'createdAt' | 'updatedAt'>
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
    checklistId: string,
    item: Omit<ChecklistItem, 'id' | 'checklistId'>
  ): Promise<ChecklistItem>;
  updateChecklistItem(
    checklistId: string,
    itemId: string,
    item: Partial<ChecklistItem>
  ): Promise<ChecklistItem>;
  deleteChecklistItem(checklistId: string, itemId: string): Promise<void>;

  // Inspections
  getInspections(params?: PaginationParams & {
    periodFrom?: string;
    periodTo?: string;
    module?: ModuleType;
    teamId?: string;
    status?: InspectionStatus;
  }): Promise<PaginatedResponse<Inspection>>;
  getInspectionsByUser(params?: PaginationParams): Promise<PaginatedResponse<Inspection>>;
  getInspectionById(id: string): Promise<Inspection | null>;
  createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'scorePercent' | 'createdByUserId'> & {
      collaboratorIds?: string[];
    }
  ): Promise<Inspection>;
  updateInspection(
    id: string,
    inspection: Partial<Inspection>
  ): Promise<Inspection>;
  deleteInspection(id: string): Promise<void>;
  finalizeInspection(id: string): Promise<Inspection>;
  resolveInspection(id: string, data: {
    resolutionNotes?: string;
    resolutionEvidence?: string; // base64
  }): Promise<Inspection>;

  // Inspection Items
  getInspectionItems(inspectionId: string): Promise<InspectionItem[]>;
  getInspectionItemById(id: string): Promise<InspectionItem | null>;
  updateInspectionItems(
    inspectionId: string,
    items: Array<{
      inspectionItemId: string;
      answer?: string;
      notes?: string;
    }>
  ): Promise<InspectionItem[]>;
  deleteInspectionItem(id: string): Promise<void>;

  // Evidences
  getEvidences(inspectionId: string): Promise<Evidence[]>;
  getEvidenceById(id: string): Promise<Evidence | null>;
  createEvidence(
    inspectionId: string,
    file: File,
    inspectionItemId?: string
  ): Promise<Evidence>;
  deleteEvidence(id: string): Promise<void>;

  // Signatures
  getSignature(inspectionId: string): Promise<Signature | null>;
  createSignature(
    inspectionId: string,
    data: {
      signerName: string;
      imageBase64: string; // sem prefixo data:image
    }
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

  // Dashboard
  getDashboardSummary(filters: {
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }): Promise<{
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  }>;
  getTeamRanking(filters: {
    from?: string;
    to?: string;
    module?: ModuleType;
  }): Promise<Array<{
    teamId: string;
    teamName: string;
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  }>>;
}
