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
  UserRole,
  ChecklistAnswer,
  InspectionStatus,
} from '@/domain';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'João Silva',
    email: 'admin@sanorte.com',
    role: UserRole.ADMIN,
  },
  {
    id: 'user-2',
    name: 'Maria Santos',
    email: 'gestor@sanorte.com',
    role: UserRole.GESTOR,
  },
  {
    id: 'user-3',
    name: 'Pedro Costa',
    email: 'fiscal@sanorte.com',
    role: UserRole.FISCAL,
  },
];

export const mockTeams: Team[] = [
  { id: 'team-1', name: 'Equipe Alpha', active: true },
  { id: 'team-2', name: 'Equipe Beta', active: true },
  { id: 'team-3', name: 'Equipe Gamma', active: true },
];

export const mockCollaborators: Collaborator[] = [
  { id: 'collab-1', name: 'Carlos Mendes', active: true },
  { id: 'collab-2', name: 'Ana Paula', active: true },
  { id: 'collab-3', name: 'Roberto Lima', active: true },
  { id: 'collab-4', name: 'Fernanda Souza', active: true },
  { id: 'collab-5', name: 'Lucas Oliveira', active: true },
  { id: 'collab-6', name: 'Juliana Silva', active: true },
  { id: 'collab-7', name: 'Marcos Pereira', active: true },
  { id: 'collab-8', name: 'Patricia Alves', active: true },
  { id: 'collab-9', name: 'Ricardo Santos', active: true },
  { id: 'collab-10', name: 'Tatiana Costa', active: true },
];

export const mockChecklists: Checklist[] = [
  {
    id: 'checklist-1',
    module: ModuleType.SEGURANCA_TRABALHO,
    name: 'Checklist Segurança - Obra Residencial',
    description: 'Verificação de segurança em obras residenciais',
    active: true,
  },
  {
    id: 'checklist-2',
    module: ModuleType.SEGURANCA_TRABALHO,
    name: 'Checklist Segurança - Obra Comercial',
    description: 'Verificação de segurança em obras comerciais',
    active: true,
  },
  {
    id: 'checklist-3',
    module: ModuleType.OBRAS_INVESTIMENTO,
    name: 'Checklist Obras de Investimento',
    description: 'Verificação de obras de investimento',
    active: true,
  },
  {
    id: 'checklist-4',
    module: ModuleType.OBRAS_GLOBAL,
    name: 'Checklist Obras Globais',
    description: 'Verificação geral de obras',
    active: true,
  },
  {
    id: 'checklist-5',
    module: ModuleType.CANTEIRO,
    name: 'Checklist Canteiro de Obras',
    description: 'Verificação de canteiro de obras',
    active: true,
  },
];

export const mockChecklistItems: ChecklistItem[] = [
  // Checklist 1 - Segurança Trabalho
  {
    id: 'item-1',
    checklistId: 'checklist-1',
    title: 'Uso de EPI adequado',
    order: 1,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-2',
    checklistId: 'checklist-1',
    title: 'Sinalização de segurança',
    order: 2,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-3',
    checklistId: 'checklist-1',
    title: 'Proteção de bordas e aberturas',
    order: 3,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-4',
    checklistId: 'checklist-1',
    title: 'Equipamentos de proteção coletiva',
    order: 4,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-5',
    checklistId: 'checklist-1',
    title: 'Organização e limpeza do local',
    order: 5,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-6',
    checklistId: 'checklist-1',
    title: 'Acesso seguro ao local',
    order: 6,
    requiresPhotoOnNonConformity: true,
  },
  // Checklist 2 - Segurança Trabalho
  {
    id: 'item-7',
    checklistId: 'checklist-2',
    title: 'Uso de EPI adequado',
    order: 1,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-8',
    checklistId: 'checklist-2',
    title: 'Sinalização de segurança',
    order: 2,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-9',
    checklistId: 'checklist-2',
    title: 'Proteção de bordas e aberturas',
    order: 3,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-10',
    checklistId: 'checklist-2',
    title: 'Equipamentos de proteção coletiva',
    order: 4,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-11',
    checklistId: 'checklist-2',
    title: 'Organização e limpeza do local',
    order: 5,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-12',
    checklistId: 'checklist-2',
    title: 'Acesso seguro ao local',
    order: 6,
    requiresPhotoOnNonConformity: true,
  },
  // Checklist 3 - Obras Investimento
  {
    id: 'item-13',
    checklistId: 'checklist-3',
    title: 'Planejamento da obra',
    order: 1,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-14',
    checklistId: 'checklist-3',
    title: 'Execução conforme projeto',
    order: 2,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-15',
    checklistId: 'checklist-3',
    title: 'Qualidade dos materiais',
    order: 3,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-16',
    checklistId: 'checklist-3',
    title: 'Cronograma de execução',
    order: 4,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-17',
    checklistId: 'checklist-3',
    title: 'Documentação da obra',
    order: 5,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-18',
    checklistId: 'checklist-3',
    title: 'Controle de qualidade',
    order: 6,
    requiresPhotoOnNonConformity: true,
  },
  // Checklist 4 - Obras Globais
  {
    id: 'item-19',
    checklistId: 'checklist-4',
    title: 'Estrutura geral',
    order: 1,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-20',
    checklistId: 'checklist-4',
    title: 'Instalações elétricas',
    order: 2,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-21',
    checklistId: 'checklist-4',
    title: 'Instalações hidráulicas',
    order: 3,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-22',
    checklistId: 'checklist-4',
    title: 'Acabamentos',
    order: 4,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-23',
    checklistId: 'checklist-4',
    title: 'Pintura',
    order: 5,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-24',
    checklistId: 'checklist-4',
    title: 'Limpeza final',
    order: 6,
    requiresPhotoOnNonConformity: false,
  },
  // Checklist 5 - Canteiro
  {
    id: 'item-25',
    checklistId: 'checklist-5',
    title: 'Organização do canteiro',
    order: 1,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-26',
    checklistId: 'checklist-5',
    title: 'Armazenamento de materiais',
    order: 2,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-27',
    checklistId: 'checklist-5',
    title: 'Equipamentos e ferramentas',
    order: 3,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-28',
    checklistId: 'checklist-5',
    title: 'Sinalização do canteiro',
    order: 4,
    requiresPhotoOnNonConformity: false,
  },
  {
    id: 'item-29',
    checklistId: 'checklist-5',
    title: 'Acesso e circulação',
    order: 5,
    requiresPhotoOnNonConformity: true,
  },
  {
    id: 'item-30',
    checklistId: 'checklist-5',
    title: 'Limpeza e manutenção',
    order: 6,
    requiresPhotoOnNonConformity: false,
  },
];

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const mockInspections: Inspection[] = [
  {
    id: 'insp-1',
    module: ModuleType.SEGURANCA_TRABALHO,
    checklistId: 'checklist-1',
    teamId: 'team-1',
    serviceDescription: 'Vistoria de segurança na obra residencial',
    locationDescription: 'Rua das Flores, 123',
    collaboratorIds: ['collab-1', 'collab-2'],
    status: InspectionStatus.FINALIZADA,
    scorePercent: 100,
    createdByUserId: 'user-3',
    createdAt: lastWeek.toISOString(),
    updatedAt: lastWeek.toISOString(),
    finalizedAt: lastWeek.toISOString(),
  },
  {
    id: 'insp-2',
    module: ModuleType.OBRAS_INVESTIMENTO,
    checklistId: 'checklist-3',
    teamId: 'team-2',
    serviceDescription: 'Vistoria de obras de investimento',
    locationDescription: 'Av. Principal, 456',
    collaboratorIds: ['collab-3', 'collab-4', 'collab-5'],
    status: InspectionStatus.PENDENTE_AJUSTE,
    scorePercent: 67,
    createdByUserId: 'user-3',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
    finalizedAt: yesterday.toISOString(),
  },
  {
    id: 'insp-3',
    module: ModuleType.CANTEIRO,
    checklistId: 'checklist-5',
    teamId: 'team-1',
    serviceDescription: 'Vistoria de canteiro de obras',
    locationDescription: 'Rua Nova, 789',
    collaboratorIds: ['collab-6'],
    status: InspectionStatus.RESOLVIDA,
    scorePercent: 83,
    createdByUserId: 'user-3',
    createdAt: lastWeek.toISOString(),
    updatedAt: yesterday.toISOString(),
    finalizedAt: lastWeek.toISOString(),
  },
  {
    id: 'insp-4',
    module: ModuleType.SEGURANCA_TRABALHO,
    checklistId: 'checklist-1',
    teamId: 'team-3',
    serviceDescription: 'Vistoria de segurança',
    status: InspectionStatus.RASCUNHO,
    scorePercent: 0,
    createdByUserId: 'user-3',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

export const mockInspectionItems: InspectionItem[] = [
  // Insp 1 - Finalizada (100%)
  {
    id: 'insp-item-1',
    inspectionId: 'insp-1',
    checklistItemId: 'item-1',
    answer: ChecklistAnswer.CONFORME,
    notes: 'Todos os colaboradores usando EPI adequado',
  },
  {
    id: 'insp-item-2',
    inspectionId: 'insp-1',
    checklistItemId: 'item-2',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-3',
    inspectionId: 'insp-1',
    checklistItemId: 'item-3',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-4',
    inspectionId: 'insp-1',
    checklistItemId: 'item-4',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-5',
    inspectionId: 'insp-1',
    checklistItemId: 'item-5',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-6',
    inspectionId: 'insp-1',
    checklistItemId: 'item-6',
    answer: ChecklistAnswer.CONFORME,
  },
  // Insp 2 - Pendente Ajuste (67%)
  {
    id: 'insp-item-7',
    inspectionId: 'insp-2',
    checklistItemId: 'item-13',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-8',
    inspectionId: 'insp-2',
    checklistItemId: 'item-14',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-9',
    inspectionId: 'insp-2',
    checklistItemId: 'item-15',
    answer: ChecklistAnswer.NAO_CONFORME,
    notes: 'Materiais de qualidade inferior encontrados',
  },
  {
    id: 'insp-item-10',
    inspectionId: 'insp-2',
    checklistItemId: 'item-16',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-11',
    inspectionId: 'insp-2',
    checklistItemId: 'item-17',
    answer: ChecklistAnswer.NAO_CONFORME,
    notes: 'Documentação incompleta',
  },
  {
    id: 'insp-item-12',
    inspectionId: 'insp-2',
    checklistItemId: 'item-18',
    answer: ChecklistAnswer.NAO_APLICAVEL,
  },
  // Insp 3 - Resolvida (83%)
  {
    id: 'insp-item-13',
    inspectionId: 'insp-3',
    checklistItemId: 'item-25',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-14',
    inspectionId: 'insp-3',
    checklistItemId: 'item-26',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-15',
    inspectionId: 'insp-3',
    checklistItemId: 'item-27',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-16',
    inspectionId: 'insp-3',
    checklistItemId: 'item-28',
    answer: ChecklistAnswer.CONFORME,
  },
  {
    id: 'insp-item-17',
    inspectionId: 'insp-3',
    checklistItemId: 'item-29',
    answer: ChecklistAnswer.NAO_CONFORME,
    notes: 'Acesso bloqueado por materiais',
  },
  {
    id: 'insp-item-18',
    inspectionId: 'insp-3',
    checklistItemId: 'item-30',
    answer: ChecklistAnswer.NAO_APLICAVEL,
  },
];

export const mockEvidences: Evidence[] = [
  {
    id: 'evid-1',
    inspectionId: 'insp-1',
    inspectionItemId: 'insp-item-1',
    fileName: 'epi-1.jpg',
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    createdAt: lastWeek.toISOString(),
  },
  {
    id: 'evid-2',
    inspectionId: 'insp-2',
    inspectionItemId: 'insp-item-9',
    fileName: 'materiais-1.jpg',
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    createdAt: yesterday.toISOString(),
  },
  {
    id: 'evid-3',
    inspectionId: 'insp-2',
    fileName: 'geral-1.jpg',
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    createdAt: yesterday.toISOString(),
  },
];

export const mockSignatures: Signature[] = [
  {
    id: 'sig-1',
    inspectionId: 'insp-1',
    signerName: 'João Silva',
    signerRoleLabel: 'Líder de Equipe',
    imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signedAt: lastWeek.toISOString(),
  },
  {
    id: 'sig-2',
    inspectionId: 'insp-2',
    signerName: 'Maria Santos',
    signerRoleLabel: 'Encarregado',
    imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signedAt: yesterday.toISOString(),
  },
  {
    id: 'sig-3',
    inspectionId: 'insp-3',
    signerName: 'Carlos Mendes',
    signerRoleLabel: 'Líder de Equipe',
    imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signedAt: lastWeek.toISOString(),
  },
];

export const mockPendingAdjustments: PendingAdjustment[] = [
  {
    inspectionId: 'insp-2',
    status: InspectionStatus.PENDENTE_AJUSTE,
  },
  {
    inspectionId: 'insp-3',
    status: InspectionStatus.RESOLVIDA,
    resolvedAt: yesterday.toISOString(),
    resolutionNotes: 'Acesso desbloqueado e materiais reorganizados',
    resolutionEvidenceDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
  },
];
