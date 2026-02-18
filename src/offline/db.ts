import Dexie, { Table } from "dexie";
import {
  Checklist,
  Evidence,
  Inspection,
  InspectionItem,
  Signature,
  Team,
} from "@/domain";

export interface SyncMetadata {
  key: string;
  value: string;
}

class AppDexie extends Dexie {
  teams!: Table<Team, string>;
  checklists!: Table<Checklist, string>;
  inspections!: Table<Inspection, string>;
  inspectionItems!: Table<InspectionItem, string>;
  evidences!: Table<Evidence, string>;
  signatures!: Table<Signature, string>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("sanorte-vistorias-db");
    this.version(1).stores({
      teams: "id, active, updatedAt",
      checklists: "id, module, updatedAt",
      inspections:
        "externalId, serverId, syncState, status, createdAt, updatedAt, teamId, createdByUserId",
      inspectionItems: "id, inspectionExternalId, checklistItemId, updatedAt",
      evidences: "id, inspectionExternalId, inspectionItemId, createdAt",
      signatures: "id, inspectionExternalId, signedAt",
      syncMetadata: "key",
    });
    this.version(2).stores({
      teams: "id, name, active, updatedAt",
      checklists: "id, module, updatedAt",
      inspections:
        "externalId, serverId, syncState, status, createdAt, updatedAt, teamId, createdByUserId",
      inspectionItems: "id, inspectionExternalId, checklistItemId, updatedAt",
      evidences: "id, inspectionExternalId, inspectionItemId, createdAt",
      signatures: "id, inspectionExternalId, signedAt",
      syncMetadata: "key",
    });
  }
}

export const db = new AppDexie();
