import axios from "axios";

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || "http://localhost:3000",
  timeout: 30000,
});

const API_ERROR_EVENT = "app:api-error";

function getFriendlyErrorMessage(error: unknown): string {
  const fallback = "Não foi possível concluir a operação. Tente novamente.";
  if (!error || typeof error !== "object") return fallback;
  const maybeAxios = error as {
    code?: string;
    response?: {
      status?: number;
      data?: {
        message?: string | string[];
      };
    };
  };

  if (maybeAxios.code === "ECONNABORTED") {
    return "A operação demorou mais do que o esperado. Tente novamente.";
  }
  if (!maybeAxios.response) {
    return "Sem conexão com o servidor. Verifique sua internet.";
  }

  const message = maybeAxios.response.data?.message;
  const rawMessage = Array.isArray(message) && message.length > 0 ? message[0] : message;
  if (typeof rawMessage === "string" && rawMessage.trim()) {
    const normalized = rawMessage.toLowerCase();
    if (
      normalized.includes("equipe empreiteira não pode ter colaboradores vinculados") ||
      normalized.includes("equipe empreiteira não permite vínculo de colaboradores")
    ) {
      return "Equipe empreiteira não permite colaboradores vinculados. Desmarque essa opção ou limpe os colaboradores.";
    }
    return rawMessage;
  }

  switch (maybeAxios.response.status) {
    case 400:
      return "Os dados informados são inválidos.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "Recurso não encontrado.";
    case 409:
      return "Esta operação não pode ser concluída devido a conflito de dados.";
    case 422:
      return "Não foi possível processar os dados enviados.";
    case 500:
      return "Ocorreu um erro interno no servidor. Tente novamente em instantes.";
    default:
      return fallback;
  }
}

function dispatchApiError(message: string): void {
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message } }));
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return Promise.reject(error);
    }
    dispatchApiError(getFriendlyErrorMessage(error));
    return Promise.reject(error);
  }
);

export { API_ERROR_EVENT };
