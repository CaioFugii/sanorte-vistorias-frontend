import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { router } from "./router";
import { useNetworkStatus } from "./useNetworkStatus";
import { useReferenceStore } from "@/stores/referenceStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { appRepository } from "@/repositories/AppRepository";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App(): JSX.Element {
  const loadCache = useReferenceStore((state) => state.loadCache);
  const refreshFromApi = useReferenceStore((state) => state.refreshFromApi);
  const loadMe = useAuthStore((state) => state.loadMe);
  const setPendingSyncCount = useUiStore((state) => state.setPendingSyncCount);
  useNetworkStatus();

  useEffect(() => {
    const bootstrap = async () => {
      await loadCache();
      if (navigator.onLine) {
        await refreshFromApi();
      }
      if (localStorage.getItem("auth_token")) {
        try {
          await loadMe();
        } catch {
          useAuthStore.getState().logout();
        }
      }
      const count = await appRepository.countPendingSync();
      setPendingSyncCount(count);
    };
    bootstrap();
  }, [loadCache, loadMe, refreshFromApi, setPendingSyncCount]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
