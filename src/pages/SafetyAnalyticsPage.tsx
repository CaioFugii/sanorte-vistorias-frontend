import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Clear, Close } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, ModuleType, UserRole } from "@/domain";
import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";
import { appRepository } from "@/repositories/AppRepository";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { SafetyKpiStrip } from "@/pages/analytics/components/SafetyKpiStrip";
import { DateFilterHint } from "@/pages/analytics/components/DateFilterHint";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

function SafetyKpiStripSkeleton(): JSX.Element {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Grid key={`safety-kpi-skeleton-${index}`} item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
              <Skeleton variant="text" width="45%" height={18} />
              <Skeleton variant="rounded" width={120} height={34} sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function SafetyTabSkeleton(): JSX.Element {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="35%" height={28} />
      <Skeleton variant="rounded" width="100%" height={140} sx={{ mt: 2 }} />
      <Skeleton variant="rounded" width="100%" height={140} sx={{ mt: 2 }} />
    </Paper>
  );
}

function getInitialSafetyPeriod(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getInitialSafetyFilters(): { lowScoreThreshold: number; limit: number } {
  return {
    lowScoreThreshold: 70,
    limit: 15,
  };
}

type TeamRankingInspectionItem = {
  inspectionId: string;
  serviceOrderId: string;
  serviceOrderNumber: string;
  serviceOrderAddress: string | null;
  module: ModuleType;
  status: string;
  scorePercent: number;
  finishedAt: string | null;
  createdAt: string;
};

export function SafetyAnalyticsPage(): JSX.Element {
  const { hasAnyRole, user } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN, UserRole.SUPERVISOR]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const [globalPeriod, setGlobalPeriod] = useState(getInitialSafetyPeriod);
  const [filters, setFilters] = useState(getInitialSafetyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkSummary>
  > | null>(null);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkLowScoreCollaborators>
  > | null>(null);
  const [teamRanking, setTeamRanking] = useState<
    Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      safetyWorkPercent: number;
    }>
  >([]);
  const [rankingOrder, setRankingOrder] = useState<"asc" | "desc">("desc");
  const [rankingInspectionsOpen, setRankingInspectionsOpen] = useState(false);
  const [rankingInspectionsLoading, setRankingInspectionsLoading] = useState(false);
  const [rankingInspectionsError, setRankingInspectionsError] = useState<string | null>(null);
  const [rankingInspectionsItems, setRankingInspectionsItems] = useState<TeamRankingInspectionItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [rankingInspectionsMeta, setRankingInspectionsMeta] = useState({
    teamId: "",
    teamName: "",
    metric: "safetyWork" as DashboardTeamRankingMetric,
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

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
    if (contractsForFilters.length === 1) {
      setSelectedContractId((current) => current || contractsForFilters[0].id);
    }
  }, [contractsForFilters]);

  const loadData = async (
    nextFilters: typeof filters,
    period: typeof globalPeriod = globalPeriod,
    contractId: string = selectedContractId
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, result, rankingResult] = await Promise.all([
        appRepository.getDashboardSafetyWorkSummary({
          from: period.from,
          to: period.to,
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardSafetyWorkLowScoreCollaborators({
          ...nextFilters,
          from: period.from,
          to: period.to,
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardTeamRankingSafetyWork({
          from: period.from,
          to: period.to,
          contractId: contractId || undefined,
        }),
      ]);
      setSummary(summaryResult);
      setData(result);
      setTeamRanking(
        rankingResult.map((item) => ({
          teamId: item.teamId,
          teamName: item.teamName,
          averagePercent: item.averagePercent,
          inspectionsCount: item.inspectionsCount,
          safetyWorkPercent: item.safetyWorkPercent,
        }))
      );
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? "Você não tem permissão para acessar os gráficos de Segurança do Trabalho."
          : "Falha ao carregar os dados de Segurança do Trabalho."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccessAnalytics) return;
    void loadData(filters, globalPeriod, selectedContractId);
  }, [canAccessAnalytics, globalPeriod, selectedContractId]);

  if (!canAccessAnalytics) {
    return <Navigate to="/inspections/mine" replace />;
  }

  const lowScoreBarMax = Math.max(
    ...(data?.collaborators.map((item) => item.badScoreRatePercent) || [0]),
    100
  );
  const formatPercent = (value: number, digits = 2) =>
    `${value.toFixed(digits).replace(".", ",")}%`;
  const formatDateTime = (value: string | null): string => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR");
  };
  const sortedTeamRanking = useMemo(
    () =>
      [...teamRanking].sort((a, b) =>
        rankingOrder === "asc"
          ? a.safetyWorkPercent - b.safetyWorkPercent
          : b.safetyWorkPercent - a.safetyWorkPercent
      ),
    [teamRanking, rankingOrder]
  );

  const openRankingInspections = async (teamId: string, teamName: string, page = 1, limit = rankingInspectionsMeta.limit) => {
    setRankingInspectionsOpen(true);
    setRankingInspectionsLoading(true);
    setRankingInspectionsError(null);
    try {
      const response = await appRepository.getDashboardSafetyWorkTeamRankingInspections(teamId, {
        from: globalPeriod.from,
        to: globalPeriod.to,
        page,
        limit,
        contractId: selectedContractId || undefined,
      });
      setRankingInspectionsItems(response.inspections);
      setRankingInspectionsMeta({
        teamId: response.teamId,
        teamName: response.teamName || teamName,
        metric: response.metric,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
    } catch {
      setRankingInspectionsError("Falha ao carregar as vistorias da métrica selecionada.");
      setRankingInspectionsItems([]);
    } finally {
      setRankingInspectionsLoading(false);
    }
  };

  const handleClearFilters = () => {
    const nextPeriod = getInitialSafetyPeriod();
    const nextFilters = getInitialSafetyFilters();
    setSelectedContractId("");
    setGlobalPeriod(nextPeriod);
    setFilters(nextFilters);
  };
  const hasCoreSafetyData = Boolean(data);
  const isDateFiltered = Boolean(globalPeriod.from && globalPeriod.to);
  const dateFilterLabel = `${formatDateLabel(globalPeriod.from)} a ${formatDateLabel(globalPeriod.to)}`;

  return (
    <Box>
      <PageHeader
        eyebrow="Análises avançadas"
        title="Gráficos - Segurança do Trabalho"
        subtitle="Leituras visuais para apoio gerencial de Segurança do Trabalho."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Contrato</InputLabel>
              <Select
                value={selectedContractId}
                label="Contrato"
                onChange={(event) => setSelectedContractId(event.target.value)}
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
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Período inicial"
              value={globalPeriod.from}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: globalPeriod.to }}
              onChange={(event) => {
                const from = event.target.value;
                setGlobalPeriod((prev) => ({
                  from,
                  to: from > prev.to ? from : prev.to,
                }));
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Período final"
              value={globalPeriod.to}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: globalPeriod.from }}
              onChange={(event) => {
                const to = event.target.value;
                setGlobalPeriod((prev) => ({
                  to,
                  from: to < prev.from ? to : prev.from,
                }));
              }}
            />
          </Grid>
          <Grid item xs={12} md={2} display="flex" alignItems="stretch">
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {summary ? <SafetyKpiStrip summary={summary} /> : <SafetyKpiStripSkeleton />}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, nextTab) => setActiveTab(nextTab)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Colaboradores" />
          <Tab label="Ranking" />
        </Tabs>
      </Paper>

      {activeTab === 0 &&
        (hasCoreSafetyData ? (
          <Paper sx={{ p: 0, overflow: "hidden" }}>
            <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={800}>
                Segurança do Trabalho - Colaboradores com Nota Baixa
              </Typography>
              <DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />
            </Box>
            </Box>

            <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Limiar nota baixa"
                    value={filters.lowScoreThreshold}
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      if (!Number.isFinite(parsed)) return;
                      setFilters((prev) => ({
                        ...prev,
                        lowScoreThreshold: Math.max(0, Math.min(100, parsed)),
                      }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Limite"
                    value={filters.limit}
                    inputProps={{ min: 1, max: 100, step: 1 }}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      if (!Number.isFinite(parsed)) return;
                      setFilters((prev) => ({
                        ...prev,
                        limit: Math.max(1, Math.min(100, parsed)),
                      }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2} display="flex" alignItems="stretch">
                  <Button
                    variant="contained"
                    onClick={() => void loadData(filters, globalPeriod, selectedContractId)}
                    disabled={loading}
                    sx={{ width: "100%", fontWeight: 700 }}
                  >
                    Buscar
                  </Button>
                </Grid>
              </Grid>

              {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              {error && (
                <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
                  <Typography variant="body2" color="error.contrastText">
                    {error}
                  </Typography>
                </Paper>
              )}

              {!loading && !error && data && data.collaborators.length === 0 && (
                <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                  <Typography color="text.secondary">
                    Nenhum colaborador encontrado abaixo do limiar selecionado no período.
                  </Typography>
                </Paper>
              )}

              {!loading && !error && data && data.collaborators.length > 0 && (
                <Stack spacing={1.5}>
                  {data.collaborators.map((item) => (
                    <Paper key={item.collaboratorId} sx={{ p: 1.75, border: "1px solid #e2e8f0" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {item.collaboratorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.badScoresCount} notas ruins em {item.inspectionsCount} inspeções
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800} color="error.main">
                          {formatPercent(item.badScoreRatePercent)}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 1.25, height: 10, borderRadius: 999, bgcolor: "#e2e8f0", overflow: "hidden" }}>
                        <Box
                          sx={{
                            width: `${(item.badScoreRatePercent / lowScoreBarMax) * 100}%`,
                            bgcolor: "#d32f2f",
                            height: "100%",
                          }}
                        />
                      </Box>

                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Média
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {formatPercent(item.averagePercent)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Pior nota
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="error.main">
                            {formatPercent(item.worstScorePercent, 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Melhor nota
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {formatPercent(item.bestScorePercent, 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        ) : (
          <SafetyTabSkeleton />
        ))}

      {activeTab === 1 && (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Ranking por Equipes
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  Segurança do Trabalho
                </Typography>
              </Box>
              <DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />
            </Box>
          </Box>
          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            {teamRanking.length === 0 ? (
              <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                <Typography color="text.secondary">
                  Nenhum dado de ranking encontrado para o período selecionado.
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Equipe</TableCell>
                      <TableCell align="center">Média</TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active
                          direction={rankingOrder}
                          onClick={() =>
                            setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                          }
                        >
                          Seg. Trabalho
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Qtd Vistorias</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedTeamRanking.map((team) => (
                      <TableRow key={team.teamId} hover>
                        <TableCell>{team.teamName}</TableCell>
                        <TableCell align="center">
                          <PercentBadge percent={team.averagePercent} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver vistorias da métrica">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => void openRankingInspections(team.teamId, team.teamName)}
                            >
                              <PercentBadge percent={team.safetyWorkPercent} size="small" />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">{team.inspectionsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </Paper>
      )}

      <Dialog
        open={rankingInspectionsOpen}
        onClose={() => setRankingInspectionsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {rankingInspectionsMeta.teamName
            ? `Equipe: ${rankingInspectionsMeta.teamName} - Segurança do Trabalho`
            : "Vistorias da métrica"}
          <IconButton onClick={() => setRankingInspectionsOpen(false)} size="small" aria-label="Fechar">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {rankingInspectionsLoading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          {rankingInspectionsError && !rankingInspectionsLoading && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {rankingInspectionsError}
            </Typography>
          )}
          {!rankingInspectionsLoading && !rankingInspectionsError && (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>OS</TableCell>
                    <TableCell>Endereço</TableCell>
                    <TableCell>Módulo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Nota</TableCell>
                    <TableCell>Finalizada em</TableCell>
                    <TableCell>Criada em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankingInspectionsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          Nenhuma vistoria encontrada para os filtros selecionados.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankingInspectionsItems.map((inspection) => (
                      <TableRow key={inspection.inspectionId}>
                        <TableCell>{inspection.serviceOrderNumber || "-"}</TableCell>
                        <TableCell>{inspection.serviceOrderAddress || "-"}</TableCell>
                        <TableCell>{inspection.module}</TableCell>
                        <TableCell>{inspection.status}</TableCell>
                        <TableCell align="center">
                          <PercentBadge percent={inspection.scorePercent} size="small" />
                        </TableCell>
                        <TableCell>{formatDateTime(inspection.finishedAt)}</TableCell>
                        <TableCell>{formatDateTime(inspection.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {rankingInspectionsMeta.total > 0 && (
                <ListPagination
                  meta={rankingInspectionsMeta}
                  onPageChange={(page) =>
                    void openRankingInspections(
                      rankingInspectionsMeta.teamId,
                      rankingInspectionsMeta.teamName,
                      page
                    )
                  }
                  onRowsPerPageChange={(newLimit) => {
                    setRankingInspectionsMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                    void openRankingInspections(
                      rankingInspectionsMeta.teamId,
                      rankingInspectionsMeta.teamName,
                      1,
                      newLimit
                    );
                  }}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  disabled={rankingInspectionsLoading}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
