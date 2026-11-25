import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  TextField,
  Tooltip,
} from "@mui/material";
import { FilterAltOff, Search } from "@mui/icons-material";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { downloadBlob } from "@/utils/downloadBlob";
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Contract, InspectionListItem, Team } from "@/domain";
import { AccessTab, InspectionStatus, ModuleType, UserRole, InspectionExcelLayout } from "@/domain/enums";
import { canSeeTab, resolveVisibleTab } from "@/domain/rules/access-area";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useListQueryState } from "@/hooks/useListQueryState";
import { MonthFilter } from "@/components/MonthFilter";
import { coerceMonthRange, monthKeyToRange } from "@/domain/rules/monthPeriod";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { getInspectionModuleDisplayLabel, getModuleLabel } from "@/utils/moduleLabel";
import {
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

type PendingSubTab = "ativas" | "aprovacao" | "resolvidas";

const PENDING_SUB_TABS: ReadonlyArray<{
  value: PendingSubTab;
  label: string;
  access: AccessTab;
  status: InspectionStatus;
}> = [
  {
    value: "ativas",
    label: "Pendências ativas",
    access: AccessTab.PAINEL_PENDENCIAS_ATIVAS,
    status: InspectionStatus.PENDENTE_AJUSTE,
  },
  {
    value: "aprovacao",
    label: "Aguardando Aprovação",
    access: AccessTab.PAINEL_PENDENCIAS_APROVACAO,
    status: InspectionStatus.AGUARDANDO_APROVACAO,
  },
  {
    value: "resolvidas",
    label: "Resolvidas",
    access: AccessTab.PAINEL_PENDENCIAS_RESOLVIDAS,
    status: InspectionStatus.RESOLVIDA,
  },
];

const PENDINGS_LIST_QUERY = {
  sub: "",
  page: "1",
  limit: String(DEFAULT_LIMIT),
  module: "",
  contractId: "",
  teamId: "",
  osNumber: "",
  service: "",
  executionFrom: "",
  executionTo: "",
  inspectionFrom: "",
  inspectionTo: "",
};

export const PendingsTab = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;
  const visibleSubTabs = PENDING_SUB_TABS.filter((sub) => canSeeTab(user, sub.access));
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const { values, setFilter, setValues, reset, page, limit, setPage, setLimit } =
    useListQueryState(PENDINGS_LIST_QUERY);
  const pendingTab =
    resolveVisibleTab(
      values.sub,
      visibleSubTabs.map((sub) => sub.value)
    ) ?? "ativas";
  const listStatus =
    PENDING_SUB_TABS.find((sub) => sub.value === pendingTab)?.status ?? InspectionStatus.PENDENTE_AJUSTE;
  const selectedModule = (values.module as ModuleType | "") || "";
  const selectedContractId = values.contractId;
  const selectedTeamId = values.teamId;
  const osNumber = values.osNumber;
  const service = values.service;
  const executionFrom = values.executionFrom;
  const executionTo = values.executionTo;
  const inspectionFrom = values.inspectionFrom;
  const inspectionTo = values.inspectionTo;
  const executionRange = useMemo(
    () => coerceMonthRange(executionFrom, executionTo),
    [executionFrom, executionTo]
  );
  const inspectionRange = useMemo(
    () => coerceMonthRange(inspectionFrom, inspectionTo),
    [inspectionFrom, inspectionTo]
  );

  useEffect(() => {
    if (!executionFrom && !executionTo) return;
    if (!executionRange) {
      setValues({ executionFrom: "", executionTo: "" });
      return;
    }
    if (executionRange.from !== executionFrom || executionRange.to !== executionTo) {
      setValues({ executionFrom: executionRange.from, executionTo: executionRange.to });
    }
  }, [executionFrom, executionTo, executionRange, setValues]);

  useEffect(() => {
    if (!inspectionFrom && !inspectionTo) return;
    if (!inspectionRange) {
      setValues({ inspectionFrom: "", inspectionTo: "" });
      return;
    }
    if (inspectionRange.from !== inspectionFrom || inspectionRange.to !== inspectionTo) {
      setValues({ inspectionFrom: inspectionRange.from, inspectionTo: inspectionRange.to });
    }
  }, [inspectionFrom, inspectionTo, inspectionRange, setValues]);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
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
  const [adjustmentsAnchorEl, setAdjustmentsAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const selectedTeamIdRef = useRef(selectedTeamId);
  selectedTeamIdRef.current = selectedTeamId;

  const selectedTeam = useMemo(
    () => teamOptions.find((team) => team.id === selectedTeamId) ?? null,
    [teamOptions, selectedTeamId]
  );

  const hasActiveFilters = Boolean(
    selectedModule ||
      selectedContractId ||
      selectedTeamId ||
      osNumber.trim() ||
      service.trim() ||
      executionFrom ||
      executionTo ||
      inspectionFrom ||
      inspectionTo
  );

  const loadPendings = useCallback(async () => {
    setLoading(true);
    const res = await appRepository.getInspections({
      status: listStatus,
      module: selectedModule || undefined,
      contractId: selectedContractId || undefined,
      teamId: selectedTeamId || undefined,
      osNumber: osNumber.trim() || undefined,
      service: service.trim() || undefined,
      executionFrom: executionRange?.from,
      executionTo: executionRange?.to,
      inspectionFrom: inspectionRange?.from,
      inspectionTo: inspectionRange?.to,
      page,
      limit,
    });
    setInspections(res.data);
    setMeta(res.meta);
    setLoading(false);
  }, [
    listStatus,
    selectedModule,
    selectedContractId,
    selectedTeamId,
    osNumber,
    service,
    executionRange,
    inspectionRange,
    page,
    limit,
  ]);

  const handleExportPendings = async () => {
    const { blob, filename } = await appRepository.exportInspectionsExcel({
      status: listStatus,
      module: selectedModule || undefined,
      contractId: selectedContractId || undefined,
      teamId: selectedTeamId || undefined,
      osNumber: osNumber.trim() || undefined,
      service: service.trim() || undefined,
      executionFrom: executionRange?.from,
      executionTo: executionRange?.to,
      inspectionFrom: inspectionRange?.from,
      inspectionTo: inspectionRange?.to,
      layout: InspectionExcelLayout.PENDENCIAS,
    });
    downloadBlob(blob, filename);
  };

  const getPendingAdjustmentsData = (
    inspection: InspectionListItem
  ): { count: number; preview: string[] } | null => {
    if (typeof inspection.pendingItemsCount !== "number") return null;
    return {
      count: inspection.pendingItemsCount,
      preview: Array.isArray(inspection.pendingItemsPreview)
        ? inspection.pendingItemsPreview
        : [],
    };
  };

  const selectedAdjustments = inspections.find((inspection) => inspection.externalId === selectedInspectionId);

  const selectedAdjustmentsData = selectedAdjustments
    ? getPendingAdjustmentsData(selectedAdjustments)
    : null;

  const handleOpenAdjustments = (event: MouseEvent<HTMLElement>, inspectionId: string) => {
    setAdjustmentsAnchorEl(event.currentTarget);
    setSelectedInspectionId(inspectionId);
  };

  const handleCloseAdjustments = () => {
    setAdjustmentsAnchorEl(null);
    setSelectedInspectionId(null);
  };

  const isAdjustmentsPopoverOpen = Boolean(adjustmentsAnchorEl);

  useEffect(() => {
    if (!isAdmin) {
      setAdminContracts([]);
      return;
    }
    let cancelled = false;
    const loadContracts = async () => {
      try {
        const result = await appRepository.getContracts({ page: 1, limit: 100 });
        if (!cancelled) setAdminContracts(result.data);
      } catch {
        if (!cancelled) setAdminContracts([]);
      }
    };
    void loadContracts();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;
    const loadTeams = async () => {
      const contractId = selectedContractId || undefined;
      const pageSize = 100;
      const collected: Team[] = [];
      let teamPage = 1;
      let hasNext = true;
      try {
        while (hasNext) {
          const result = await appRepository.getTeams({
            page: teamPage,
            limit: pageSize,
            contractId,
          });
          collected.push(...result.data);
          hasNext = Boolean(result.meta?.hasNext);
          teamPage += 1;
          if (teamPage > 50) break;
        }
        if (cancelled) return;
        const activeTeams = collected
          .filter((team) => team.active)
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
        setTeamOptions(activeTeams);
        if (selectedTeamIdRef.current && !activeTeams.some((team) => team.id === selectedTeamIdRef.current)) {
          setValues({ teamId: "" });
        }
      } catch {
        if (!cancelled) {
          setTeamOptions([]);
          if (selectedTeamIdRef.current) setValues({ teamId: "" });
        }
      }
    };
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [selectedContractId, setValues]);

  useEffect(() => {
    loadPendings();
  }, [loadPendings]);

  const handleClearFilters = () => {
    reset();
    setValues({ sub: pendingTab });
  };

  if (loading && !meta) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Contrato</InputLabel>
          <Select
            value={selectedContractId}
            label="Contrato"
            onChange={(event) => {
              setValues({
                contractId: event.target.value,
                teamId: "",
                page: "1",
              });
            }}
          >
            <MenuItem value="">
              <em>Todos os contratos</em>
            </MenuItem>
            {contractsForFilters.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>
                {contract.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            {MODULE_OPTIONS.map((module) => (
              <MenuItem key={module} value={module}>
                {getModuleLabel(module)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <MonthFilter
          label="Execução"
          allowEmpty
          value={executionRange?.from.slice(0, 7) ?? null}
          onChange={(month) => {
            if (!month) {
              setValues({ executionFrom: "", executionTo: "", page: "1" });
              return;
            }
            const range = monthKeyToRange(month);
            setValues({ executionFrom: range.from, executionTo: range.to, page: "1" });
          }}
        />
        <MonthFilter
          label="Vistoria"
          allowEmpty
          value={inspectionRange?.from.slice(0, 7) ?? null}
          onChange={(month) => {
            if (!month) {
              setValues({ inspectionFrom: "", inspectionTo: "", page: "1" });
              return;
            }
            const range = monthKeyToRange(month);
            setValues({ inspectionFrom: range.from, inspectionTo: range.to, page: "1" });
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterAltOff />}
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Limpar filtros
        </Button>
        <ExportExcelButton onExport={handleExportPendings} disabled={loading} />
      </Box>

      {visibleSubTabs.length > 1 && (
        <Tabs
          value={pendingTab}
          onChange={(_event, value: PendingSubTab) => {
            setValues({ sub: value, page: "1" });
          }}
          sx={{ mb: 2 }}
        >
          {visibleSubTabs.map((sub) => (
            <Tab key={sub.value} value={sub.value} label={sub.label} />
          ))}
        </Tabs>
      )}

      <SectionTable
        title={PENDING_SUB_TABS.find((sub) => sub.value === pendingTab)?.label ?? "Pendências ativas"}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Módulo</TableCell>
              <TableCell>OS / Obra</TableCell>
              <TableCell>Descrição do serviço</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Data de execução</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Percentual</TableCell>
              <TableCell>Data da vistoria</TableCell>
              <TableCell>Motivo da devolução</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  {hasActiveFilters
                    ? "Nenhuma vistoria encontrada para os filtros informados."
                    : listStatus === InspectionStatus.AGUARDANDO_APROVACAO
                      ? "Nenhuma vistoria aguardando aprovação."
                      : listStatus === InspectionStatus.RESOLVIDA
                        ? "Nenhuma vistoria resolvida."
                        : "Nenhuma pendência de ajuste."}
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => {
                return (
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
                        ? new Date(inspection.serviceOrder.fimExecucao).toLocaleString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{inspection.locationDescription || "-"}</TableCell>
                    <TableCell>{inspection.team?.name || "-"}</TableCell>
                    <TableCell>
                      <StatusChip status={inspection.status} />
                    </TableCell>
                    <TableCell>
                      {inspection.scorePercent !== undefined &&
                      inspection.scorePercent !== null ? (
                        (() => {
                          const pendingData = getPendingAdjustmentsData(inspection);
                          const canOpenAdjustments = !!pendingData && pendingData.count > 0;
                          return (
                            <Tooltip
                              title={
                                canOpenAdjustments
                                  ? "Clique para ver itens pendentes de ajuste"
                                  : "Nenhum item pendente de ajuste"
                              }
                            >
                              <Box
                                component="button"
                                type="button"
                                onClick={(event) => {
                                  if (!canOpenAdjustments) return;
                                  handleOpenAdjustments(event, inspection.externalId);
                                }}
                                disabled={!canOpenAdjustments}
                                sx={{
                                  border: "none",
                                  bgcolor: "transparent",
                                  p: 0,
                                  m: 0,
                                  cursor: canOpenAdjustments ? "pointer" : "not-allowed",
                                  display: "inline-flex",
                                  opacity: canOpenAdjustments ? 1 : 0.6,
                                }}
                              >
                                <PercentBadge percent={inspection.scorePercent} size="small" />
                              </Box>
                            </Tooltip>
                          );
                        })()
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {inspection.finalizedAt
                        ? new Date(inspection.finalizedAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{inspection.resolutionRejectionReason || "-"}</TableCell>
                    <TableActionsCell>
                      <TableActionsGroup>
                        <TableViewButton
                          label={
                            pendingTab === "aprovacao"
                              ? "Ver retorno"
                              : user?.role === UserRole.SUPERVISOR
                                ? "Ver e resolver"
                                : "Ver"
                          }
                          onClick={() =>
                            navigate(`/inspections/${inspection.externalId}`, {
                              state: { from: detailFrom },
                            })
                          }
                        />
                      </TableActionsGroup>
                    </TableActionsCell>
                  </TableRow>
                );
              })
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

      <Popover
        open={isAdjustmentsPopoverOpen}
        anchorEl={adjustmentsAnchorEl}
        onClose={handleCloseAdjustments}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2, width: 360, maxWidth: "90vw" }}>
          <Typography variant="subtitle2" gutterBottom>
            Itens pendentes de ajuste
          </Typography>
          {selectedAdjustments && selectedAdjustmentsData ? (
            <>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                OS/Obra:{" "}
                {selectedAdjustments.serviceOrder?.osNumber ??
                  selectedAdjustments.investmentWork?.workName ??
                  selectedAdjustments.investmentWork?.name ??
                  "-"}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {selectedAdjustmentsData.preview.length > 0 ? (
                  selectedAdjustmentsData.preview.map((item) => (
                    <li key={item}>
                      <Typography variant="body2">{item}</Typography>
                    </li>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum item pendente de ajuste.
                  </Typography>
                )}
              </Box>
              {selectedAdjustmentsData.count > selectedAdjustmentsData.preview.length && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                  +{selectedAdjustmentsData.count - selectedAdjustmentsData.preview.length} itens na lista completa
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhuma informação disponível.
            </Typography>
          )}
        </Box>
      </Popover>
    </Box>
  );
};
