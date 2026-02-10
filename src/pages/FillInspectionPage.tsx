import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, CheckCircle, PictureAsPdf } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Inspection,
  InspectionItem,
  ChecklistItem,
  Evidence,
  Signature,
  InspectionStatus,
} from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useAuthStore } from '@/stores';
import { useSnackbar } from '@/utils/useSnackbar';
import { ChecklistRenderer } from '@/components/ChecklistRenderer';
import { SignaturePad } from '@/components/SignaturePad';
import { PhotoUploader } from '@/components/PhotoUploader';
import {
  calcularPercentual,
  determinarStatusAoFinalizar,
  validarFinalizacao,
} from '@/domain/rules';
import jsPDF from 'jspdf';

export const FillInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repository = useRepository();
  const { hasRole } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [generalEvidences, setGeneralEvidences] = useState<string[]>([]);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [signerName, setSignerName] = useState('');
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    if (id) {
      loadInspection();
    }
  }, [id]);

  const loadInspection = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const insp = await repository.getInspectionById(id);
      if (!insp) {
        showSnackbar('Vistoria não encontrada', 'error');
        navigate('/inspections');
        return;
      }
      const [checklistItemsData, items, evids, sig] = await Promise.all([
        repository.getChecklistItems(insp.checklistId),
        repository.getInspectionItems(id),
        repository.getEvidences(id),
        repository.getSignature(id),
      ]);

      setInspection(insp);
      setChecklistItems(checklistItemsData);

      // Criar inspection items para cada checklist item se não existir
      const existingItemMap = new Map(
        items.map((item) => [item.checklistItemId, item])
      );
      const allItems: InspectionItem[] = checklistItemsData.map((ci) => {
        const existing = existingItemMap.get(ci.id);
        if (existing) return existing;
        return {
          id: `temp-${ci.id}`,
          inspectionId: id,
          checklistItemId: ci.id,
          answer: null,
        };
      });
      setInspectionItems(allItems);

      const itemEvidences = evids.filter((e) => e.inspectionItemId);
      setEvidences(itemEvidences);
      const general = evids
        .filter((e) => !e.inspectionItemId)
        .map((e) => e.dataUrl);
      setGeneralEvidences(general);

      if (sig) {
        setSignature(sig);
        setSignerName(sig.signerName);
      }

      // Verificar permissões de edição
      const isFiscal = hasRole('FISCAL' as any);
      const isFinalized =
        insp.status !== InspectionStatus.RASCUNHO;
      setCanEdit(!isFinalized || !isFiscal);
    } catch (error) {
      showSnackbar('Erro ao carregar vistoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = async (
    itemIdOrChecklistItemId: string,
    updates: Partial<InspectionItem> | InspectionItem
  ) => {
    if (!id) return;

    // Verificar se é um item existente ou um novo
    let item = inspectionItems.find((i) => i.id === itemIdOrChecklistItemId);
    
    // Se não encontrou pelo id, pode ser checklistItemId (novo item)
    if (!item) {
      item = inspectionItems.find(
        (i) => i.checklistItemId === itemIdOrChecklistItemId
      );
    }

    if (!item) {
      // Criar novo item
      const checklistItem = checklistItems.find(
        (ci) => ci.id === itemIdOrChecklistItemId || ci.id === (updates as InspectionItem).checklistItemId
      );
      if (!checklistItem) return;

      const newItemData = {
        inspectionId: id,
        checklistItemId: checklistItem.id,
        answer: (updates as InspectionItem).answer || null,
        notes: (updates as InspectionItem).notes,
      };

      try {
        const saved = await repository.createInspectionItem(newItemData);
        setInspectionItems([...inspectionItems, saved]);
      } catch (error) {
        console.error('Error creating item:', error);
      }
      return;
    }

    const updated = { ...item, ...updates };
    setInspectionItems(
      inspectionItems.map((i) => (i.id === item.id ? updated : i))
    );

    // Salvar no repositório
    try {
      if (item.id.startsWith('temp-')) {
        const saved = await repository.createInspectionItem({
          inspectionId: id,
          checklistItemId: item.checklistItemId,
          answer: updated.answer || null,
          notes: updated.notes,
        });
        setInspectionItems(
          inspectionItems.map((i) => (i.id === item.id ? saved : i))
        );
      } else {
        await repository.updateInspectionItem(item.id, updates);
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEvidencesChange = async (
    inspectionItemId: string,
    photos: string[]
  ) => {
    if (!id) return;

    // Remover evidências antigas do item
    const oldEvidences = evidences.filter(
      (e) => e.inspectionItemId === inspectionItemId
    );
    for (const old of oldEvidences) {
      if (!photos.includes(old.dataUrl)) {
        try {
          await repository.deleteEvidence(old.id);
        } catch (error) {
          console.error('Error deleting evidence:', error);
        }
      }
    }

    // Adicionar novas evidências
    const existingUrls = oldEvidences.map((e) => e.dataUrl);
    const newPhotos = photos.filter((url) => !existingUrls.includes(url));
    for (const photo of newPhotos) {
      try {
        const evidence = await repository.createEvidence({
          inspectionId: id,
          inspectionItemId,
          fileName: `photo-${Date.now()}.jpg`,
          dataUrl: photo,
        });
        setEvidences([...evidences, evidence]);
      } catch (error) {
        console.error('Error creating evidence:', error);
      }
    }

    // Atualizar lista de evidências
    const updated = evidences.filter(
      (e) => e.inspectionItemId !== inspectionItemId || photos.includes(e.dataUrl)
    );
    setEvidences(updated);
  };

  const handleGeneralEvidencesChange = async (photos: string[]) => {
    if (!id) return;

    // Remover evidências gerais antigas
    const oldGeneral = evidences.filter((e) => !e.inspectionItemId);
    for (const old of oldGeneral) {
      if (!photos.includes(old.dataUrl)) {
        try {
          await repository.deleteEvidence(old.id);
        } catch (error) {
          console.error('Error deleting evidence:', error);
        }
      }
    }

    // Adicionar novas evidências gerais
    const existingUrls = oldGeneral.map((e) => e.dataUrl);
    const newPhotos = photos.filter((url) => !existingUrls.includes(url));
    for (const photo of newPhotos) {
      try {
        const evidence = await repository.createEvidence({
          inspectionId: id,
          fileName: `general-${Date.now()}.jpg`,
          dataUrl: photo,
        });
        setEvidences([...evidences, evidence]);
      } catch (error) {
        console.error('Error creating evidence:', error);
      }
    }

    setGeneralEvidences(photos);
  };

  const handleSave = async () => {
    if (!id || !inspection) return;
    try {
      setSaving(true);
      // Recalcular percentual
      const percent = calcularPercentual(inspectionItems, checklistItems);
      await repository.updateInspection(id, { scorePercent: percent });
      setInspection({ ...inspection, scorePercent: percent });
      showSnackbar('Vistoria salva com sucesso', 'success');
    } catch (error) {
      showSnackbar('Erro ao salvar vistoria', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!id || !inspection) return;

    // Validar
    const validation = validarFinalizacao(
      inspection,
      inspectionItems,
      evidences,
      signature,
      checklistItems
    );

    if (!validation.isValid) {
      showSnackbar(
        `Erro: ${validation.errors.join(', ')}`,
        'error'
      );
      return;
    }

    try {
      setSaving(true);
      const percent = calcularPercentual(inspectionItems, checklistItems);
      const status = determinarStatusAoFinalizar(inspectionItems);

      await repository.updateInspection(id, {
        status,
        scorePercent: percent,
        finalizedAt: new Date().toISOString(),
      });

      // Salvar assinatura se ainda não foi salva
      if (signature && !signature.id) {
        await repository.createSignature({
          inspectionId: id,
          signerName,
          signerRoleLabel: 'Líder/Encarregado',
          imageDataUrl: signature.imageDataUrl,
        });
      }

      showSnackbar('Vistoria finalizada com sucesso', 'success');
      navigate(`/inspections/${id}`);
    } catch (error) {
      showSnackbar('Erro ao finalizar vistoria', 'error');
    } finally {
      setSaving(false);
      setFinalizeDialogOpen(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!inspection) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Vistoria', 20, 20);
    doc.setFontSize(12);
    doc.text(`Serviço: ${inspection.serviceDescription}`, 20, 30);
    if (inspection.locationDescription) {
      doc.text(`Localização: ${inspection.locationDescription}`, 20, 40);
    }
    doc.text(`Status: ${inspection.status}`, 20, 50);
    doc.text(`Percentual: ${inspection.scorePercent}%`, 20, 60);
    doc.text(
      `Data: ${inspection.finalizedAt || inspection.createdAt}`,
      20,
      70
    );

    doc.save(`vistoria-${inspection.id}.pdf`);
    showSnackbar('PDF gerado com sucesso', 'success');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!inspection) {
    return <Alert severity="error">Vistoria não encontrada</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Preencher Vistoria</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleGeneratePDF}
          >
            Gerar PDF
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
              >
                Salvar
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => setFinalizeDialogOpen(true)}
                disabled={saving || inspection.status !== InspectionStatus.RASCUNHO}
              >
                Finalizar
              </Button>
            </>
          )}
        </Box>
      </Box>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Esta vistoria está finalizada. Apenas gestores podem editá-la.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações da Vistoria
        </Typography>
        <Typography variant="body2">
          <strong>Serviço:</strong> {inspection.serviceDescription}
        </Typography>
        {inspection.locationDescription && (
          <Typography variant="body2">
            <strong>Localização:</strong> {inspection.locationDescription}
          </Typography>
        )}
        <Typography variant="body2">
          <strong>Status:</strong> {inspection.status}
        </Typography>
        <Typography variant="body2">
          <strong>Percentual:</strong> {inspection.scorePercent}%
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Checklist
        </Typography>
        {inspection && (
          <ChecklistRenderer
            checklistItems={checklistItems}
            inspectionItems={inspectionItems}
            evidences={evidences}
            onItemChange={handleItemChange}
            onEvidencesChange={handleEvidencesChange}
            disabled={!canEdit}
            inspectionId={inspection.id}
          />
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fotos Gerais
        </Typography>
        <PhotoUploader
          photos={generalEvidences}
          onChange={handleGeneralEvidencesChange}
          disabled={!canEdit}
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <SignaturePad
          value={signature?.imageDataUrl || null}
          onChange={(dataUrl) => {
            if (dataUrl) {
              setSignature({
                id: signature?.id || '',
                inspectionId: id || '',
                signerName,
                signerRoleLabel: 'Líder/Encarregado',
                imageDataUrl: dataUrl,
                signedAt: new Date().toISOString(),
              });
            } else {
              setSignature(null);
            }
          }}
          disabled={!canEdit}
          signerName={signerName}
          onSignerNameChange={setSignerName}
        />
      </Paper>

      <Dialog
        open={finalizeDialogOpen}
        onClose={() => setFinalizeDialogOpen(false)}
      >
        <DialogTitle>Finalizar Vistoria</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja finalizar esta vistoria? Após finalizar,
            não será possível editar (exceto para gestores).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleFinalize} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
