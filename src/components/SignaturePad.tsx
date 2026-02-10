import { Box, Button, Paper, Typography } from '@mui/material';
import { Clear } from '@mui/icons-material';
import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  value: string | null; // dataUrl
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  signerName?: string;
  onSignerNameChange?: (name: string) => void;
}

export const SignaturePad = ({
  value,
  onChange,
  disabled = false,
  signerName = '',
  onSignerNameChange,
}: SignaturePadProps) => {
  const canvasRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current.getCanvas();
      const img = new Image();
      img.src = value;
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
    }
  }, [value]);

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      onChange(null);
    }
  };

  const handleEnd = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Assinatura do Líder/Encarregado
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          position: 'relative',
          bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            maxWidth: 600,
            height: 200,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'white',
          }}
        >
          <SignatureCanvas
            ref={canvasRef}
            canvasProps={{
              width: containerRef.current?.clientWidth || 600,
              height: 200,
              className: 'signature-canvas',
            }}
            onEnd={handleEnd}
          />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClear}
            disabled={disabled}
            size="small"
          >
            Limpar
          </Button>
          {onSignerNameChange && (
            <Box sx={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Nome do líder/encarregado"
                value={signerName}
                onChange={(e) => onSignerNameChange(e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
