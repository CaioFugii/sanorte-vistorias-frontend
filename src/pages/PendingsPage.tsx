import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { Visibility, CheckCircle } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inspection,
  InspectionStatus,
} from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useSnackbar } from '@/utils/useSnackbar';
import { StatusChip } from '@/components/StatusChip';
import { PercentBadge } from '@/components/PercentBadge';
import { PhotoUploader } from '@/components/PhotoUploader';

export const PendingsPage = () => {
  const navigate = useNavigate();
  const repository = useRepository();
  const { showSnackbar } = useSnackbar();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionEvidence, setResolutionEvidence] = useState<string>('');

  useEffect(() => {
    loadPendings();
  }, []);

  const loadPendings = async () => {
    try {
      setLoading(true);
      const allInspections = await repository.getInspections();
      const pendings = allInspections.filter(
        (i) => i.status === InspectionStatus.PENDENTE_AJUSTE
      );
      setInspections(pendings);
    } catch (error) {
      showSnackbar('Erro ao carregar pendências', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setResolutionNotes('');
    setResolutionEvidence('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInspection(null);
  };

  const handleResolve = async () => {
    if (!selectedInspection) return;

    try {
      // Atualizar vistoria
      await repository.updateInspection(selectedInspection.id, {
        status: InspectionStatus.RESOLVIDA,
      });

      // Atualizar pending adjustment
      const adjustment = await repository.getPendingAdjustment(
        selectedInspection.id
      );
      if (adjustment) {
        await repository.updatePendingAdjustment(selectedInspection.id, {
          status: InspectionStatus.RESOLVIDA,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: resolutionNotes || undefined,
          resolutionEvidenceDataUrl: resolutionEvidence || undefined,
        });
      }

      showSnackbar('Pendência resolvida com sucesso', 'success');
      handleCloseDialog();
      loadPendings();
    } catch (error) {
      showSnackbar('Erro ao resolver pendência', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pendências de Ajuste
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Serviço</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection) => (
              <TableRow key={inspection.id}>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>
                  {inspection.locationDescription || '-'}
                </TableCell>
                <TableCell>
                  <StatusChip status={inspection.status} />
                </TableCell>
                <TableCell>
                  <PercentBadge percent={inspection.scorePercent} size="small" />
                </TableCell>
                <TableCell>
                  {inspection.finalizedAt
                    ? new Date(inspection.finalizedAt).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/inspections/${inspection.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleOpenDialog(inspection)}
                  >
                    <CheckCircle />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Resolver Pendência</DialogTitle>
        <DialogContent>
          {selectedInspection && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Serviço:</strong> {selectedInspection.serviceDescription}
              </Typography>
              <TextField
                fullWidth
                label="Notas de Resolução"
                multiline
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                margin="normal"
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Evidência de Correção (opcional)
                </Typography>
                <PhotoUploader
                  photos={resolutionEvidence ? [resolutionEvidence] : []}
                  onChange={(photos) =>
                    setResolutionEvidence(photos.length > 0 ? photos[0] : '')
                  }
                  maxPhotos={1}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleResolve} variant="contained" color="success">
            Marcar como Resolvida
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
