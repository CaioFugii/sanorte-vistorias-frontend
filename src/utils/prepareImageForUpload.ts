/** Limite seguro para evidências e uploads típicos (alinha à API ~5MB). */
export const PREPARE_IMAGE_DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/** Rotas como referência de checklist / POST /uploads costumam aceitar até 10MB. */
export const PREPARE_IMAGE_MAX_BYTES_UPLOADS = 10 * 1024 * 1024;

const DEFAULT_MAX_EDGE = 1920;

export interface PrepareImageOptions {
  maxEdge?: number;
  maxBytes?: number;
}

/**
 * Redimensiona e reencoda em JPEG para reduzir bytes antes de multipart/API.
 * Em falha de decode ou canvas, devolve o arquivo original.
 */
export async function prepareImageForUpload(
  file: File,
  options?: PrepareImageOptions
): Promise<File> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = options?.maxBytes ?? PREPARE_IMAGE_DEFAULT_MAX_BYTES;

  if (!file.type.startsWith("image/")) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const largest = Math.max(bitmap.width, bitmap.height);

  try {
    if (file.size <= maxBytes && largest <= maxEdge && file.type === "image/jpeg") {
      return file;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    const scale0 = Math.min(1, maxEdge / largest);
    let cw = Math.round(bitmap.width * scale0);
    let ch = Math.round(bitmap.height * scale0);
    const baseName = file.name.replace(/\.[^.]+$/i, "") || "image";

    for (let sizeAttempt = 0; sizeAttempt < 12; sizeAttempt++) {
      canvas.width = cw;
      canvas.height = ch;
      ctx.drawImage(bitmap, 0, 0, cw, ch);

      for (let q = 0.92; q >= 0.42; q -= 0.06) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", q)
        );
        if (blob && blob.size <= maxBytes) {
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      cw = Math.round(cw * 0.82);
      ch = Math.round(ch * 0.82);
      if (cw < 480 && ch < 480) {
        break;
      }
    }

    canvas.width = cw;
    canvas.height = ch;
    ctx.drawImage(bitmap, 0, 0, cw, ch);
    const fallback = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.42)
    );
    if (fallback) {
      return new File([fallback], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
    return file;
  } finally {
    bitmap.close();
  }
}
