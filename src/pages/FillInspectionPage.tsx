import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { CheckCircle, PictureAsPdf, Save } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { appRepository } from "@/repositories/AppRepository";
import { useInspectionStore } from "@/stores/inspectionStore";
import { useReferenceStore } from "@/stores/referenceStore";
import { calculateScore, determineStatus, validateFinalize } from "@/domain/rules";
import { ChecklistRenderer } from "@/components/ChecklistRenderer";
import {
  evidenceToPhotoFile,
  PhotoFile,
  PhotoUploader,
} from "@/components/PhotoUploader";
import { SignaturePad } from "@/components/SignaturePad";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InspectionStatus, SyncState } from "@/domain/enums";
import { InspectionItem } from "@/domain";

export const FillInspectionPage = (): JSX.Element => {
  const { externalId = "" } = useParams();
  const navigate = useNavigate();
  const { checklists } = useReferenceStore();
  const {
    currentInspection,
    inspectionItems,
    evidences,
    signature,
    load,
    setItemsAndAutosave,
    addEvidence,
    removeEvidence,
    saveSignature,
  } = useInspectionStore();
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setSignerName("");
      setSignatureDataUrl(null);
      await load(externalId);
      setLoading(false);
    };
    run();
  }, [externalId, load]);

  const checklist = useMemo(
    () => checklists.find((entry) => entry.id === currentInspection?.checklistId),
    [checklists, currentInspection]
  );

  useEffect(() => {
    if (signature) {
      setSignerName(signature.signerName);
      setSignatureDataUrl(signature.url ?? signature.dataUrl ?? null);
      setSignatureDirty(false);
    } else {
      setSignerName("");
      setSignatureDataUrl(null);
      setSignatureDirty(false);
    }
  }, [signature]);

  const ensureChecklistItems = async (): Promise<void> => {
    if (!currentInspection || !checklist) return;
    if (inspectionItems.length > 0) return;
    const now = new Date().toISOString();
    const initialItems: InspectionItem[] = checklist.sections
      .flatMap((section) => section.items)
      .filter((item) => item.active)
      .map((item) => ({
        id: crypto.randomUUID(),
        inspectionExternalId: currentInspection.externalId,
        checklistItemId: item.id,
        updatedAt: now,
      }));
    await setItemsAndAutosave(initialItems);
  };

  useEffect(() => {
    ensureChecklistItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist?.id, currentInspection?.externalId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (!currentInspection || !checklist) {
    return <Alert severity="error">Vistoria não encontrada.</Alert>;
  }

  const handleItemChange = async (id: string, updates: Partial<InspectionItem>) => {
    const next = inspectionItems.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    );
    await setItemsAndAutosave(next);
  };

  const handleUploadEvidence = async (file: File) => {
    const result = await appRepository.uploadToCloudinary(file, "quality/evidences");
    return {
      publicId: result.publicId,
      url: result.url,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  };

  const handleItemEvidencesChange = async (inspectionItemId: string, photos: PhotoFile[]) => {
    const existing = evidences.filter((evidence) => evidence.inspectionItemId === inspectionItemId);
    const nextIds = new Set(photos.map((photo) => photo.id));
    for (const oldEvidence of existing) {
      if (!nextIds.has(oldEvidence.id)) {
        await removeEvidence(oldEvidence.id);
      }
    }
    for (const photo of photos) {
      if (!evidences.find((evidence) => evidence.id === photo.id)) {
        await addEvidence({
          ...photo,
          inspectionExternalId: currentInspection.externalId,
          inspectionItemId,
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  const generalEvidencesList = evidences.filter((entry) => !entry.inspectionItemId);
  const generalEvidencesPhotos = generalEvidencesList.map(evidenceToPhotoFile);
  const handleGeneralEvidencesChange = async (photos: PhotoFile[]) => {
    const existing = evidences.filter((entry) => !entry.inspectionItemId);
    const nextIds = new Set(photos.map((photo) => photo.id));
    for (const oldEvidence of existing) {
      if (!nextIds.has(oldEvidence.id)) {
        await removeEvidence(oldEvidence.id);
      }
    }
    for (const photo of photos) {
      if (!evidences.find((entry) => entry.id === photo.id)) {
        await addEvidence({
          ...photo,
          inspectionExternalId: currentInspection.externalId,
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  const handleSaveSignature = async (): Promise<void> => {
    if (!signatureDataUrl || !signerName.trim()) {
      return;
    }
    const base: {
      id: string;
      inspectionExternalId: string;
      signerName: string;
      signedAt: string;
      dataUrl?: string;
      cloudinaryPublicId?: string;
      url?: string;
    } = {
      id: signature?.id ?? crypto.randomUUID(),
      inspectionExternalId: currentInspection.externalId,
      signerName,
      signedAt: new Date().toISOString(),
    };
    if (navigator.onLine && signatureDataUrl.startsWith("data:")) {
      // Evita upload duplicado: se já existe no Cloudinary e o usuário não redesenhou, reutiliza (ex.: Salvar e depois Finalizar)
      if (signature?.cloudinaryPublicId && signature?.url && !signatureDirty) {
        base.cloudinaryPublicId = signature.cloudinaryPublicId;
        base.url = signature.url;
      } else {
        try {
          const res = await fetch(signatureDataUrl);
          const blob = await res.blob();
          const file = new File([blob], "signature.png", { type: "image/png" });
          const result = await appRepository.uploadToCloudinary(file, "quality/signatures");
          base.cloudinaryPublicId = result.publicId;
          base.url = result.url;
        } catch {
          base.dataUrl = signatureDataUrl;
        }
      }
    } else {
      base.dataUrl = signatureDataUrl;
    }
    await saveSignature(base as Parameters<typeof saveSignature>[0]);
    setSignatureDirty(false);
  };

  const handleFinalize = async (): Promise<void> => {
    setFinalizing(true);
    try {
      await handleSaveSignature();
      const currentSignature = await appRepository.getSignature(currentInspection.externalId);
      const validation = validateFinalize({
        checklist,
        inspectionItems,
        evidences,
        signature: currentSignature,
      });
      if (!validation.isValid) {
        alert(validation.errors.join("\n"));
        return;
      }
      const scorePercent = calculateScore(inspectionItems);
      const status = determineStatus(inspectionItems);
      await appRepository.updateInspection(currentInspection.externalId, {
        status,
        scorePercent,
        finalizedAt: new Date().toISOString(),
        syncState: SyncState.PENDING_SYNC,
      });
      navigate(`/inspections/${currentInspection.externalId}`);
    } finally {
      setFinalizing(false);
      setFinalizeOpen(false);
    }
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Vistoria", 14, 20);
    doc.setFontSize(11);
    doc.text(`Serviço: ${currentInspection.serviceDescription}`, 14, 30);
    doc.text(`Local: ${currentInspection.locationDescription}`, 14, 38);
    doc.text(`Status: ${currentInspection.status}`, 14, 46);
    doc.text(`Score: ${currentInspection.scorePercent ?? 0}%`, 14, 54);
    doc.save(`vistoria-${currentInspection.externalId}.pdf`);
  };

  const canEdit = currentInspection.status === InspectionStatus.RASCUNHO;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Preencher vistoria</Typography>
        <Box display="flex" gap={1}>
          {!canEdit && (
            <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleGeneratePdf}>
              PDF
            </Button>
          )}
          <Button variant="outlined" startIcon={<Save />} onClick={handleSaveSignature}>
            Salvar
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={!canEdit || finalizing}
            onClick={() => setFinalizeOpen(true)}
          >
            Finalizar
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <ChecklistRenderer
          checklist={checklist}
          inspectionItems={inspectionItems}
          evidences={evidences}
          onItemChange={handleItemChange}
          onEvidencesChange={handleItemEvidencesChange}
          disabled={!canEdit}
          onUploadEvidence={canEdit ? handleUploadEvidence : undefined}
        />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Fotos gerais
        </Typography>
        <PhotoUploader
          photos={generalEvidencesPhotos}
          onChange={handleGeneralEvidencesChange}
          onUpload={canEdit ? handleUploadEvidence : undefined}
        />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <SignaturePad
          value={signatureDataUrl}
          onChange={(url) => {
            setSignatureDataUrl(url);
            setSignatureDirty(true);
          }}
          signerName={signerName}
          onSignerNameChange={setSignerName}
          disabled={!canEdit}
        />
      </Paper>

      <ConfirmDialog
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onConfirm={handleFinalize}
        title="Finalizar vistoria"
        description="Confirma a finalização? Isso marcará a inspeção para sincronização."
        confirmLabel={finalizing ? "Finalizando..." : "Finalizar"}
      />
    </Box>
  );
};
