import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InspectionListItem } from "@/domain";
import { InspectionStatus } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";

const DEFAULT_LIMIT = 10;

export const PendingsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPendings = async () => {
    setLoading(true);
    const res = await appRepository.getInspections({
      status: InspectionStatus.PENDENTE_AJUSTE,
      page,
      limit,
    });
    setInspections(res.data);
    setMeta(res.meta);
    setLoading(false);
  };

  useEffect(() => {
    loadPendings();
  }, [page, limit]);

  if (loading && !meta) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Controle de qualidade"
        title="Pendências de Ajuste"
        subtitle="Resolva os itens não conformes nas vistorias para concluir o ciclo de qualidade."
      />

      <SectionTable title="Pendências ativas">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Nenhuma pendência de ajuste.
                </TableCell>
              </TableRow>
            ) : (
            inspections.map((inspection) => (
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
      </SectionTable>
    </Box>
  );
};
