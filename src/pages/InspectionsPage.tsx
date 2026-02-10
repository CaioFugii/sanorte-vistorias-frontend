import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inspection, ModuleType, InspectionStatus } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useAuthStore } from '@/stores';
import { useSnackbar } from '@/utils/useSnackbar';
import { StatusChip } from '@/components/StatusChip';
import { PercentBadge } from '@/components/PercentBadge';

const moduleLabels: Record<ModuleType, string> = {
  [ModuleType.SEGURANCA_TRABALHO]: 'Segurança do Trabalho',
  [ModuleType.OBRAS_INVESTIMENTO]: 'Obras de Investimento',
  [ModuleType.OBRAS_GLOBAL]: 'Obras Globais',
  [ModuleType.CANTEIRO]: 'Canteiro',
};

export const InspectionsPage = () => {
  const navigate = useNavigate();
  const repository = useRepository();
  const { user, hasRole } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      let response;
      if (hasRole('FISCAL' as any)) {
        response = await repository.getInspectionsByUser();
      } else {
        response = await repository.getInspections();
      }
      setInspections(response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar vistorias', 'error');
    } finally {
      setLoading(false);
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
        Vistorias
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
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
                <TableCell>
                  <Chip
                    label={moduleLabels[inspection.module]}
                    size="small"
                  />
                </TableCell>
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
                    : new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/inspections/${inspection.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                  {(inspection.status === InspectionStatus.RASCUNHO ||
                    hasRole('GESTOR' as any) ||
                    hasRole('ADMIN' as any)) && (
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/inspections/${inspection.id}/fill`)
                      }
                    >
                      <Edit />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
