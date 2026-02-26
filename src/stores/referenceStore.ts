import { appRepository } from "@/repositories/AppRepository";
import { Checklist, Sector, Team } from "@/domain";
import { create } from "zustand";

interface ReferenceState {
  teams: Team[];
  sectors: Sector[];
  checklists: Checklist[];
  loading: boolean;
  loadCache: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  teams: [],
  sectors: [],
  checklists: [],
  loading: false,

  loadCache: async () => {
    const [teams, sectors, checklists] = await Promise.all([
      appRepository.getCachedTeams(),
      appRepository.getCachedSectors(),
      appRepository.getCachedChecklists(),
    ]);
    set({ teams, sectors, checklists });
  },

  refreshFromApi: async () => {
    set({ loading: true });
    try {
      const [teams, sectors, checklists] = await Promise.all([
        appRepository.loadTeams(true),
        appRepository.loadSectors(true),
        appRepository.loadChecklists(true),
      ]);
      set({ teams, sectors, checklists });
    } finally {
      set({ loading: false });
    }
  },
}));
