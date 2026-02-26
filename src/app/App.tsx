import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { router } from "./router";
import { useNetworkStatus } from "./useNetworkStatus";
import { useReferenceStore } from "@/stores/referenceStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { appRepository } from "@/repositories/AppRepository";
import { API_ERROR_EVENT } from "@/api/apiClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      await appRepository.runRetentionCleanup();
    };
    bootstrap();
  }, [loadCache, loadMe, refreshFromApi, setPendingSyncCount]);

  useEffect(() => {
    const onApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message;
      if (!message) return;
      toast.error(message, { toastId: `api-error:${message}` });
    };
    window.addEventListener(API_ERROR_EVENT, onApiError);
    return () => window.removeEventListener(API_ERROR_EVENT, onApiError);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

export default App;
