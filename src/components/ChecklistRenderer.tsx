import { Alert, Box, Paper, TextField, Typography } from "@mui/material";
import { Checklist, Evidence, InspectionItem } from "@/domain";
import { MAX_PHOTOS_PER_CHECKLIST_ITEM } from "@/domain/photoLimits";
import { ChecklistAnswer } from "@/domain/enums";
import { evidenceToPhotoFile, PhotoFile, PhotoUploader } from "./PhotoUploader";
import { AnswerRadioGroup } from "./AnswerRadioGroup";

interface ChecklistRendererProps {
  checklist: Checklist;
  inspectionItems: InspectionItem[];
  evidences: Evidence[];
  onItemChange: (itemId: string, updates: Partial<InspectionItem>) => void;
  onEvidencesChange: (itemId: string, photos: PhotoFile[]) => void | Promise<void>;
  disabled?: boolean;
  /** Quando false, oculta o upload por item. Quando true, fotos por item só aparecem se a resposta for NÃO_CONFORME. */
  showItemEvidenceUploader?: boolean;
  /** Quando informado, fotos são enviadas ao Cloudinary/API antes de adicionar. */
  onUploadEvidence?: (file: File, inspectionItemId?: string) => Promise<{
    id?: string;
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
  showItemEvidenceUploader = true,
  onUploadEvidence,
}: ChecklistRendererProps) => {
  const getInspectionItem = (checklistItemId: string): InspectionItem | undefined => {
    return (
      inspectionItems.find((item) => item.checklistItemId === checklistItemId)
    );
  };

  return (
    <Box>
      {(checklist.sections ?? [])
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <Box key={section.id} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {section.title ?? section.name}
            </Typography>
            {(section.items ?? checklist.items?.filter((item) => item.sectionId === section.id) ?? [])
              .filter((item) => item.active)
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const inspectionItem = getInspectionItem(item.id);
                if (!inspectionItem) {
                  return null;
                }
                const isNonConforme = inspectionItem.answer === ChecklistAnswer.NAO_CONFORME;
                const itemEvidences: PhotoFile[] = evidences
                  .filter((evidence) => evidence.inspectionItemId === inspectionItem.id)
                  .map(evidenceToPhotoFile);
                const showPerItemPhotos = showItemEvidenceUploader && isNonConforme;
                const requiresPhoto =
                  isNonConforme &&
                  item.requiresPhotoOnNonConformity &&
                  itemEvidences.length === 0;
                return (
                  <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">
                      {index + 1}. {item.title}
                    </Typography>
                    {item.referenceImageUrl && (
                      <Box sx={{ mt: 1.5, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Foto de referência
                        </Typography>
                        <Box
                          component="img"
                          src={item.referenceImageUrl}
                          alt={`Referência do item ${item.title}`}
                          sx={{
                            width: "100%",
                            maxHeight: 260,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.default",
                          }}
                        />
                      </Box>
                    )}
                    <AnswerRadioGroup
                      value={inspectionItem.answer}
                      onChange={(value) => {
                        onItemChange(inspectionItem.id, { answer: value });
                        if (value !== ChecklistAnswer.NAO_CONFORME) {
                          void onEvidencesChange(inspectionItem.id, []);
                        }
                      }}
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
                    {showPerItemPhotos && (
                      <>
                        {requiresPhoto && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            Este item exige foto por estar não conforme.
                          </Alert>
                        )}
                        <PhotoUploader
                          photos={itemEvidences}
                          onChange={(photos) => onEvidencesChange(inspectionItem.id, photos)}
                          disabled={disabled}
                          maxPhotos={MAX_PHOTOS_PER_CHECKLIST_ITEM}
                          onUpload={onUploadEvidence ? (file) => onUploadEvidence(file, inspectionItem.id) : undefined}
                        />
                      </>
                    )}
                  </Paper>
                );
              })}
          </Box>
        ))}
    </Box>
  );
};
