import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { router } from "./router";
import { useReferenceStore } from "@/stores/referenceStore";
import { useAuthStore } from "@/stores/authStore";
import { canOpenPath, firstVisibleRoute } from "@/domain/rules/access-area";
import { API_ERROR_EVENT } from "@/api/apiClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { appTheme } from "./theme";

function App(): JSX.Element {
  const loadCache = useReferenceStore((state) => state.loadCache);
  const refreshFromApi = useReferenceStore((state) => state.refreshFromApi);
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    const bootstrap = async () => {
      await loadCache();
      if (navigator.onLine) {
        await refreshFromApi();
      }
      if (sessionStorage.getItem("auth_token")) {
        try {
          await loadMe();
        } catch {
          useAuthStore.getState().logout();
        }
      }
    };
    bootstrap();
  }, [loadCache, loadMe, refreshFromApi]);

  useEffect(() => {
    let lastPath = router.state.location.pathname;
    return router.subscribe((state) => {
      const path = state.location.pathname;
      if (path === lastPath || path === "/login") return;
      lastPath = path;
      if (!sessionStorage.getItem("auth_token")) return;
      void (async () => {
        try {
          await useAuthStore.getState().loadMe();
        } catch {
          return;
        }
        const current = useAuthStore.getState().user;
        if (canOpenPath(current, path)) return;
        const next = firstVisibleRoute(current);
        if (next && next !== path) {
          await router.navigate(next, { replace: true });
        }
      })();
    });
  }, []);

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
    <ThemeProvider theme={appTheme}>
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
