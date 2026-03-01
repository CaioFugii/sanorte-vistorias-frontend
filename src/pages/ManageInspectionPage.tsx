import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Delete, PauseCircleOutline, PlayCircleOutline, Save } from "@mui/icons-material";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChecklistRenderer } from "@/components/ChecklistRenderer";
import { Evidence, Inspection, InspectionItem, Signature } from "@/domain";
import { UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useReferenceStore } from "@/stores/referenceStore";

export const ManageInspectionPage = (): JSX.Element => {
  const { externalId = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { loadCache, checklists } = useReferenceStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [paralyzeDialogOpen, setParalyzeDialogOpen] = useState(false);
  const [paralyzeReason, setParalyzeReason] = useState("");
  const [paralyzeError, setParalyzeError] = useState<string | null>(null);
  const [paralyzeLoading, setParalyzeLoading] = useState(false);
  const [unparalyzeDialogOpen, setUnparalyzeDialogOpen] = useState(false);
  const [unparalyzeLoading, setUnparalyzeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAllowed =
    user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;

  useEffect(() => {
    const run = async () => {
      if (!isAllowed) {
        navigate("/inspections");
        return;
      }
      setLoading(true);
      try {
        await loadCache();
        const data = await appRepository.getInspection(externalId, true);
        if (!data) {
          navigate("/inspections");
          return;
        }
        setInspection(data);
        setInspectionItems(
          (data.items ?? []).map((item) => ({
            ...item,
            inspectionExternalId: item.inspectionExternalId ?? data.externalId,
            updatedAt: item.updatedAt ?? data.updatedAt ?? new Date().toISOString(),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [externalId, isAllowed, loadCache, navigate]);

  const loadInspection = async () => {
    if (!externalId || !isAllowed) return;
    const data = await appRepository.getInspection(externalId, true);
    if (data) {
      setInspection(data);
      setInspectionItems(
        (data.items ?? []).map((item) => ({
          ...item,
          inspectionExternalId: item.inspectionExternalId ?? data.externalId,
          updatedAt: item.updatedAt ?? data.updatedAt ?? new Date().toISOString(),
        }))
      );
    }
  };

  const checklist = useMemo(() => {
    if (!inspection) return undefined;
    if (inspection.checklist) return inspection.checklist;
    return checklists.find((entry) => entry.id === inspection.checklistId);
  }, [checklists, inspection]);

  const evidences = useMemo<Evidence[]>(() => inspection?.evidences ?? [], [inspection]);
  const signature = useMemo<Signature | null>(() => inspection?.signatures?.[0] ?? null, [inspection]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!inspection || !checklist) {
    return <Alert severity="warning">Vistoria não encontrada.</Alert>;
  }

  const handleItemChange = (id: string, updates: Partial<InspectionItem>) => {
    setInspectionItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await appRepository.setInspectionItemsOnline(inspection.externalId, inspectionItems);
      await appRepository.updateInspectionOnline(inspection.externalId, {
        updatedAt: new Date().toISOString(),
      });
      navigate(`/inspections/${inspection.externalId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAskDeleteEvidence = (evidenceId: string) => {
    setDeletingEvidenceId(evidenceId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteEvidence = async () => {
    if (!deletingEvidenceId || deleteLoading) return;
    const current = evidences.find((entry) => entry.id === deletingEvidenceId);
    if (!current) {
      setDeleteDialogOpen(false);
      setDeletingEvidenceId(null);
      return;
    }
    if (!current.cloudinaryPublicId) {
      setDeleteDialogOpen(false);
      setDeletingEvidenceId(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await appRepository.deleteFromCloudinary(current.cloudinaryPublicId);
      setInspection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          evidences: (prev.evidences ?? []).filter((entry) => entry.id !== deletingEvidenceId),
        };
      });
      setDeleteDialogOpen(false);
      setDeletingEvidenceId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canParalyze = inspection.hasParalysisPenalty !== true;
  const canUnparalyze = inspection.hasParalysisPenalty === true;

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
      await appRepository.paralyzeInspection(
        inspection.serverId ?? inspection.externalId,
        paralyzeReason.trim()
      );
      closeParalyzeDialog();
      await loadInspection();
    } catch (e) {
      setParalyzeError(e instanceof Error ? e.message : "Erro ao registrar paralisação.");
    } finally {
      setParalyzeLoading(false);
    }
  };

  const closeUnparalyzeDialog = () => {
    if (unparalyzeLoading) return;
    setUnparalyzeDialogOpen(false);
  };

  const handleUnparalyzeInspection = async () => {
    setUnparalyzeLoading(true);
    try {
      await appRepository.unparalyzeInspection(
        inspection.serverId ?? inspection.externalId
      );
      closeUnparalyzeDialog();
      await loadInspection();
    } finally {
      setUnparalyzeLoading(false);
    }
  };

  const handleUploadGeneralEvidences = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!inspection) return;
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingEvidence(true);
    try {
      const uploaded: Evidence[] = [];
      for (const file of Array.from(files)) {
        const created = await appRepository.addInspectionEvidenceOnline(
          inspection.serverId ?? inspection.externalId,
          inspection.externalId,
          file
        );
        uploaded.push(created);
      }
      setInspection((prev) => {
        if (!prev || uploaded.length === 0) return prev;
        return {
          ...prev,
          evidences: [...(prev.evidences ?? []), ...uploaded],
        };
      });
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Editar vistoria (gestão)</Typography>
        <Box display="flex" gap={1}>
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
          {canUnparalyze && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<PlayCircleOutline />}
              onClick={() => setUnparalyzeDialogOpen(true)}
              disabled={unparalyzeLoading}
            >
              Remover penalidade
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <ChecklistRenderer
          checklist={checklist}
          inspectionItems={inspectionItems}
          evidences={[]}
          onItemChange={handleItemChange}
          onEvidencesChange={() => {}}
          disabled={false}
          showItemEvidenceUploader={false}
        />
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Fotos da vistoria
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={handleUploadGeneralEvidences}
          disabled={deleteLoading || uploadingEvidence}
        />
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={deleteLoading || uploadingEvidence}
          sx={{ mb: 2 }}
        >
          {uploadingEvidence ? "Enviando imagens..." : "Adicionar evidências"}
        </Button>
        {evidences.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma foto registrada.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {evidences.map((evidence) => (
              <Box
                key={evidence.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
              >
                <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
                  <Box
                    component="a"
                    href={evidence.url ?? evidence.dataUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: "action.hover",
                      display: "block",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={evidence.url ?? evidence.dataUrl ?? ""}
                      alt={evidence.fileName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Box>
                  <Typography variant="body2" noWrap title={evidence.fileName}>
                    {evidence.fileName}
                  </Typography>
                </Box>
                <IconButton
                  color="error"
                  onClick={() => handleAskDeleteEvidence(evidence.id)}
                  disabled={deleteLoading}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Assinatura
        </Typography>
        {!signature ? (
          <Typography variant="body2" color="text.secondary">
            Sem assinatura registrada.
          </Typography>
        ) : (
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {(signature.url || signature.dataUrl) && (
              <Box
                component="img"
                src={signature.url ?? signature.dataUrl ?? ""}
                alt={`Assinatura de ${signature.signerName}`}
                sx={{ maxHeight: 80, border: 1, borderColor: "divider", borderRadius: 1 }}
              />
            )}
            <Box>
              <Typography variant="body2">
                <strong>{signature.signerName}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assinado em {new Date(signature.signedAt).toLocaleString("pt-BR")}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
      <Alert severity="info" sx={{ mt: 2 }}>
        Edição administrativa online: respostas e observações podem ser ajustadas em qualquer status.
        Evidências e assinatura permanecem no fluxo operacional.
      </Alert>
      <Dialog
        open={unparalyzeDialogOpen}
        onClose={closeUnparalyzeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remover penalidade de paralisação</DialogTitle>
        <DialogContent>
          <Typography>
            Remove a penalidade de 25% aplicada por paralisação e recalcula a nota.
            Esta ação é usada para correção de erro de registro.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUnparalyzeDialog} disabled={unparalyzeLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleUnparalyzeInspection}
            disabled={unparalyzeLoading}
          >
            {unparalyzeLoading ? "Removendo..." : "Remover penalidade"}
          </Button>
        </DialogActions>
      </Dialog>
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
      <Dialog
        open={deleteDialogOpen}
        onClose={deleteLoading ? undefined : () => setDeleteDialogOpen(false)}
        disableEscapeKeyDown={deleteLoading}
      >
        <DialogTitle>Excluir foto</DialogTitle>
        <DialogContent>
          Deseja excluir esta foto da vistoria?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteEvidence}
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
