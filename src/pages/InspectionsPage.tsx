import {
  Box,
  Button,
  Chip,
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inspection } from "@/domain";
import { InspectionStatus, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
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
    } else {
      data = (await appRepository.getInspections({ page: 1, limit: 100 })).data;
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

  const isAdminOrManager =
    user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;

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
              <TableRow key={inspection.externalId}>
                <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>{inspection.locationDescription || "-"}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <StatusChip status={inspection.status} />
                    {inspection.hasParalysisPenalty && (
                      <Chip size="small" label="Penalizada" color="warning" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
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
                  {(isAdminOrManager || inspection.status === InspectionStatus.RASCUNHO) && (
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(
                          isAdminOrManager
                            ? `/inspections/${inspection.externalId}/manage`
                            : `/inspections/${inspection.externalId}/fill`
                        )
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
