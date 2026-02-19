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
} from "@mui/material";
import { CloudDone, CloudQueue } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inspection } from "@/domain";
import { InspectionStatus, SyncState } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { getModuleLabel } from "@/utils/moduleLabel";

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
    let data: Inspection[];
    if (hasRole("FISCAL" as any) && user) {
      data = await appRepository.listInspectionsForFiscal(user.id);
    } else if (navigator.onLine) {
      data = (await appRepository.getInspections({ page: 1, limit: 100 })).data;
    } else {
      data = await appRepository.listInspections();
    }
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

  const isFiscal = hasRole("FISCAL" as any);
  const isNotSynced = (i: Inspection) =>
    i.syncState === SyncState.PENDING_SYNC || i.syncState === SyncState.SYNC_ERROR;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vistorias
      </Typography>
      {isFiscal && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Vistorias com ícone <CloudQueue fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} /> ou
          status &quot;Pendente&quot; / &quot;Erro ao sincronizar&quot; ainda não foram enviadas ao servidor. Use o botão
          &quot;Sincronizar&quot; na barra superior quando estiver online.
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {isFiscal && <TableCell width={48} />}
              <TableCell>Módulo</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
              {isFiscal && <TableCell>Sincronização</TableCell>}
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection) => (
              <TableRow
                key={inspection.externalId}
                sx={
                  isFiscal && isNotSynced(inspection)
                    ? {
                        borderLeft: "4px solid",
                        borderLeftColor: "warning.main",
                        bgcolor: "action.hover",
                      }
                    : undefined
                }
              >
                {isFiscal && (
                  <TableCell padding="checkbox" sx={{ verticalAlign: "middle" }}>
                    {isNotSynced(inspection) ? (
                      <CloudQueue color="warning" titleAccess="Aguardando sincronização" />
                    ) : (
                      <CloudDone sx={{ color: "success.main" }} titleAccess="Sincronizado" />
                    )}
                  </TableCell>
                )}
                <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>{inspection.locationDescription || "-"}</TableCell>
                <TableCell>
                  <StatusChip status={inspection.status} />
                </TableCell>
                {isFiscal && (
                  <TableCell>
                    <SyncStatusBadge state={inspection.syncState} />
                  </TableCell>
                )}
                <TableCell>
                  {inspection.scorePercent !== undefined &&
                  inspection.scorePercent !== null ? (
                    <PercentBadge
                      percent={inspection.scorePercent}
                      size="small"
                    />
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {inspection.finalizedAt
                    ? new Date(inspection.finalizedAt).toLocaleDateString(
                        "pt-BR",
                      )
                    : new Date(inspection.createdAt).toLocaleDateString(
                        "pt-BR",
                      )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() =>
                      navigate(`/inspections/${inspection.externalId}`)
                    }
                  >
                    Ver
                  </Button>
                  {inspection.status === InspectionStatus.RASCUNHO && (
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(`/inspections/${inspection.externalId}/fill`)
                      }
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
