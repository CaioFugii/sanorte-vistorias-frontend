import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { Delete, FilterAltOff, Search } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InspectionListItem, Team } from "@/domain";
import { InspectionStatus, ModuleType, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useListQueryState } from "@/hooks/useListQueryState";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { getInspectionModuleDisplayLabel, getModuleLabel } from "@/utils/moduleLabel";
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

const STATUS_FILTER_OPTIONS: Array<{ value: InspectionStatus; label: string }> = [
  { value: InspectionStatus.FINALIZADA, label: "Finalizada" },
  { value: InspectionStatus.PENDENTE_AJUSTE, label: "Pendente Ajuste" },
  { value: InspectionStatus.RESOLVIDA, label: "Resolvida" },
];

function toSearchParam(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined;
}

function teamMatchesContract(team: Team, contractId?: string): boolean {
  if (!contractId) return true;
  if (team.contractIds?.includes(contractId)) return true;
  return Boolean(team.contracts?.some((contract) => contract.id === contractId));
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
  hideHeader?: boolean;
  embedded?: boolean;
  contractId?: string;
}

export const InspectionsPage = ({
  moduleOptions,
  defaultModule,
  hideHeader = false,
  embedded = false,
  contractId,
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
      teamId: "",
      createdByUserId: "",
      service: "",
      status: "",
      executionFrom: "",
      executionTo: "",
      inspectionFrom: "",
      inspectionTo: "",
    }),
    [initialSelectedModule]
  );
  const { values, setFilter, setValues, reset, page, limit, setPage, setLimit } =
    useListQueryState(listQueryDefaults);
  const selectedModule = (values.module as ModuleType | "") || "";
  const osNumber = values.osNumber;
  const selectedTeamId = values.teamId;
  const selectedFiscalId = values.createdByUserId;
  const service = values.service;
  const selectedStatus = (values.status as InspectionStatus | "") || "";
  const executionFrom = values.executionFrom;
  const executionTo = values.executionTo;
  const inspectionFrom = values.inspectionFrom;
  const inspectionTo = values.inspectionTo;
  const debouncedOsNumber = useDebouncedValue(osNumber, SEARCH_DEBOUNCE_MS);
  const osNumberFilter = toSearchParam(debouncedOsNumber);
  const debouncedService = useDebouncedValue(service, SEARCH_DEBOUNCE_MS);
  const serviceFilter = toSearchParam(debouncedService);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [fiscalOptions, setFiscalOptions] = useState<Array<{ id: string; name: string }>>([]);
  const selectedTeamIdRef = useRef(selectedTeamId);
  selectedTeamIdRef.current = selectedTeamId;
  const selectedFiscalIdRef = useRef(selectedFiscalId);
  selectedFiscalIdRef.current = selectedFiscalId;
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
    if (!embedded) {
      setTeamOptions([]);
      setFiscalOptions([]);
      return;
    }

    let cancelled = false;
    const loadFilterOptions = async () => {
      const selectedContractId = contractId || undefined;
      const pageSize = 100;
      const collected: Team[] = [];
      let teamPage = 1;
      let hasNext = true;

      try {
        const fiscalsPromise = appRepository.getFiscals({
          contractId: selectedContractId,
        });

        while (hasNext) {
          const result = await appRepository.getTeams({
            page: teamPage,
            limit: pageSize,
            contractId: selectedContractId,
          });
          collected.push(...result.data);
          hasNext = Boolean(result.meta?.hasNext);
          teamPage += 1;
          if (teamPage > 50) break;
        }

        const fiscals = await fiscalsPromise;
        if (cancelled) return;

        const activeTeams = collected
          .filter((team) => team.active && teamMatchesContract(team, selectedContractId))
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
        setTeamOptions(activeTeams);
        if (
          selectedTeamIdRef.current &&
          !activeTeams.some((team) => team.id === selectedTeamIdRef.current)
        ) {
          setValues({ teamId: "" });
        }

        const fiscalsData = [...(fiscals.data ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
        );
        setFiscalOptions(fiscalsData);
        if (
          selectedFiscalIdRef.current &&
          !fiscalsData.some((fiscal) => fiscal.id === selectedFiscalIdRef.current)
        ) {
          setValues({ createdByUserId: "" });
        }
      } catch {
        if (cancelled) return;
        setTeamOptions([]);
        setFiscalOptions([]);
        if (selectedTeamIdRef.current) setValues({ teamId: "" });
        if (selectedFiscalIdRef.current) setValues({ createdByUserId: "" });
      }
    };

    void loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, [embedded, contractId, setValues]);

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
          contractId: contractId || undefined,
          teamId: embedded ? selectedTeamId || undefined : undefined,
          createdByUserId: embedded ? selectedFiscalId || undefined : undefined,
          service: embedded ? serviceFilter : undefined,
          status: embedded ? selectedStatus || undefined : undefined,
          executionFrom: embedded ? executionFrom || undefined : undefined,
          executionTo: embedded ? executionTo || undefined : undefined,
          inspectionFrom: embedded ? inspectionFrom || undefined : undefined,
          inspectionTo: embedded ? inspectionTo || undefined : undefined,
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
  }, [
    isFiscal,
    page,
    limit,
    osNumberFilter,
    refreshNonce,
    selectedModule,
    contractId,
    selectedTeamId,
    selectedFiscalId,
    serviceFilter,
    selectedStatus,
    executionFrom,
    executionTo,
    inspectionFrom,
    inspectionTo,
    embedded,
  ]);

  const selectedTeam = useMemo(
    () => teamOptions.find((team) => team.id === selectedTeamId) ?? null,
    [teamOptions, selectedTeamId]
  );
  const selectedFiscal = useMemo(
    () => fiscalOptions.find((fiscal) => fiscal.id === selectedFiscalId) ?? null,
    [fiscalOptions, selectedFiscalId]
  );
  const hasActiveFilters = Boolean(
    osNumber.trim() ||
      (selectedModule && selectedModule !== initialSelectedModule) ||
      selectedTeamId ||
      selectedFiscalId ||
      service.trim() ||
      selectedStatus ||
      executionFrom ||
      executionTo ||
      inspectionFrom ||
      inspectionTo
  );

  if (loading && !meta && !embedded) {
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

  const inspectionsTable = (
    <>
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
                <TableCell>{getInspectionModuleDisplayLabel(inspection.module, inspection.evaluationModule)}</TableCell>
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
    </>
  );

  return (
    <Box>
      {!hideHeader && (
        <PageHeader
          eyebrow="Operação"
          title={inspectionsTitle}
          subtitle="Acompanhe o andamento, status e desempenho das vistorias em campo."
        />
      )}

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
        {embedded && (
          <>
            <Autocomplete
              size="small"
              sx={{ minWidth: 240 }}
              options={fiscalOptions}
              getOptionLabel={(fiscal) => fiscal.name}
              value={selectedFiscal}
              onChange={(_, fiscal) => {
                setFilter("createdByUserId", fiscal?.id ?? "");
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="Nenhum fiscal"
              renderInput={(params) => <TextField {...params} label="Fiscal" />}
            />
            <Autocomplete
              size="small"
              sx={{ minWidth: 240 }}
              options={teamOptions}
              getOptionLabel={(team) => team.name}
              value={selectedTeam}
              onChange={(_, team) => {
                setFilter("teamId", team?.id ?? "");
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="Nenhuma equipe"
              renderInput={(params) => <TextField {...params} label="Equipe" />}
            />
            <TextField
              size="small"
              label="Serviço"
              placeholder="Filtrar por serviço"
              value={service}
              onChange={(e) => {
                setFilter("service", e.target.value);
              }}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(event) => {
                  setFilter("status", event.target.value);
                }}
              >
                <MenuItem value="">
                  <em>Todos os status</em>
                </MenuItem>
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Execução de"
              type="date"
              value={executionFrom}
              onChange={(e) => {
                const value = e.target.value;
                if (value && executionTo && value > executionTo) {
                  setValues({ executionFrom: value, executionTo: value, page: "1" });
                  return;
                }
                setFilter("executionFrom", value);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: executionTo || undefined }}
            />
            <TextField
              size="small"
              label="Execução até"
              type="date"
              value={executionTo}
              onChange={(e) => {
                const value = e.target.value;
                if (value && executionFrom && value < executionFrom) {
                  setValues({ executionFrom: value, executionTo: value, page: "1" });
                  return;
                }
                setFilter("executionTo", value);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: executionFrom || undefined }}
            />
            <TextField
              size="small"
              label="Vistoria de"
              type="date"
              value={inspectionFrom}
              onChange={(e) => {
                const value = e.target.value;
                if (value && inspectionTo && value > inspectionTo) {
                  setValues({ inspectionFrom: value, inspectionTo: value, page: "1" });
                  return;
                }
                setFilter("inspectionFrom", value);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: inspectionTo || undefined }}
            />
            <TextField
              size="small"
              label="Vistoria até"
              type="date"
              value={inspectionTo}
              onChange={(e) => {
                const value = e.target.value;
                if (value && inspectionFrom && value < inspectionFrom) {
                  setValues({ inspectionFrom: value, inspectionTo: value, page: "1" });
                  return;
                }
                setFilter("inspectionTo", value);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: inspectionFrom || undefined }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterAltOff />}
              onClick={() => reset()}
              disabled={!hasActiveFilters}
            >
              Limpar filtros
            </Button>
          </>
        )}
      </Box>

      {embedded ? (
        <Paper sx={{ overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <TableContainer>{inspectionsTable}</TableContainer>
        </Paper>
      ) : (
        <SectionTable title="Lista de vistorias">{inspectionsTable}</SectionTable>
      )}
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
