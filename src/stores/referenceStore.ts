import { appRepository } from "@/repositories/AppRepository";
import { Checklist, Team } from "@/domain";
import { create } from "zustand";

interface ReferenceState {
  teams: Team[];
  checklists: Checklist[];
  loading: boolean;
  loadCache: () => Promise<void>;
  refreshFromApi: () => Promise<void>;
}

export const useReferenceStore = create<ReferenceState>((set) => ({
  teams: [],
  checklists: [],
  loading: false,

  loadCache: async () => {
    const [teams, checklists] = await Promise.all([
      appRepository.getCachedTeams(),
      appRepository.getCachedChecklists(),
    ]);
    set({ teams, checklists });
  },

  refreshFromApi: async () => {
    set({ loading: true });
    try {
      const [teams, checklists] = await Promise.all([
        appRepository.loadTeams(true),
        appRepository.loadChecklists(true),
      ]);
      set({ teams, checklists });
    } finally {
      set({ loading: false });
    }
  },
}));
