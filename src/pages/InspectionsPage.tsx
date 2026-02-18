import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inspection } from '@/domain';
import { InspectionStatus } from '@/domain/enums';
import { appRepository } from '@/repositories/AppRepository';
import { useAuthStore } from '@/stores/authStore';
import { StatusChip } from '@/components/StatusChip';
import { PercentBadge } from '@/components/PercentBadge';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { getModuleLabel } from '@/utils/moduleLabel';

export const InspectionsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
      setLoading(true);
    const data = navigator.onLine
      ? hasRole('FISCAL' as any)
        ? (await appRepository.getMyInspections({ page: 1, limit: 100 })).data
        : (await appRepository.getInspections({ page: 1, limit: 100 })).data
      : hasRole('FISCAL' as any) && user
        ? await appRepository.listInspectionsByUser(user.id)
        : await appRepository.listInspections();
    setInspections(data);
      setLoading(false);
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
              <TableCell>Sync</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection) => (
              <TableRow key={inspection.externalId}>
                <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>
                  {inspection.locationDescription || '-'}
                </TableCell>
                <TableCell>
                  <StatusChip status={inspection.status} />
                </TableCell>
                <TableCell>
                  <SyncStatusBadge state={inspection.syncState} />
                </TableCell>
                <TableCell>
                  {inspection.scorePercent !== undefined && inspection.scorePercent !== null ? (
                    <PercentBadge percent={inspection.scorePercent} size="small" />
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {inspection.finalizedAt
                    ? new Date(inspection.finalizedAt).toLocaleDateString('pt-BR')
                    : new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => navigate(`/inspections/${inspection.externalId}`)}>
                    Ver
                  </Button>
                  {inspection.status === InspectionStatus.RASCUNHO && (
                    <Button
                      size="small"
                      onClick={() => navigate(`/inspections/${inspection.externalId}/fill`)}
                    >
                      Editar
                    </Button>
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
