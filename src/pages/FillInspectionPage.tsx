import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle, PictureAsPdf, PauseCircleOutline, Save } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { appRepository } from "@/repositories/AppRepository";
import { useInspectionStore } from "@/stores/inspectionStore";
import { useReferenceStore } from "@/stores/referenceStore";
import { validateFinalize } from "@/domain/rules";
import { ChecklistRenderer } from "@/components/ChecklistRenderer";
import {
  evidenceToPhotoFile,
  PhotoFile,
  PhotoUploader,
} from "@/components/PhotoUploader";
import { SignaturePad } from "@/components/SignaturePad";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InspectionStatus, ModuleType, UserRole } from "@/domain/enums";
import { InspectionItem } from "@/domain";
import { useAuthStore } from "@/stores/authStore";

export const FillInspectionPage = (): JSX.Element => {
  const { externalId = "" } = useParams();
  const navigate = useNavigate();
  const { checklists, serviceOrders, loadServiceOrders } = useReferenceStore();
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
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paralyzeDialogOpen, setParalyzeDialogOpen] = useState(false);
  const [paralyzeReason, setParalyzeReason] = useState("");
  const [paralyzeError, setParalyzeError] = useState<string | null>(null);
  const [paralyzeLoading, setParalyzeLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setSignerName("");
      setSignatureDataUrl(null);
      await load(externalId);
      setLoading(false);
    };
    run();
  }, [externalId, load]);

  useEffect(() => {
    loadServiceOrders();
  }, [loadServiceOrders]);

  const checklist = useMemo(
    () => checklists.find((entry) => entry.id === currentInspection?.checklistId),
    [checklists, currentInspection]
  );

  const osNumber = useMemo(() => {
    if (!currentInspection) return null;
    if (currentInspection.serviceOrder?.osNumber) return currentInspection.serviceOrder.osNumber;
    if (currentInspection.serviceOrderId) {
      return serviceOrders.find((so) => so.id === currentInspection.serviceOrderId)?.osNumber ?? null;
    }
    return null;
  }, [currentInspection, serviceOrders]);

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

  const handleUploadEvidence = async (file: File, inspectionItemId?: string) => {
    const inspectionId = currentInspection.serverId ?? currentInspection.externalId;
    const evidence = await appRepository.addInspectionEvidenceOnline(
      inspectionId,
      currentInspection.externalId,
      file,
      inspectionItemId
    );
    addEvidence(evidence);
    return {
      publicId: evidence.cloudinaryPublicId ?? "",
      url: evidence.url ?? "",
      bytes: evidence.bytes ?? 0,
      format: evidence.format ?? "png",
      width: evidence.width ?? 0,
      height: evidence.height ?? 0,
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

  /** Persiste respostas da vistoria (itens + assinatura) na API offline / IndexedDB. */
  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await setItemsAndAutosave(inspectionItems);
      await handleSaveSignature();
    } finally {
      setSaving(false);
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
      await appRepository.setInspectionItems(currentInspection.externalId, inspectionItems);
      const inspectionId = currentInspection.serverId ?? currentInspection.externalId;
      await appRepository.finalizeInspection(inspectionId);
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

  const isAdminOrManager =
    user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;
  const canEdit =
    isAdminOrManager || currentInspection.status === InspectionStatus.RASCUNHO;
  const canFinalize = currentInspection.status === InspectionStatus.RASCUNHO;
  const canParalyze =
    user?.role === UserRole.FISCAL &&
    canEdit &&
    currentInspection.hasParalysisPenalty !== true &&
    currentInspection.module === ModuleType.CAMPO;

  const isRemotoModule = currentInspection.module === ModuleType.REMOTO;

  const openParalyzeDialog = () => {
    setParalyzeReason("");
    setParalyzeError(null);
    setParalyzeDialogOpen(true);
  };

  const closeParalyzeDialog = () => {
    if (paralyzeLoading) return;
    setParalyzeDialogOpen(false);
    setParalyzeReason("");
    setParalyzeError(null);
  };

  const handleParalyzeInspection = async () => {
    if (!paralyzeReason.trim()) {
      setParalyzeError("Motivo da paralisação é obrigatório.");
      return;
    }
    setParalyzeLoading(true);
    setParalyzeError(null);
    try {
      await appRepository.paralyzeInspection(currentInspection.externalId, paralyzeReason.trim());
      closeParalyzeDialog();
      await load(externalId);
    } catch (e) {
      setParalyzeError(e instanceof Error ? e.message : "Erro ao registrar paralisação.");
    } finally {
      setParalyzeLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5">Preencher vistoria</Typography>
          {osNumber && (
            <Typography variant="h5" color="text.secondary" fontWeight={500}>
              — OS {osNumber}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1}>
          {!canEdit && (
            <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleGeneratePdf}>
              PDF
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {canParalyze && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<PauseCircleOutline />}
              onClick={openParalyzeDialog}
              disabled={paralyzeLoading}
            >
              Registrar paralisação
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={!canFinalize || finalizing}
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
          showItemEvidenceUploader={!isRemotoModule}
          onUploadEvidence={canEdit ? handleUploadEvidence : undefined}
        />
      </Paper>

      {!isRemotoModule && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Fotos gerais
          </Typography>
          <PhotoUploader
            photos={generalEvidencesPhotos}
            onChange={handleGeneralEvidencesChange}
            onUpload={canEdit ? handleUploadEvidence : undefined}
            disabled={!canEdit}
          />
        </Paper>
      )}

      {!isRemotoModule && (
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
      )}

      <ConfirmDialog
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onConfirm={handleFinalize}
        title="Finalizar vistoria"
        description="Confirma a finalização da vistoria?"
        confirmLabel="Finalizar"
        loading={finalizing}
      />

      <Dialog open={paralyzeDialogOpen} onClose={closeParalyzeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar paralisação</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo da paralisação"
            multiline
            rows={3}
            value={paralyzeReason}
            onChange={(e) => setParalyzeReason(e.target.value)}
            margin="normal"
            required
            error={!!paralyzeError}
            helperText={
              paralyzeError ?? "Esta ação aplica penalidade persistente de 25% na nota."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeParalyzeDialog} disabled={paralyzeLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleParalyzeInspection}
            disabled={paralyzeLoading || !paralyzeReason.trim()}
          >
            {paralyzeLoading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
