import { appRepository } from "@/repositories/AppRepository";
import { Checklist, Sector, ServiceOrder, Team } from "@/domain";
import { ModuleType } from "@/domain/enums";
import { create } from "zustand";

interface ReferenceState {
  teams: Team[];
  sectors: Sector[];
  checklists: Checklist[];
  serviceOrders: ServiceOrder[];
  loading: boolean;
  serviceOrdersLoading: boolean;
  loadCache: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
  loadServiceOrders: (sectorId?: string, module?: ModuleType) => Promise<void>;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  teams: [],
  sectors: [],
  checklists: [],
  serviceOrders: [],
  loading: false,
  serviceOrdersLoading: false,

  loadCache: async () => {
    set({ loading: true });
    try {
      const [teams, sectors, checklists] = await Promise.all([
        appRepository.loadTeams(),
        appRepository.loadSectors(),
        appRepository.loadChecklists(),
      ]);
      set({ teams, sectors, checklists });
    } finally {
      set({ loading: false });
    }
  },

  refreshFromApi: async () => {
    set({ loading: true });
    try {
      const [teams, sectors, checklists] = await Promise.all([
        appRepository.loadTeams(),
        appRepository.loadSectors(),
        appRepository.loadChecklists(),
      ]);
      set({ teams, sectors, checklists });
    } finally {
      set({ loading: false });
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
