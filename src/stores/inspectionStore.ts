import { appRepository } from "@/repositories/AppRepository";
import { Evidence, Inspection, InspectionItem, Signature } from "@/domain";
import { create } from "zustand";

interface InspectionState {
  currentInspection: Inspection | null;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  signature: Signature | null;
  load: (externalId: string) => Promise<void>;
  setItemsAndAutosave: (items: InspectionItem[]) => Promise<void>;
  addEvidence: (evidence: Evidence) => Promise<void>;
  removeEvidence: (evidenceId: string) => Promise<void>;
  saveSignature: (signature: Signature) => Promise<void>;
  clear: () => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  currentInspection: null,
  inspectionItems: [],
  evidences: [],
  signature: null,

  load: async (externalId) => {
    const [inspection, items, evidences, signature] = await Promise.all([
      appRepository.getInspection(externalId),
      appRepository.getInspectionItems(externalId),
      appRepository.getEvidences(externalId),
      appRepository.getSignature(externalId),
    ]);
    set({
      currentInspection: inspection,
      inspectionItems: items,
      evidences,
      signature,
    });
  },

  setItemsAndAutosave: async (items) => {
    const externalId = get().currentInspection?.externalId;
    if (!externalId) {
      return;
    }
    await appRepository.setInspectionItems(externalId, items);
    set({ inspectionItems: items });
  },

  addEvidence: async (evidence) => {
    const saved = await appRepository.saveEvidence(evidence);
    set((state) => ({ evidences: [...state.evidences, saved] }));
  },

  removeEvidence: async (evidenceId) => {
    await appRepository.removeEvidence(evidenceId);
    set((state) => ({
      evidences: state.evidences.filter((evidence) => evidence.id !== evidenceId),
    }));
  },

  saveSignature: async (signature) => {
    const saved = await appRepository.saveSignature(signature);
    set({ signature: saved });
  },

  clear: () =>
    set({
      currentInspection: null,
      inspectionItems: [],
      evidences: [],
      signature: null,
    }),
}));
