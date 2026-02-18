import { Alert, Box, Paper, TextField, Typography } from "@mui/material";
import { Checklist, Evidence, InspectionItem } from "@/domain";
import { ChecklistAnswer } from "@/domain/enums";
import { evidenceToPhotoFile, PhotoFile, PhotoUploader } from "./PhotoUploader";
import { AnswerRadioGroup } from "./AnswerRadioGroup";

interface ChecklistRendererProps {
  checklist: Checklist;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  onItemChange: (itemId: string, updates: Partial<InspectionItem>) => void;
  onEvidencesChange: (itemId: string, photos: PhotoFile[]) => void;
  disabled?: boolean;
  /** Quando informado, fotos são enviadas ao Cloudinary antes de adicionar (online). */
  onUploadEvidence?: (file: File) => Promise<{
    publicId: string;
    url: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  } | null>;
}

export const ChecklistRenderer = ({
  checklist,
  inspectionItems,
  evidences,
  onItemChange,
  onEvidencesChange,
  disabled = false,
  onUploadEvidence,
}: ChecklistRendererProps) => {
  const getInspectionItem = (checklistItemId: string): InspectionItem | undefined => {
    return (
      inspectionItems.find((item) => item.checklistItemId === checklistItemId)
    );
  };

  return (
    <Box>
      {checklist.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <Box key={section.id} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.title ?? section.name}
            </Typography>
            {section.items
              .filter((item) => item.active)
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const inspectionItem = getInspectionItem(item.id);
                if (!inspectionItem) {
                  return null;
                }
                const itemEvidences: PhotoFile[] = evidences
                  .filter((evidence) => evidence.inspectionItemId === inspectionItem.id)
                  .map(evidenceToPhotoFile);
                const requiresPhoto =
                  inspectionItem.answer === ChecklistAnswer.NAO_CONFORME &&
                  item.requiresPhotoOnNonConformity &&
                  itemEvidences.length === 0;
                return (
                  <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">
                      {index + 1}. {item.title}
                    </Typography>
                    <AnswerRadioGroup
                      value={inspectionItem.answer}
                      onChange={(value) => onItemChange(inspectionItem.id, { answer: value })}
                      disabled={disabled}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Observações"
                      value={inspectionItem.notes ?? ""}
                      onChange={(event) =>
                        onItemChange(inspectionItem.id, { notes: event.target.value })
                      }
                      disabled={disabled}
                      sx={{ mb: 2 }}
                    />
                    {requiresPhoto && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Este item exige foto por estar não conforme.
                      </Alert>
                    )}
                    <PhotoUploader
                      photos={itemEvidences}
                      onChange={(photos) => onEvidencesChange(inspectionItem.id, photos)}
                      disabled={disabled}
                      onUpload={onUploadEvidence}
                    />
                  </Paper>
                );
              })}
          </Box>
        ))}
    </Box>
  );
};
