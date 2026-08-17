import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { Delete, Search } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InspectionListItem } from "@/domain";
import { InspectionStatus, ModuleType, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useListQueryState } from "@/hooks/useListQueryState";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { getModuleLabel } from "@/utils/moduleLabel";
import { ListPagination } from "@/components/ListPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableEditButton,
  TableViewButton,
} from "@/components/ui";

const DEFAULT_LIMIT = 10;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;

function toSearchParam(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface InspectionsPageProps {
  moduleOptions?: ModuleType[];
  defaultModule?: ModuleType;
}

export const InspectionsPage = ({
  moduleOptions,
  defaultModule,
}: InspectionsPageProps = {}): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const { user, hasRole } = useAuthStore();
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  const availableModules = useMemo(
    () =>
      moduleOptions && moduleOptions.length > 0
        ? moduleOptions
        : [
            ModuleType.CAMPO,
            ModuleType.REMOTO,
            ModuleType.POS_OBRA,
            ModuleType.OBRAS_INVESTIMENTO,
            ModuleType.SEGURANCA_TRABALHO,
          ],
    [moduleOptions]
  );
  const initialSelectedModule: ModuleType | "" =
    defaultModule && availableModules.includes(defaultModule)
      ? defaultModule
      : moduleOptions && moduleOptions.length > 0
        ? moduleOptions[0]
        : "";
  const listQueryDefaults = useMemo(
    () => ({
      page: "1",
      limit: String(DEFAULT_LIMIT),
      osNumber: "",
      module: initialSelectedModule,
    }),
    [initialSelectedModule]
  );
  const { values, setFilter, setValues, page, limit, setPage, setLimit } =
    useListQueryState(listQueryDefaults);
  const selectedModule = (values.module as ModuleType | "") || "";
  const osNumber = values.osNumber;
  const debouncedOsNumber = useDebouncedValue(osNumber, SEARCH_DEBOUNCE_MS);
  const osNumberFilter = toSearchParam(debouncedOsNumber);
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingInspection, setDeletingInspection] = useState<InspectionListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isFiscal = hasRole("FISCAL" as any) && user;
  const inspectionsTitle = useMemo(() => {
    if (location.pathname.startsWith("/safety/inspections")) {
      return "Vistorias - Segurança do Trabalho";
    }
    if (location.pathname.startsWith("/quality/inspections")) {
      return "Vistorias - Qualidade";
    }
    if (location.pathname.startsWith("/inspections/mine")) {
      return "Vistorias - Minhas";
    }
    return "Vistorias";
  }, [location.pathname]);

  useEffect(() => {
    if (defaultModule && availableModules.includes(defaultModule)) {
      if (selectedModule !== defaultModule) {
        setValues({ module: defaultModule });
      }
      return;
    }
    if (selectedModule && !availableModules.includes(selectedModule as ModuleType)) {
      setValues({
        module: moduleOptions && moduleOptions.length > 0 ? moduleOptions[0] : "",
        page: "1",
      });
    }
  }, [defaultModule, availableModules, moduleOptions, selectedModule, setValues]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request = isFiscal
      ? appRepository.getMyInspections({
          page,
          limit,
          osNumber: osNumberFilter,
        })
      : appRepository.getInspections({
          page,
          limit,
          osNumber: osNumberFilter,
          module: selectedModule || undefined,
        });
    request
      .then((res) => {
        if (cancelled) return;
        setInspections(res.data);
        setMeta(res.meta);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFiscal, page, limit, osNumberFilter, refreshNonce, selectedModule]);

  if (loading && !meta) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const isAdminOrManager =
    user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;
  const canDeleteInspection = (inspection: InspectionListItem): boolean =>
    inspection.status === InspectionStatus.RASCUNHO;

  const handleDeleteInspection = async () => {
    if (!deletingInspection || deleting) return;
    setDeleting(true);
    try {
      await appRepository.deleteInspection(deletingInspection.externalId);
      setDeletingInspection(null);
      setRefreshNonce((current) => current + 1);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Operação"
        title={inspectionsTitle}
        subtitle="Acompanhe o andamento, status e desempenho das vistorias em campo."
      />

      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Número da OS"
          value={osNumber}
          onChange={(e) => {
            setFilter("osNumber", e.target.value);
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 280 }}
        />
        {!isFiscal && (
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Módulo</InputLabel>
            <Select
              value={selectedModule}
              label="Módulo"
              onChange={(event) => {
                setFilter("module", event.target.value as ModuleType | "");
              }}
            >
              <MenuItem value="">
                <em>Todos os módulos</em>
              </MenuItem>
              {availableModules.map((module) => (
                <MenuItem key={module} value={module}>
                  {getModuleLabel(module)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <SectionTable title="Lista de vistorias">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
              <TableCell>OS / Obra</TableCell>
              <TableCell>Descrição do serviço</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Data de execução</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data da vistoria</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  {osNumberFilter
                    ? "Nenhuma vistoria encontrada para o número da OS informado."
                    : "Nenhuma vistoria encontrada."}
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
                  <TableCell>{inspection.serviceOrder?.resultado ?? "-"}</TableCell>
                  <TableCell>
                    {inspection.serviceOrder?.fimExecucao
                      ? new Date(inspection.serviceOrder.fimExecucao).toLocaleString(
                          "pt-BR",
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>{inspection.team?.name || "-"}</TableCell>
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
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableViewButton
                      onClick={() =>
                        navigate(`/inspections/${inspection.externalId}`, {
                          state: { from: detailFrom },
                        })
                      }
                      />
                      {!isSupervisor && (isAdminOrManager || inspection.status === InspectionStatus.RASCUNHO) && (
                        <TableEditButton
                        onClick={() =>
                          navigate(
                            isAdminOrManager
                              ? `/inspections/${inspection.externalId}/manage`
                              : `/inspections/${inspection.externalId}/fill`,
                            { state: { from: detailFrom } }
                          )
                        }
                        />
                      )}
                      {!isSupervisor && canDeleteInspection(inspection) && (
                        <Tooltip title="Excluir vistoria em rascunho">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeletingInspection(inspection)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
            onRowsPerPageChange={setLimit}
            rowsPerPageOptions={[10, 20, 50, 100]}
            disabled={loading}
          />
        )}
      </SectionTable>
      <ConfirmDialog
        open={!!deletingInspection}
        title="Excluir vistoria em rascunho"
        description={`Deseja excluir a vistoria "${deletingInspection?.serviceDescription ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingInspection(null);
        }}
        onConfirm={handleDeleteInspection}
      />
    </Box>
  );
};
