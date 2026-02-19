import { db } from "../db";
import {
  Checklist,
  Evidence,
  Inspection,
  InspectionItem,
  Signature,
  Team,
} from "@/domain";
import { InspectionStatus, SyncState } from "@/domain/enums";

export class OfflineRepository {
  async cacheTeams(teams: Team[]): Promise<void> {
    await db.transaction("rw", db.teams, async () => {
      await db.teams.clear();
      if (teams.length > 0) {
        await db.teams.bulkPut(teams);
      }
    });
  }

  async getTeams(): Promise<Team[]> {
    const teams = await db.teams.toArray();
    return teams.sort((a, b) => a.name.localeCompare(b.name));
  }

  async cacheChecklists(checklists: Checklist[]): Promise<void> {
    await db.transaction("rw", db.checklists, async () => {
      await db.checklists.clear();
      if (checklists.length > 0) {
        await db.checklists.bulkPut(checklists);
      }
    });
  }

  async getChecklists(): Promise<Checklist[]> {
    return db.checklists.toArray();
  }

  async getChecklistById(id: string): Promise<Checklist | undefined> {
    return db.checklists.get(id);
  }

  async createInspection(input: Inspection): Promise<Inspection> {
    await db.inspections.put(input);
    return input;
  }

  async updateInspection(
    externalId: string,
    updates: Partial<Inspection>
  ): Promise<Inspection> {
    const current = await db.inspections.get(externalId);
    if (!current) {
      throw new Error("Vistoria não encontrada no banco local.");
    }
    const next: Inspection = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.inspections.put(next);
    return next;
  }

  async getInspectionByExternalId(externalId: string): Promise<Inspection | undefined> {
    return db.inspections.get(externalId);
  }

  async listInspections(): Promise<Inspection[]> {
    return db.inspections.orderBy("createdAt").reverse().toArray();
  }

  async listInspectionsByUser(userId: string): Promise<Inspection[]> {
    return db.inspections.where("createdByUserId").equals(userId).toArray();
  }

  async listPendingAdjustments(): Promise<Inspection[]> {
    return db.inspections.where("status").equals(InspectionStatus.PENDENTE_AJUSTE).toArray();
  }

  async getInspectionsToSync(): Promise<Inspection[]> {
    return db.inspections
      .filter(
        (inspection) =>
          inspection.syncState === SyncState.PENDING_SYNC ||
          inspection.syncState === SyncState.SYNC_ERROR
      )
      .toArray();
  }

  async replaceInspectionItems(
    inspectionExternalId: string,
    items: InspectionItem[]
  ): Promise<void> {
    const existing = await db.inspectionItems
      .where("inspectionExternalId")
      .equals(inspectionExternalId)
      .toArray();
    if (existing.length > 0) {
      await db.inspectionItems.bulkDelete(existing.map((item) => item.id));
    }
    if (items.length > 0) {
      await db.inspectionItems.bulkPut(items);
    }
  }

  async getInspectionItems(inspectionExternalId: string): Promise<InspectionItem[]> {
    return db.inspectionItems.where("inspectionExternalId").equals(inspectionExternalId).toArray();
  }

  async saveEvidence(evidence: Evidence): Promise<Evidence> {
    await db.evidences.put(evidence);
    return evidence;
  }

  async deleteEvidence(evidenceId: string): Promise<void> {
    await db.evidences.delete(evidenceId);
  }

  async getEvidences(inspectionExternalId: string): Promise<Evidence[]> {
    return db.evidences.where("inspectionExternalId").equals(inspectionExternalId).toArray();
  }

  async saveSignature(signature: Signature): Promise<Signature> {
    await db.signatures.put(signature);
    return signature;
  }

  async getSignature(inspectionExternalId: string): Promise<Signature | null> {
    const signature = await db.signatures.where("inspectionExternalId").equals(inspectionExternalId).first();
    return signature ?? null;
  }

  async markSyncMetadata(key: string, value: string): Promise<void> {
    await db.syncMetadata.put({ key, value });
  }

  /**
   * Remove do banco local todos os dados de uma vistoria (assinatura, evidências, itens e a própria vistoria).
   * Usado ao fazer purge de vistorias já sincronizadas e antigas.
   */
  async deleteInspectionData(externalId: string): Promise<void> {
    await db.transaction(
      "rw",
      db.inspections,
      db.inspectionItems,
      db.evidences,
      db.signatures,
      async () => {
        const sig = await db.signatures.where("inspectionExternalId").equals(externalId).first();
        if (sig) await db.signatures.delete(sig.id);
        const evs = await db.evidences.where("inspectionExternalId").equals(externalId).toArray();
        if (evs.length > 0) await db.evidences.bulkDelete(evs.map((e) => e.id));
        const items = await db.inspectionItems.where("inspectionExternalId").equals(externalId).toArray();
        if (items.length > 0) await db.inspectionItems.bulkDelete(items.map((i) => i.id));
        await db.inspections.delete(externalId);
      }
    );
  }

  /**
   * Remove vistorias já sincronizadas (SYNCED) mais antigas que `retentionDays` dias.
   * Não remove nunca vistorias PENDING_SYNC ou SYNC_ERROR.
   * Retorna a quantidade de vistorias removidas.
   */
  async purgeSyncedOlderThanDays(retentionDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffIso = cutoff.toISOString();

    const toDelete = await db.inspections
      .where("syncState")
      .equals(SyncState.SYNCED)
      .filter(
        (inspection) =>
          (inspection.syncedAt ?? inspection.updatedAt ?? inspection.createdAt) < cutoffIso
      )
      .toArray();

    for (const inspection of toDelete) {
      await this.deleteInspectionData(inspection.externalId);
    }
    return toDelete.length;
  }
}
