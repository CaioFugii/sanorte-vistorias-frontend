import { appRepository } from "@/repositories/AppRepository";
import { Checklist, Sector, ServiceOrder, Team } from "@/domain";
import { ModuleType } from "@/domain/enums";
import { create } from "zustand";

const SECTORS_LOAD_ERROR = "Não foi possível carregar os setores.";

interface ReferenceState {
  teams: Team[];
  sectors: Sector[];
  checklists: Checklist[];
  serviceOrders: ServiceOrder[];
  loading: boolean;
  sectorsLoading: boolean;
  sectorsLoaded: boolean;
  sectorsError: string | null;
  serviceOrdersLoading: boolean;
  loadCache: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
  reloadSectors: () => Promise<void>;
  loadServiceOrders: (sectorId?: string, module?: ModuleType) => Promise<void>;
}

async function loadReferences(
  set: (
    partial:
      | Partial<ReferenceState>
      | ((state: ReferenceState) => Partial<ReferenceState>)
  ) => void,
  get: () => ReferenceState
): Promise<void> {
  set({ loading: true });
  try {
    await Promise.allSettled([
      appRepository.loadTeams().then((teams) => set({ teams })),
      appRepository
        .loadSectors()
        .then((sectors) => set({ sectors, sectorsError: null, sectorsLoaded: true }))
        .catch(() => {
          set({
            sectorsError: get().sectors.length === 0 ? SECTORS_LOAD_ERROR : null,
            sectorsLoaded: true,
          });
        }),
      appRepository.loadChecklists().then((checklists) => set({ checklists })),
    ]);
  } finally {
    set({ loading: false });
  }
}

export const useReferenceStore = create<ReferenceState>((set, get) => ({
  teams: [],
  sectors: [],
  checklists: [],
  serviceOrders: [],
  loading: false,
  sectorsLoading: false,
  sectorsLoaded: false,
  sectorsError: null,
  serviceOrdersLoading: false,

  loadCache: () => loadReferences(set, get),

  refreshFromApi: () => loadReferences(set, get),

  reloadSectors: async () => {
    set({ sectorsLoading: true, sectorsError: null });
    try {
      const sectors = await appRepository.loadSectors();
      set({ sectors, sectorsError: null, sectorsLoaded: true });
    } catch {
      set({
        sectorsError: get().sectors.length === 0 ? SECTORS_LOAD_ERROR : null,
        sectorsLoaded: true,
      });
    } finally {
      set({ sectorsLoading: false });
    }
  },

  loadServiceOrders: async (sectorId?: string, module?: ModuleType) => {
    if (!sectorId?.trim()) {
      set({ serviceOrders: [], serviceOrdersLoading: false });
      return;
    }
    if (!navigator.onLine) {
      set({ serviceOrders: [], serviceOrdersLoading: false });
      return;
    }
    set({ serviceOrdersLoading: true });
    try {
      const params: {
        sectorId: string;
        page: number;
        limit: number;
        field?: boolean;
        remote?: boolean;
        postWork?: boolean;
      } = { sectorId, page: 1, limit: 100 };
      // Apenas CAMPO, REMOTO e POS_OBRA: filtrar OS ainda não atreladas a vistoria do módulo
      if (module === ModuleType.CAMPO) params.field = false;
      else if (module === ModuleType.REMOTO) params.remote = false;
      else if (module === ModuleType.POS_OBRA) params.postWork = false;
      const result = await appRepository.getServiceOrders(params);
      set({ serviceOrders: result.data });
    } catch {
      set({ serviceOrders: [] });
    } finally {
      set({ serviceOrdersLoading: false });
    }
  },
}));
