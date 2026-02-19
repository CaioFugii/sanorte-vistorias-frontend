import { SyncInspectionResult, SyncInspectionPayload } from "@/domain";
import { SyncState } from "@/domain/enums";
import { ApiRepository } from "@/api/repositories/ApiRepository";
import { OfflineRepository } from "../repositories/OfflineRepository";
import { OFFLINE_RETENTION_DAYS } from "../constants";

export class SyncService {
  constructor(
    private readonly offlineRepository: OfflineRepository,
    private readonly apiRepository: ApiRepository
  ) {}

  async syncAll(): Promise<SyncInspectionResult[]> {
    if (!navigator.onLine) {
      throw new Error("Sem conexão com a internet para sincronizar.");
    }

    const pendingInspections = await this.offlineRepository.getInspectionsToSync();
    const payload: SyncInspectionPayload[] = [];

    for (const inspection of pendingInspections) {
      await this.offlineRepository.updateInspection(inspection.externalId, {
        syncState: SyncState.SYNCING,
        syncErrorMessage: undefined,
      });
      const inspectionItems = await this.offlineRepository.getInspectionItems(
        inspection.externalId
      );
      const evidences = await this.offlineRepository.getEvidences(inspection.externalId);
      const signature = await this.offlineRepository.getSignature(inspection.externalId);
      payload.push({ inspection, inspectionItems, evidences, signature });
    }

    if (payload.length === 0) {
      return [];
    }

    try {
      const results = await this.apiRepository.syncInspections(payload);
      const resultMap = new Map(results.map((result) => [result.externalId, result]));
      const now = new Date().toISOString();

      for (const inspection of pendingInspections) {
        const result = resultMap.get(inspection.externalId);
        if (result?.status === "ERROR") {
          await this.offlineRepository.updateInspection(inspection.externalId, {
            syncState: SyncState.SYNC_ERROR,
            syncErrorMessage: result.message || "Erro de sincronização.",
          });
          continue;
        }
        await this.offlineRepository.updateInspection(inspection.externalId, {
          serverId: result?.serverId ?? inspection.serverId,
          syncState: SyncState.SYNCED,
          syncedAt: now,
          syncErrorMessage: undefined,
        });
      }
      await this.offlineRepository.markSyncMetadata("lastSyncAt", now);
      await this.offlineRepository.purgeSyncedOlderThanDays(OFFLINE_RETENTION_DAYS);
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha na sincronização.";
      for (const inspection of pendingInspections) {
        await this.offlineRepository.updateInspection(inspection.externalId, {
          syncState: SyncState.SYNC_ERROR,
          syncErrorMessage: message,
        });
      }
      throw error;
    }
  }
}
