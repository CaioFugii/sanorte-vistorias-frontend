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
  const [generalEvidences, setGeneralEvidences] = useState<Array<{ file?: File; preview: string; evidenceId?: string }>>([]);
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
      const now = new Date().toISOString();
      const allItems: InspectionItem[] = checklistItemsData.map((ci) => {
        const existing = existingItemMap.get(ci.id);
        if (existing) return existing;
        return {
          id: `temp-${ci.id}`,
          inspectionId: id,
          checklistItemId: ci.id,
          answer: undefined,
          createdAt: now,
          updatedAt: now,
        };
      });
      setInspectionItems(allItems);

      setEvidences(evids);
      // Para evidências gerais, construir PhotoFile[] a partir das evidências
      const general = evids
        .filter((e) => !e.inspectionItemId)
        .map((e) => ({
          preview: e.filePath.startsWith('http') 
            ? e.filePath 
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${e.filePath}`,
          evidenceId: e.id,
        }));
      setGeneralEvidences(general);

      if (sig) {
        setSignature(sig);
        setSignerName(sig.signerName);
        // Converter imagePath para dataUrl para exibição
        if (sig.imagePath) {
          const imageUrl = sig.imagePath.startsWith('http')
            ? sig.imagePath
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${sig.imagePath}`;
          // Criar um objeto temporário com imageDataUrl para o componente
          setSignature({
            ...sig,
            imageDataUrl: imageUrl, // Temporário para exibição
          } as any);
        }
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

      // Criar item temporário localmente
      const now = new Date().toISOString();
      const newItem: InspectionItem = {
        id: `temp-${checklistItem.id}-${Date.now()}`,
        inspectionId: id,
        checklistItemId: checklistItem.id,
        answer: (updates as InspectionItem).answer,
        notes: (updates as InspectionItem).notes,
        createdAt: now,
        updatedAt: now,
      };
      setInspectionItems([...inspectionItems, newItem]);
      return;
    }

    const updated = { ...item, ...updates };
    setInspectionItems(
      inspectionItems.map((i) => (i.id === item.id ? updated : i))
    );

    // Salvar no repositório usando updateInspectionItems em lote
    // Os itens serão salvos quando o usuário clicar em "Salvar" ou "Finalizar"
  };

  const handleEvidencesChange = async (
    inspectionItemId: string,
    photos: Array<{ file?: File; preview: string; evidenceId?: string }>
  ) => {
    if (!id) return;

    // Remover evidências que não estão mais na lista
    const oldEvidences = evidences.filter(
      (e) => e.inspectionItemId === inspectionItemId
    );
    const currentEvidenceIds = photos
      .map((p) => p.evidenceId)
      .filter((id): id is string => !!id);
    
    for (const old of oldEvidences) {
      if (!currentEvidenceIds.includes(old.id)) {
        try {
          await repository.deleteEvidence(old.id);
          setEvidences(evidences.filter((e) => e.id !== old.id));
        } catch (error) {
          console.error('Error deleting evidence:', error);
        }
      }
    }

    // Adicionar novas evidências (que têm file mas não evidenceId)
    for (const photo of photos) {
      if (photo.file && !photo.evidenceId) {
        try {
          const evidence = await repository.createEvidence(id, photo.file, inspectionItemId);
          setEvidences([...evidences, evidence]);
          // Atualizar a foto com o evidenceId
          photo.evidenceId = evidence.id;
        } catch (error) {
          console.error('Error creating evidence:', error);
        }
      }
    }
  };

  const handleGeneralEvidencesChange = async (
    photos: Array<{ file?: File; preview: string; evidenceId?: string }>
  ) => {
    if (!id) return;

    // Remover evidências que não estão mais na lista
    const oldGeneral = evidences.filter((e) => !e.inspectionItemId);
    const currentEvidenceIds = photos
      .map((p) => p.evidenceId)
      .filter((id): id is string => !!id);
    
    for (const old of oldGeneral) {
      if (!currentEvidenceIds.includes(old.id)) {
        try {
          await repository.deleteEvidence(old.id);
          setEvidences(evidences.filter((e) => e.id !== old.id));
        } catch (error) {
          console.error('Error deleting evidence:', error);
        }
      }
    }

    // Adicionar novas evidências (que têm file mas não evidenceId)
    for (const photo of photos) {
      if (photo.file && !photo.evidenceId) {
        try {
          const evidence = await repository.createEvidence(id, photo.file);
          setEvidences([...evidences, evidence]);
          // Atualizar a foto com o evidenceId
          photo.evidenceId = evidence.id;
        } catch (error) {
          console.error('Error creating evidence:', error);
        }
      }
    }

    setGeneralEvidences(photos);
  };

  const handleSave = async () => {
    if (!id || !inspection) return;
    try {
      setSaving(true);
      
      // Atualizar itens em lote
      const itemsToUpdate = inspectionItems
        .filter((item) => !item.id.startsWith('temp-'))
        .map((item) => ({
          inspectionItemId: item.id,
          answer: item.answer || undefined,
          notes: item.notes,
        }));

      if (itemsToUpdate.length > 0) {
        await repository.updateInspectionItems(id, itemsToUpdate);
        // Recarregar itens atualizados
        const updatedItems = await repository.getInspectionItems(id);
        setInspectionItems(updatedItems);
      }

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
      // Atualizar itens em lote antes de finalizar
      const itemsToUpdate = inspectionItems
        .filter((item) => !item.id.startsWith('temp-'))
        .map((item) => ({
          inspectionItemId: item.id,
          answer: item.answer || undefined,
          notes: item.notes,
        }));

      if (itemsToUpdate.length > 0) {
        await repository.updateInspectionItems(id, itemsToUpdate);
      }

      // Salvar assinatura se ainda não foi salva
      if (signature && !signature.id && signerName) {
        // Converter dataUrl para base64 sem prefixo
        // A assinatura pode ter imageDataUrl temporário ou imagePath
        const imageData = (signature as any).imageDataUrl || signature.imagePath;
        if (imageData) {
          const base64 = imageData.includes(',') 
            ? imageData.split(',')[1] 
            : imageData;
          await repository.createSignature(id, {
            signerName,
            imageBase64: base64,
          });
        }
      }

      // Finalizar usando o endpoint correto
      const finalized = await repository.finalizeInspection(id);
      setInspection(finalized);

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
          value={signature ? ((signature as any).imageDataUrl || (signature.imagePath ? 
            (signature.imagePath.startsWith('http') 
              ? signature.imagePath 
              : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${signature.imagePath}`) 
            : null)) : null}
          onChange={(dataUrl) => {
            if (dataUrl) {
              // Armazenar temporariamente como imageDataUrl para o componente
              // Será convertido para base64 ao salvar
              setSignature({
                id: signature?.id || '',
                inspectionId: id || '',
                signerName,
                signerRoleLabel: 'Líder/Encarregado',
                imagePath: '', // Será preenchido ao salvar
                imageDataUrl: dataUrl, // Temporário
                signedAt: new Date().toISOString(),
              } as any);
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
