import { Button, Box, ImageList, ImageListItem, IconButton } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { useRef } from 'react';

interface PhotoUploaderProps {
  photos: string[]; // dataUrls
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoUploader = ({
  photos,
  onChange,
  maxPhotos = 10,
  disabled = false,
}: PhotoUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    const remainingSlots = maxPhotos - photos.length;

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            newPhotos.push(dataUrl);
            if (newPhotos.length === Math.min(files.length, remainingSlots)) {
              const updated = [...photos, ...newPhotos];
              onChange(updated);
            }
          };
          reader.readAsDataURL(file);
        }
      });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled || photos.length >= maxPhotos}
      />
      <Button
        variant="outlined"
        startIcon={<PhotoCamera />}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || photos.length >= maxPhotos}
        fullWidth
        sx={{ mb: 2 }}
      >
        Adicionar Foto {photos.length > 0 && `(${photos.length}/${maxPhotos})`}
      </Button>
      {photos.length > 0 && (
        <ImageList cols={3} gap={8}>
          {photos.map((photo, index) => (
            <ImageListItem key={index}>
              <img
                src={photo}
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
