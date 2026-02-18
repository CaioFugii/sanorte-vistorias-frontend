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
import { Visibility } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inspection } from "@/domain";
import { InspectionStatus } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";

export const PendingsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendings = async () => {
    setLoading(true);
    const data = navigator.onLine
      ? (await appRepository.getInspections({
          status: InspectionStatus.PENDENTE_AJUSTE,
          page: 1,
          limit: 100,
        })).data
      : await appRepository.listPendingAdjustments();
    setInspections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPendings();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pendências de Ajuste
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Resolva cada item não conforme na tela de detalhes da vistoria. Quando todos os itens estiverem resolvidos, a vistoria será marcada como resolvida.
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
              <TableRow key={inspection.externalId}>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>
                  {inspection.locationDescription || "-"}
                </TableCell>
                <TableCell>
                  <StatusChip status={inspection.status} />
                </TableCell>
                <TableCell>
                  {inspection.scorePercent !== undefined &&
                  inspection.scorePercent !== null ? (
                    <PercentBadge percent={inspection.scorePercent} size="small" />
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {inspection.finalizedAt
                    ? new Date(inspection.finalizedAt).toLocaleDateString("pt-BR")
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() =>
                      navigate(`/inspections/${inspection.externalId}`)
                    }
                  >
                    Ver e resolver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
