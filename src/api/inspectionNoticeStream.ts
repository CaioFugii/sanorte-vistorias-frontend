import { InspectionNotice } from "@/domain";

function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
}

function authToken(): string | null {
  return sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
}

export async function openInspectionNoticeStream(
  onNotice: (notice: InspectionNotice) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = authToken();
  if (!token) return;

  const response = await fetch(`${apiBaseUrl()}/inspection-notices/stream`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("Não foi possível abrir o aviso da pendência.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const dataLine = part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!dataLine) continue;
      try {
        onNotice(JSON.parse(dataLine) as InspectionNotice);
      } catch {
        // evento malformado não interrompe o stream
      }
    }
  }
}
