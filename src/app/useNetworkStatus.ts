import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";

export function useNetworkStatus(): void {
  const setIsOffline = useUiStore((state) => state.setIsOffline);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setIsOffline]);
}
