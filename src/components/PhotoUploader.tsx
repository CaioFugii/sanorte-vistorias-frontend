import { Box, Button, CircularProgress, IconButton, ImageList, ImageListItem } from "@mui/material";
import { Delete, PhotoCamera } from "@mui/icons-material";
import { useRef, useState } from "react";

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
  onChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  /** Quando informado e online, faz upload no Cloudinary antes de adicionar a foto. */
  onUpload?: (file: File) => Promise<{
    publicId: string;
    url: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  } | null>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (limite da API Cloudinary)
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const PhotoUploader = ({
  photos,
  onChange,
  maxPhotos = 10,
  disabled = false,
  onUpload,
}: PhotoUploaderProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

    const remainingSlots = maxPhotos - photos.length;
    const toProcess = Array.from(files)
      .filter(
        (f) =>
          f.type.startsWith("image/") &&
          ALLOWED_TYPES.includes(f.type) &&
          f.size <= MAX_FILE_SIZE
      )
      .slice(0, remainingSlots);

    const willUpload = Boolean(onUpload && navigator.onLine && toProcess.length > 0);
    if (willUpload) setUploading(true);

    try {
      const newPhotos: PhotoFile[] = [];

      for (const file of toProcess) {
        if (onUpload && navigator.onLine) {
          try {
            const result = await onUpload(file);
            if (result) {
              newPhotos.push({
                id: crypto.randomUUID(),
                url: result.url,
                fileName: file.name,
                mimeType: file.type,
                cloudinaryPublicId: result.publicId,
                size: result.bytes,
                bytes: result.bytes,
                format: result.format,
                width: result.width,
                height: result.height,
              });
            }
          } catch {
            const fallback = await readFileAsDataUrl(file);
            newPhotos.push(fallback);
          }
        } else {
          const local = await readFileAsDataUrl(file);
          newPhotos.push(local);
        }
      }

      if (newPhotos.length > 0) {
        onChange([...photos, ...newPhotos]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled || photos.length >= maxPhotos || uploading}
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
        disabled={disabled || photos.length >= maxPhotos || uploading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {uploading ? "Enviando imagem..." : `Adicionar foto${photos.length > 0 ? ` (${photos.length}/${maxPhotos})` : ""}`}
      </Button>
      {photos.length > 0 && (
        <ImageList cols={3} gap={8}>
          {photos.map((photo, index) => (
            <ImageListItem key={photo.id}>
              <img
                src={getPhotoDisplayUrl(photo)}
                alt={`Preview ${index + 1}`}
                style={{ width: '100%', height: 'auto', borderRadius: 4 }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(index)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};
