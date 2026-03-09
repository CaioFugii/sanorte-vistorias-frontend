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
import { ListPagination } from "@/components/ListPagination";

const DEFAULT_LIMIT = 10;

export const InspectionsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [allForFiscal, setAllForFiscal] = useState<Inspection[] | null>(null);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const isFiscal = hasRole("FISCAL" as any) && user;

  useEffect(() => {
    if (!isFiscal || !user) return;
    setLoading(true);
    appRepository
      .listInspectionsForFiscal(user.id)
      .then((all) => setAllForFiscal(all))
      .finally(() => setLoading(false));
  }, [isFiscal, user?.id]);

  useEffect(() => {
    if (isFiscal) return;
    setAllForFiscal(null);
    setLoading(true);
    appRepository
      .getInspections({ page, limit })
      .then((res) => {
        setInspections(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [isFiscal, page, limit]);

  useEffect(() => {
    if (allForFiscal === null) return;
    const total = allForFiscal.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    setInspections(allForFiscal.slice(start, start + limit));
    setMeta({
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  }, [allForFiscal, page, limit]);

  if (loading && !meta) {
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
              <TableCell>Número da OS</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  Nenhuma vistoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => (
                <TableRow key={inspection.externalId}>
                  <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                  <TableCell>{inspection.serviceOrder?.osNumber ?? "-"}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
        {meta && meta.total > 0 && (
          <ListPagination
            meta={meta}
            onPageChange={setPage}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            disabled={loading}
          />
        )}
      </TableContainer>
    </Box>
  );
};
