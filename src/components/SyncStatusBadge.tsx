import { Chip } from "@mui/material";
import { SyncState } from "@/domain/enums";

const colorByState: Record<SyncState, "default" | "info" | "success" | "error" | "warning"> =
  {
    [SyncState.PENDING_SYNC]: "warning",
    [SyncState.SYNCING]: "info",
    [SyncState.SYNCED]: "success",
    [SyncState.SYNC_ERROR]: "error",
  };

function isSyncState(value: unknown): value is SyncState {
  return typeof value === "string" && Object.values(SyncState).includes(value as SyncState);
}

export function SyncStatusBadge({ state }: { state?: SyncState | null }): JSX.Element {
  const normalizedState = isSyncState(state) ? state : undefined;
  const label = normalizedState ? normalizedState.replace(/_/g, " ") : "SEM STATUS";
  const color = normalizedState ? colorByState[normalizedState] : "default";

  return <Chip size="small" color={color} label={label} />;
}
