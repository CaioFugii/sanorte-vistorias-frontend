import { Alert } from "@mui/material";
import { useUiStore } from "@/stores/uiStore";

export function OfflineBanner(): JSX.Element | null {
  const isOffline = useUiStore((state) => state.isOffline);
  if (!isOffline) {
    return null;
  }
  return <Alert severity="warning">Sem internet: trabalhando em modo offline.</Alert>;
}
