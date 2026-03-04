import { appRepository } from "@/repositories/AppRepository";
import { Checklist, Sector, ServiceOrder, Team } from "@/domain";
import { create } from "zustand";

interface ReferenceState {
  teams: Team[];
  sectors: Sector[];
  checklists: Checklist[];
  serviceOrders: ServiceOrder[];
  loading: boolean;
  loadCache: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
  loadServiceOrders: () => Promise<void>;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  teams: [],
  sectors: [],
  checklists: [],
  serviceOrders: [],
  loading: false,

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

  loadServiceOrders: async () => {
    if (!navigator.onLine) {
      set({ serviceOrders: [] });
      return;
    }
    try {
      const result = await appRepository.getServiceOrders({ page: 1, limit: 100 });
      set({ serviceOrders: result.data });
    } catch {
      set({ serviceOrders: [] });
    }
  },
}));
