import { appRepository } from "@/repositories/AppRepository";
import { Evidence, Inspection, InspectionItem, Signature } from "@/domain";
import { create } from "zustand";

interface InspectionState {
  currentInspection: Inspection | null;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  signature: Signature | null;
  load: (externalId: string) => Promise<void>;
  setItems: (items: InspectionItem[]) => void;
  saveItems: () => Promise<void>;
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
    const [inspection, localItems, localEvidences, localSignature] = await Promise.all([
      appRepository.getInspection(externalId),
      appRepository.getInspectionItems(externalId),
      appRepository.getEvidences(externalId),
      appRepository.getSignature(externalId),
    ]);

    const inspectionItemsFromApi =
      inspection?.items?.map((item) => ({
        ...item,
        inspectionExternalId: item.inspectionExternalId ?? inspection.externalId,
        updatedAt: item.updatedAt ?? inspection.updatedAt ?? new Date().toISOString(),
      })) ?? [];

    const evidencesFromApi =
      inspection?.evidences?.map((evidence) => ({
        ...evidence,
        inspectionExternalId: evidence.inspectionExternalId ?? inspection.externalId,
        createdAt: evidence.createdAt ?? inspection.updatedAt ?? new Date().toISOString(),
      })) ?? [];

    const signatureFromApi = inspection?.signatures?.[0]
      ? {
          ...inspection.signatures[0],
          inspectionExternalId:
            inspection.signatures[0].inspectionExternalId ?? inspection.externalId,
          signedAt:
            inspection.signatures[0].signedAt ?? inspection.updatedAt ?? new Date().toISOString(),
        }
      : null;

    const finalSignature = localSignature ?? signatureFromApi;

    set({
      currentInspection: inspection,
      inspectionItems: localItems.length > 0 ? localItems : inspectionItemsFromApi,
      evidences: localEvidences.length > 0 ? localEvidences : evidencesFromApi,
      signature: finalSignature,
    });
  },

  setItems: (items) => {
    set({ inspectionItems: items });
  },

  saveItems: async () => {
    const externalId = get().currentInspection?.externalId;
    const items = get().inspectionItems;
    if (!externalId || items.length === 0) {
      return;
    }
    await appRepository.setInspectionItems(externalId, items);
  },

  addEvidence: async (evidence) => {
    set((state) => ({ evidences: [...state.evidences, evidence] }));
  },

  removeEvidence: async (evidenceId) => {
    const externalId = get().currentInspection?.externalId;
    if (!externalId) {
      return;
    }
    await appRepository.removeEvidence(externalId, evidenceId);
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
