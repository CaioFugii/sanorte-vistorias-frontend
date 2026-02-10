import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Chip,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { Edit, PictureAsPdf, ArrowBack } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Inspection,
  InspectionItem,
  ChecklistItem,
  Evidence,
  Signature,
  ModuleType,
} from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useAuthStore } from '@/stores';
import { useSnackbar } from '@/utils/useSnackbar';
import { StatusChip } from '@/components/StatusChip';
import { PercentBadge } from '@/components/PercentBadge';
import jsPDF from 'jspdf';

const moduleLabels: Record<ModuleType, string> = {
  [ModuleType.SEGURANCA_TRABALHO]: 'Segurança do Trabalho',
  [ModuleType.OBRAS_INVESTIMENTO]: 'Obras de Investimento',
  [ModuleType.OBRAS_GLOBAL]: 'Obras Globais',
  [ModuleType.CANTEIRO]: 'Canteiro',
};

export const InspectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repository = useRepository();
  const { hasRole } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [signature, setSignature] = useState<Signature | null>(null);

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
      setInspectionItems(items);
      setEvidences(evids);
      setSignature(sig);
    } catch (error) {
      showSnackbar('Erro ao carregar vistoria', 'error');
    } finally {
      setLoading(false);
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
    return null;
  }

  const canEdit =
    inspection.status === 'RASCUNHO' ||
    hasRole('GESTOR' as any) ||
    hasRole('ADMIN' as any);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/inspections')}
          >
            Voltar
          </Button>
          <Typography variant="h4">Detalhes da Vistoria</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleGeneratePDF}
          >
            Gerar PDF
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/inspections/${inspection.id}/fill`)}
            >
              Editar
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações Gerais
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Módulo:</strong>{' '}
              <Chip
                label={moduleLabels[inspection.module]}
                size="small"
              />
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Serviço:</strong> {inspection.serviceDescription}
            </Typography>
            {inspection.locationDescription && (
              <Typography variant="body2" gutterBottom>
                <strong>Localização:</strong> {inspection.locationDescription}
              </Typography>
            )}
            <Typography variant="body2" gutterBottom>
              <strong>Status:</strong> <StatusChip status={inspection.status} />
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Percentual:</strong>{' '}
              <PercentBadge percent={inspection.scorePercent} />
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Data de Criação:</strong>{' '}
              {new Date(inspection.createdAt).toLocaleString('pt-BR')}
            </Typography>
            {inspection.finalizedAt && (
              <Typography variant="body2" gutterBottom>
                <strong>Data de Finalização:</strong>{' '}
                {new Date(inspection.finalizedAt).toLocaleString('pt-BR')}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Checklist
            </Typography>
            {checklistItems.map((checklistItem) => {
              const item = inspectionItems.find(
                (i) => i.checklistItemId === checklistItem.id
              );
              return (
                <Box key={checklistItem.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {checklistItem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resposta: {item?.answer || 'Não avaliado'}
                  </Typography>
                  {item?.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Observações: {item.notes}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Paper>
        </Grid>

        {evidences.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Evidências
              </Typography>
              <ImageList cols={3} gap={8}>
                {evidences.map((evidence) => {
                  const imageUrl = evidence.filePath.startsWith('http')
                    ? evidence.filePath
                    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${evidence.filePath}`;
                  return (
                    <ImageListItem key={evidence.id}>
                      <img
                        src={imageUrl}
                        alt={evidence.fileName}
                        style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                      />
                    </ImageListItem>
                  );
                })}
              </ImageList>
            </Paper>
          </Grid>
        )}

        {signature && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assinatura
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Assinado por:</strong> {signature.signerName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Função:</strong> {signature.signerRoleLabel}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Data:</strong>{' '}
                {new Date(signature.signedAt).toLocaleString('pt-BR')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <img
                  src={signature.imagePath.startsWith('http')
                    ? signature.imagePath
                    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${signature.imagePath}`}
                  alt="Assinatura"
                  style={{ maxWidth: '100%', border: '1px solid #ccc' }}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
