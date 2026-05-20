import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InspectionListItem } from "@/domain";
import { InspectionStatus, ModuleType } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { getModuleLabel } from "@/utils/moduleLabel";
import {
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableViewButton,
} from "@/components/ui";

const DEFAULT_LIMIT = 10;
const MODULE_OPTIONS: ModuleType[] = [
  ModuleType.CAMPO,
  ModuleType.REMOTO,
  ModuleType.POS_OBRA,
  ModuleType.OBRAS_INVESTIMENTO,
  ModuleType.SEGURANCA_TRABALHO,
];

export const PendingsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const [selectedModule, setSelectedModule] = useState<ModuleType | "">("");
  const [osNumber, setOsNumber] = useState("");
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
      module: selectedModule || undefined,
      osNumber: osNumber.trim() || undefined,
      page,
      limit,
    });
    setInspections(res.data);
    setMeta(res.meta);
    setLoading(false);
  };

  useEffect(() => {
    loadPendings();
  }, [page, limit, selectedModule, osNumber]);

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

      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Pesquisar por número da OS"
          value={osNumber}
          onChange={(e) => {
            setOsNumber(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Módulo</InputLabel>
          <Select
            value={selectedModule}
            label="Módulo"
            onChange={(event) => {
              setSelectedModule(event.target.value as ModuleType | "");
              setPage(1);
            }}
          >
            <MenuItem value="">
              <em>Todos os módulos</em>
            </MenuItem>
            {MODULE_OPTIONS.map((module) => (
              <MenuItem key={module} value={module}>
                {getModuleLabel(module)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <SectionTable title="Pendências ativas">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
              <TableCell>OS / Obra</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  {osNumber.trim()
                    ? "Nenhuma pendência encontrada para o número da OS informado."
                    : "Nenhuma pendência de ajuste."}
                </TableCell>
              </TableRow>
            ) : (
            inspections.map((inspection) => (
              <TableRow key={inspection.externalId}>
                <TableCell>{getModuleLabel(inspection.module)}</TableCell>
                <TableCell>
                  {inspection.serviceOrder?.osNumber ??
                    inspection.investmentWork?.workName ??
                    inspection.investmentWork?.name ??
                    "-"}
                </TableCell>
                <TableCell>{inspection.serviceDescription}</TableCell>
                <TableCell>
                  {inspection.locationDescription || "-"}
                </TableCell>
                <TableCell>{inspection.team?.name || "-"}</TableCell>
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
                <TableActionsCell>
                  <TableActionsGroup>
                    <TableViewButton
                      label="Ver e resolver"
                      onClick={() =>
                        navigate(`/inspections/${inspection.externalId}`, {
                          state: { from: detailFrom },
                        })
                      }
                    />
                  </TableActionsGroup>
                </TableActionsCell>
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
