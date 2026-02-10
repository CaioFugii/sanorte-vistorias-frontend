import { create } from 'zustand';
import { Inspection, InspectionItem, Evidence, Signature } from '@/domain';

interface InspectionState {
  currentInspection: Inspection | null;
  inspectionItems: InspectionItem[];
  currentEvidences: Evidence[];
  currentSignature: Signature | null;
  setCurrentInspection: (inspection: Inspection | null) => void;
  setInspectionItems: (items: InspectionItem[]) => void;
  updateInspectionItem: (itemId: string, updates: Partial<InspectionItem>) => void;
  addEvidence: (evidence: Evidence) => void;
  removeEvidence: (evidenceId: string) => void;
  setSignature: (signature: Signature | null) => void;
  clearCurrentInspection: () => void;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  currentInspection: null,
  inspectionItems: [],
  currentEvidences: [],
  currentSignature: null,

  setCurrentInspection: (inspection) =>
    set({ currentInspection: inspection }),

  setInspectionItems: (items) => set({ inspectionItems: items }),

  updateInspectionItem: (itemId, updates) =>
    set((state) => ({
      inspectionItems: state.inspectionItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    })),

  addEvidence: (evidence) =>
    set((state) => ({
      currentEvidences: [...state.currentEvidences, evidence],
    })),

  removeEvidence: (evidenceId) =>
    set((state) => ({
      currentEvidences: state.currentEvidences.filter(
        (e) => e.id !== evidenceId
      ),
    })),

  setSignature: (signature) => set({ currentSignature: signature }),

  clearCurrentInspection: () =>
    set({
      currentInspection: null,
      inspectionItems: [],
      currentEvidences: [],
      currentSignature: null,
    }),
}));
