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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Tooltip,
} from "@mui/material";
import { FilterAltOff, Search } from "@mui/icons-material";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Contract, InspectionListItem, Team } from "@/domain";
import { InspectionStatus, ModuleType, UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useListQueryState } from "@/hooks/useListQueryState";
import { StatusChip } from "@/components/StatusChip";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { getInspectionModuleDisplayLabel, getModuleLabel } from "@/utils/moduleLabel";
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

const PENDINGS_LIST_QUERY = {
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

function teamMatchesContract(team: Team, contractId?: string): boolean {
  if (!contractId) return true;
  if (team.contractIds?.includes(contractId)) return true;
  return Boolean(team.contracts?.some((contract) => contract.id === contractId));
}

export const PendingsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const { values, setFilter, setValues, reset, page, limit, setPage, setLimit } =
    useListQueryState(PENDINGS_LIST_QUERY);
  const selectedModule = (values.module as ModuleType | "") || "";
  const selectedContractId = values.contractId;
  const selectedTeamId = values.teamId;
  const osNumber = values.osNumber;
  const service = values.service;
  const executionFrom = values.executionFrom;
  const executionTo = values.executionTo;
  const inspectionFrom = values.inspectionFrom;
  const inspectionTo = values.inspectionTo;
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

  const loadPendings = async () => {
    setLoading(true);
    const res = await appRepository.getInspections({
      status: InspectionStatus.PENDENTE_AJUSTE,
      module: selectedModule || undefined,
      contractId: selectedContractId || undefined,
      teamId: selectedTeamId || undefined,
      osNumber: osNumber.trim() || undefined,
      service: service.trim() || undefined,
      executionFrom: executionFrom || undefined,
      executionTo: executionTo || undefined,
      inspectionFrom: inspectionFrom || undefined,
      inspectionTo: inspectionTo || undefined,
      page,
      limit,
    });
    setInspections(res.data);
    setMeta(res.meta);
    setLoading(false);
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
          .filter((team) => team.active && teamMatchesContract(team, contractId))
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
  }, [
    page,
    limit,
    selectedModule,
    selectedContractId,
    selectedTeamId,
    osNumber,
    service,
    executionFrom,
    executionTo,
    inspectionFrom,
    inspectionTo,
  ]);

  const handleClearFilters = () => {
    reset();
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
      <PageHeader
        eyebrow="Controle de qualidade"
        title="Pendências de Ajuste"
        subtitle="Resolva os itens não conformes nas vistorias para concluir o ciclo de qualidade."
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
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Limpar filtros
        </Button>
      </Box>

      <SectionTable title="Pendências ativas">
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
                  {hasActiveFilters
                    ? "Nenhuma pendência encontrada para os filtros informados."
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
