import { Alert, Box, Button, CircularProgress, IconButton, ImageList, ImageListItem } from "@mui/material";
import { Delete, PhotoCamera } from "@mui/icons-material";
import { useRef, useState } from "react";
import {
  prepareImageForUpload,
  PREPARE_IMAGE_DEFAULT_MAX_BYTES,
  type PrepareImageOptions,
} from "@/utils/prepareImageForUpload";

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

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onChange: (photos: PhotoFile[]) => void | Promise<void>;
  maxPhotos?: number;
  disabled?: boolean;
  /** Quando informado e online, faz upload no Cloudinary antes de adicionar a foto. */
  onUpload?: (file: File) => Promise<{
    /** Id da evidência persistida (API); evita duplicar entrada no estado ao usar o mesmo id do `PhotoUploader`. */
    id?: string;
    publicId: string;
    url: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  } | null>;
  /** Opções de compressão antes do envio (padrão ~5MB / 1920px). */
  prepareOptions?: PrepareImageOptions;
}

/** Limite do arquivo original antes de comprimir (evita carregar RAW enormes na memória). */
const MAX_INPUT_FILE_SIZE = 32 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const PhotoUploader = ({
  photos,
  onChange,
  maxPhotos = 10,
  disabled = false,
  onUpload,
  prepareOptions,
}: PhotoUploaderProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [limitHint, setLimitHint] = useState<string | null>(null);

  const busy = uploading || removingPhotoId !== null;
  const remainingSlots = Math.max(0, maxPhotos - photos.length);
  /** Com uma vaga só, `multiple` desliga a seleção múltipla no sistema (inclui muitos celulares). */
  const allowMultipleInPicker = remainingSlots > 1;

  const readFileAsDataUrl = (file: File): Promise<PhotoFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || "";
        resolve({
          id: crypto.randomUUID(),
          dataUrl,
          fileName: file.name,
          mimeType: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const outputLimit = prepareOptions?.maxBytes ?? PREPARE_IMAGE_DEFAULT_MAX_BYTES;
    const filtered = Array.from(files).filter(
      (f) =>
        f.type.startsWith("image/") &&
        ALLOWED_TYPES.includes(f.type) &&
        f.size <= MAX_INPUT_FILE_SIZE
    );
    if (filtered.length > remainingSlots && remainingSlots >= 0) {
      setLimitHint(
        remainingSlots === 0
          ? "Limite de fotos atingido."
          : `Você pode adicionar no máximo mais ${remainingSlots} foto(s). As demais seleções foram ignoradas.`
      );
    } else {
      setLimitHint(null);
    }
    const toProcess = filtered.slice(0, remainingSlots);

    const willUpload = Boolean(onUpload && navigator.onLine && toProcess.length > 0);
    if (willUpload) setUploading(true);

    try {
      const newPhotos: PhotoFile[] = [];

      for (const file of toProcess) {
        const prepared = await prepareImageForUpload(file, prepareOptions);
        if (prepared.size > outputLimit) {
          continue;
        }
        if (onUpload && navigator.onLine) {
          try {
            const result = await onUpload(prepared);
            if (result) {
              newPhotos.push({
                id: result.id ?? crypto.randomUUID(),
                url: result.url,
                fileName: prepared.name,
                mimeType: prepared.type,
                cloudinaryPublicId: result.publicId,
                size: result.bytes,
                bytes: result.bytes,
                format: result.format,
                width: result.width,
                height: result.height,
              });
            }
          } catch {
            const fallback = await readFileAsDataUrl(prepared);
            newPhotos.push(fallback);
          }
        } else {
          const local = await readFileAsDataUrl(prepared);
          newPhotos.push(local);
        }
      }

      if (newPhotos.length > 0) {
        await Promise.resolve(onChange([...photos, ...newPhotos]));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (index: number) => {
    const photo = photos[index];
    if (!photo || removingPhotoId) return;
    const updated = photos.filter((_, i) => i !== index);
    setRemovingPhotoId(photo.id);
    try {
      await Promise.resolve(onChange(updated));
    } finally {
      setRemovingPhotoId(null);
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={allowMultipleInPicker}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled || remainingSlots <= 0 || busy}
      />
      <Button
        variant="outlined"
        startIcon={
          uploading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <PhotoCamera />
          )
        }
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || remainingSlots <= 0 || busy}
        fullWidth
        sx={{ mb: 2 }}
      >
        {uploading ? "Enviando imagem..." : removingPhotoId ? "Removendo..." : `Adicionar foto${photos.length > 0 ? ` (${photos.length}/${maxPhotos})` : ""}`}
      </Button>
      {limitHint && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setLimitHint(null)}>
          {limitHint}
        </Alert>
      )}
      {photos.length > 0 && (
        <ImageList cols={3} gap={8}>
          {photos.map((photo, index) => (
            <ImageListItem key={photo.id}>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <img
                  src={getPhotoDisplayUrl(photo)}
                  alt={`Preview ${index + 1}`}
                  style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                />
                {removingPhotoId === photo.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.65)',
                      borderRadius: 1,
                      zIndex: 2,
                    }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                )}
                {!disabled && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => void handleRemove(index)}
                    disabled={busy}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};
