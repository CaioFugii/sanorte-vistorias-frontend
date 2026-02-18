import { useEffect, useRef } from "react";
import { appRepository } from "@/repositories/AppRepository";
import { useUiStore } from "@/stores/uiStore";

/**
 * Sincronização automática quando o usuário está online.
 * - Ao voltar online (evento "online"), sincroniza se houver itens pendentes.
 * - Na montagem, se já estiver online e houver pendentes, sincroniza uma vez.
 * Deve ser usado apenas dentro do layout autenticado (ex.: AppShell).
 */
export function useAutoSync(): void {
  const setPendingSyncCount = useUiStore((state) => state.setPendingSyncCount);
  const syncingRef = useRef(false);

  useEffect(() => {
    const runSyncIfPending = async () => {
      if (syncingRef.current || !navigator.onLine) return;
      const count = await appRepository.countPendingSync();
      if (count === 0) return;
      syncingRef.current = true;
      try {
        await appRepository.syncAll();
      } catch {
        // Falha silenciosa; o usuário pode sincronizar manualmente
      } finally {
        syncingRef.current = false;
        const newCount = await appRepository.countPendingSync();
        setPendingSyncCount(newCount);
      }
    };

    // Uma vez ao montar, se já estiver online
    if (navigator.onLine) {
      runSyncIfPending();
    }

    const onOnline = () => {
      runSyncIfPending();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [setPendingSyncCount]);
}
