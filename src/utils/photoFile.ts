export interface PhotoFile {
  id: string;
  /** Preview local (base64); quando há upload no Cloudinary use `url`. */
  dataUrl?: string;
  /** URL do Cloudinary após upload. */
  url?: string;
  fileName: string;
  mimeType: string;
  evidenceId?: string;
  inspectionItemId?: string;
  cloudinaryPublicId?: string;
  size?: number;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}

/** Retorna a URL para exibição da imagem (Cloudinary ou dataUrl). */
export function getPhotoDisplayUrl(photo: PhotoFile): string {
  return photo.url ?? photo.dataUrl ?? "";
}

/** Converte Evidence (do store/offline) em PhotoFile para o PhotoUploader. */
export function evidenceToPhotoFile(evidence: {
  id: string;
  inspectionItemId?: string;
  fileName: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  cloudinaryPublicId?: string;
  size?: number;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}): PhotoFile {
  return {
    id: evidence.id,
    dataUrl: evidence.dataUrl,
    url: evidence.url,
    fileName: evidence.fileName,
    mimeType: evidence.mimeType,
    evidenceId: evidence.id,
    inspectionItemId: evidence.inspectionItemId,
    cloudinaryPublicId: evidence.cloudinaryPublicId,
    size: evidence.size ?? evidence.bytes,
    bytes: evidence.bytes,
    format: evidence.format,
    width: evidence.width,
    height: evidence.height,
  };
}
