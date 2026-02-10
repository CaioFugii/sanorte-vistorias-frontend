import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  Typography,
  Paper,
} from '@mui/material';
import { ChecklistItem, InspectionItem, ChecklistAnswer, Evidence } from '@/domain';
import { PhotoUploader } from './PhotoUploader';

interface PhotoFile {
  file?: File;
  preview: string;
  evidenceId?: string;
}

interface ChecklistRendererProps {
  checklistItems: ChecklistItem[];
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  onItemChange: (itemId: string, updates: Partial<InspectionItem> | InspectionItem) => void;
  onEvidencesChange: (itemId: string, photos: PhotoFile[]) => void;
  disabled?: boolean;
  inspectionId?: string;
}

export const ChecklistRenderer = ({
  checklistItems,
  inspectionItems,
  evidences,
  onItemChange,
  onEvidencesChange,
  disabled = false,
  inspectionId,
}: ChecklistRendererProps) => {
  const getInspectionItem = (checklistItemId: string): InspectionItem | null => {
    return (
      inspectionItems.find((item) => item.checklistItemId === checklistItemId) ||
      null
    );
  };

  const getItemEvidences = (inspectionItemId: string): PhotoFile[] => {
    return evidences
      .filter((e) => e.inspectionItemId === inspectionItemId)
      .map((e) => ({
        preview: e.filePath.startsWith('http') 
          ? e.filePath 
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${e.filePath}`,
        evidenceId: e.id,
      }));
  };

  const handleAnswerChange = (checklistItemId: string, answer: ChecklistAnswer) => {
    const existing = getInspectionItem(checklistItemId);
    if (existing) {
      onItemChange(existing.id, { answer });
    } else {
      // Criar novo item se não existir
      const now = new Date().toISOString();
      const newItem: InspectionItem = {
        id: `temp-${Date.now()}`,
        inspectionId: inspectionId || '',
        checklistItemId,
        answer,
        createdAt: now,
        updatedAt: now,
      };
      onItemChange(checklistItemId, newItem);
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    onItemChange(itemId, { notes });
  };

  return (
    <Box>
      {checklistItems.map((checklistItem, index) => {
        const inspectionItem = getInspectionItem(checklistItem.id);
        const answer = inspectionItem?.answer || null;
        const notes = inspectionItem?.notes || '';
        const itemEvidences = inspectionItem
          ? getItemEvidences(inspectionItem.id)
          : [];

        const isNonConformity = answer === ChecklistAnswer.NAO_CONFORME;
        const requiresPhoto =
          isNonConformity && checklistItem.requiresPhotoOnNonConformity;
        const hasPhoto = itemEvidences.length > 0;

        return (
          <Paper key={checklistItem.id} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {index + 1}. {checklistItem.title}
            </Typography>

            <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
              <FormLabel component="legend">Avaliação</FormLabel>
              <RadioGroup
                row
                value={answer || ''}
                onChange={(e) =>
                  handleAnswerChange(
                    checklistItem.id,
                    e.target.value as ChecklistAnswer
                  )
                }
              >
                <FormControlLabel
                  value={ChecklistAnswer.CONFORME}
                  control={<Radio />}
                  label="Conforme"
                  disabled={disabled}
                />
                <FormControlLabel
                  value={ChecklistAnswer.NAO_CONFORME}
                  control={<Radio />}
                  label="Não Conforme"
                  disabled={disabled}
                />
                <FormControlLabel
                  value={ChecklistAnswer.NAO_APLICAVEL}
                  control={<Radio />}
                  label="Não Aplicável"
                  disabled={disabled}
                />
              </RadioGroup>
            </FormControl>

            {requiresPhoto && !hasPhoto && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Foto obrigatória para itens não conformes
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observações"
              value={notes}
              onChange={(e) =>
                inspectionItem &&
                handleNotesChange(inspectionItem.id, e.target.value)
              }
              disabled={disabled}
              sx={{ mb: 2 }}
            />

            {inspectionItem && (
              <PhotoUploader
                photos={itemEvidences}
                onChange={(photos) => {
                  // Converter dataUrls para Evidence objects
                  // Isso será tratado pelo componente pai
                  onEvidencesChange(inspectionItem.id, photos);
                }}
                disabled={disabled}
              />
            )}
          </Paper>
        );
      })}
    </Box>
  );
};
