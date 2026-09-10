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
import { Navigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, ModuleType, Team, UserRole } from "@/domain";
import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";
import { appRepository } from "@/repositories/AppRepository";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";
import { SafetyKpiStrip } from "@/pages/analytics/components/SafetyKpiStrip";
import { DateFilterHint } from "@/pages/analytics/components/DateFilterHint";
import { SafetyFiscaisTab } from "@/pages/analytics/components/SafetyFiscaisTab";
import { SafetyInspectionsTab } from "@/pages/analytics/components/SafetyInspectionsTab";
import { QualityOverviewTab } from "@/pages/analytics/components/QualityOverviewTab";
import { QualityNonConformitiesTab } from "@/pages/analytics/components/QualityNonConformitiesTab";
import { QualityTeamsTab } from "@/pages/analytics/components/QualityTeamsTab";
import {
  InspectorsProductionData,
  QualityByServiceData,
  TeamPerformanceFilters,
} from "@/pages/analytics/components/models";

const MONTH_COLORS = ["#ef6c00", "#1976d2", "#fbc02d", "#2e7d32", "#8e24aa", "#00897b"];
const SAFETY_NC_TOP = 10;
const SAFETY_TAB_KEYS = [
  "ranking",
  "teams",
  "fiscais",
  "overview",
  "nonconformities",
  "vistorias",
] as const;

type SafetyTabKey = (typeof SAFETY_TAB_KEYS)[number];

const SAFETY_TAB_LABELS: Record<SafetyTabKey, string> = {
  ranking: "Ranking",
  teams: "Equipes",
  fiscais: "Fiscais",
  overview: "Visão Geral",
  nonconformities: "Não Conformidades",
  vistorias: "Vistorias",
};

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
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
            <Skeleton variant="text" width="45%" height={18} />
            <Skeleton variant="rounded" width={120} height={34} sx={{ mt: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
            <Skeleton variant="text" width="40%" height={18} />
            <Skeleton variant="rounded" width="100%" height={28} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width="100%" height={28} sx={{ mt: 1 }} />
          </Paper>
        </Grid>
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

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialSafetyPeriod(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getFixedSafetyOverviewRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - 3, 1);
  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date).toUpperCase();
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
  const initialTeamPerformanceFilters = useMemo<TeamPerformanceFilters>(
    () => ({
      teamIds: [],
    }),
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkSummary>
  > | null>(null);
  const [teamPerformanceFilters, setTeamPerformanceFilters] = useState(initialTeamPerformanceFilters);
  const [teamPerformanceByTeams, setTeamPerformanceByTeams] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkTeamPerformanceByTeams>
  > | null>(null);
  const [teamPerformanceLoading, setTeamPerformanceLoading] = useState(false);
  const [teamPerformanceError, setTeamPerformanceError] = useState<string | null>(null);
  const [teamRanking, setTeamRanking] = useState<
    Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      safetyWorkPercent: number;
    }>
  >([]);
  const [inspectorsProduction, setInspectorsProduction] = useState<InspectorsProductionData | null>(null);
  const [qualityByService, setQualityByService] = useState<QualityByServiceData | null>(null);
  const [nonConformitiesByChecklist, setNonConformitiesByChecklist] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkNonConformitiesByChecklist>
  > | null>(null);
  const [nonConformitiesByTeam, setNonConformitiesByTeam] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkNonConformitiesByTeam>
  > | null>(null);
  const [nonConformitiesTeamId, setNonConformitiesTeamId] = useState("");
  const [nonConformitiesByTeamLoading, setNonConformitiesByTeamLoading] = useState(false);
  const [nonConformitiesByTeamError, setNonConformitiesByTeamError] = useState<string | null>(null);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [rankingOrder, setRankingOrder] = useState<"asc" | "desc">("desc");
  const [rankingInspectionsOpen, setRankingInspectionsOpen] = useState(false);
  const [rankingInspectionsLoading, setRankingInspectionsLoading] = useState(false);
  const [rankingInspectionsError, setRankingInspectionsError] = useState<string | null>(null);
  const [rankingInspectionsItems, setRankingInspectionsItems] = useState<TeamRankingInspectionItem[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const canSeeInspectionsTab = user?.role === UserRole.ADMIN || user?.role === UserRole.GESTOR;
  const visibleTabs = useMemo(
    () => SAFETY_TAB_KEYS.filter((key) => key !== "vistorias" || canSeeInspectionsTab),
    [canSeeInspectionsTab]
  );
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    const index = visibleTabs.indexOf(tabParam as SafetyTabKey);
    return index >= 0 ? index : 0;
  }, [searchParams, visibleTabs]);
  const activeTabKey = visibleTabs[activeTab] ?? "ranking";
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
    period: typeof globalPeriod = globalPeriod,
    contractId: string = selectedContractId
  ) => {
    setLoading(true);
    setError(null);
    try {
      const overviewRange = getFixedSafetyOverviewRange();
      const [summaryResult, rankingResult, inspectorsResult, overviewResult, nonConformitiesResult] =
        await Promise.all([
          appRepository.getDashboardSafetyWorkSummary({
            from: period.from,
            to: period.to,
            contractId: contractId || undefined,
          }),
          appRepository.getDashboardTeamRankingSafetyWork({
            from: period.from,
            to: period.to,
            contractId: contractId || undefined,
          }),
          appRepository.getDashboardSafetyWorkInspectorsProduction({
            from: period.from,
            to: period.to,
            contractId: contractId || undefined,
          }),
          appRepository.getDashboardSafetyWorkQualityByService({
            from: overviewRange.from,
            to: overviewRange.to,
            contractId: contractId || undefined,
          }),
          appRepository.getDashboardSafetyWorkNonConformitiesByChecklist({
            from: period.from,
            to: period.to,
            contractId: contractId || undefined,
            limitPerChecklist: SAFETY_NC_TOP,
          }),
        ]);
      setSummary(summaryResult);
      setInspectorsProduction(inspectorsResult);
      setQualityByService(overviewResult);
      setNonConformitiesByChecklist(nonConformitiesResult);
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
    void loadData(globalPeriod, selectedContractId);
  }, [canAccessAnalytics, globalPeriod, selectedContractId]);

  useEffect(() => {
    if (!canAccessAnalytics) return;
    let cancelled = false;
    const loadTeams = async () => {
      try {
        const contractId = selectedContractId || undefined;
        const pageSize = 100;
        const collected: Team[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const result = await appRepository.getTeams({
            page,
            limit: pageSize,
            contractId,
          });
          collected.push(...result.data);
          hasNext = Boolean(result.meta?.hasNext);
          page += 1;
          if (page > 50) {
            break;
          }
        }

        if (!cancelled) {
          const activeTeams = collected
            .filter((team) => team.active)
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
          setTeamOptions(activeTeams);
          setNonConformitiesTeamId((current) =>
            current && activeTeams.some((team) => team.id === current) ? current : ""
          );
        }
      } catch {
        if (!cancelled) setTeamOptions([]);
      }
    };
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [canAccessAnalytics, selectedContractId]);

  const loadTeamPerformanceData = async (filters: TeamPerformanceFilters): Promise<void> => {
    if (filters.teamIds.length === 0) {
      setTeamPerformanceByTeams(null);
      setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
      return;
    }

    setTeamPerformanceLoading(true);
    setTeamPerformanceError(null);

    try {
      const result = await appRepository.getDashboardSafetyWorkTeamPerformanceByTeams({
        from: globalPeriod.from,
        to: globalPeriod.to,
        teamIds: filters.teamIds,
        contractId: selectedContractId || undefined,
      });
      setTeamPerformanceByTeams(result);
    } catch {
      setTeamPerformanceError("Falha ao carregar o gráfico de desempenho por equipes.");
    } finally {
      setTeamPerformanceLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccessAnalytics) return;
    setTeamPerformanceFilters({ ...initialTeamPerformanceFilters, teamIds: [] });
    setTeamPerformanceByTeams(null);
    setTeamPerformanceError(
      teamOptions.length === 0
        ? "Nenhuma equipe ativa encontrada para pesquisa."
        : "Selecione ao menos uma equipe para buscar."
    );
  }, [canAccessAnalytics, initialTeamPerformanceFilters, selectedContractId, globalPeriod, teamOptions.length]);

  useEffect(() => {
    if (!canAccessAnalytics) return;
    if (!nonConformitiesTeamId) {
      setNonConformitiesByTeam(null);
      setNonConformitiesByTeamError(null);
      return;
    }

    let cancelled = false;
    const loadNonConformitiesByTeam = async () => {
      setNonConformitiesByTeamLoading(true);
      setNonConformitiesByTeamError(null);
      try {
        const response = await appRepository.getDashboardSafetyWorkNonConformitiesByTeam({
          from: globalPeriod.from,
          to: globalPeriod.to,
          teamId: nonConformitiesTeamId,
          contractId: selectedContractId || undefined,
          limit: SAFETY_NC_TOP,
        });
        if (!cancelled) setNonConformitiesByTeam(response);
      } catch {
        if (!cancelled) {
          setNonConformitiesByTeam(null);
          setNonConformitiesByTeamError("Falha ao carregar o top de não conformidades da equipe.");
        }
      } finally {
        if (!cancelled) setNonConformitiesByTeamLoading(false);
      }
    };

    void loadNonConformitiesByTeam();
    return () => {
      cancelled = true;
    };
  }, [canAccessAnalytics, globalPeriod, nonConformitiesTeamId, selectedContractId]);

  const sortedTeamRanking = useMemo(
    () =>
      [...teamRanking].sort((a, b) =>
        rankingOrder === "asc"
          ? a.safetyWorkPercent - b.safetyWorkPercent
          : b.safetyWorkPercent - a.safetyWorkPercent
      ),
    [teamRanking, rankingOrder]
  );

  const overviewRange = getFixedSafetyOverviewRange();
  const overviewRangeLabel = `${formatDateLabel(overviewRange.from)} a ${formatDateLabel(overviewRange.to)}`;
  const chartMonths = useMemo(
    () =>
      (qualityByService?.period || []).map((month, index) => ({
        key: month,
        label: formatMonthLabel(month),
        color: MONTH_COLORS[index % MONTH_COLORS.length],
      })),
    [qualityByService]
  );
  const qualityChartMax = useMemo(
    () =>
      Math.max(
        ...(qualityByService?.services.flatMap((service) => service.series.map((point) => point.qualityPercent)) || [0]),
        100
      ),
    [qualityByService]
  );

  if (!canAccessAnalytics) {
    return <Navigate to="/inspections/mine" replace />;
  }

  const teamPerformanceRows = useMemo(() => {
    if (!teamPerformanceByTeams) return [];
    return [...teamPerformanceByTeams.teams].sort((a, b) =>
      a.teamName.localeCompare(b.teamName, "pt-BR", { sensitivity: "base" })
    );
  }, [teamPerformanceByTeams]);

  const teamPerformanceBarMax = useMemo(
    () => Math.max(...(teamPerformanceRows.map((row) => row.averagePercent) || [0]), 100),
    [teamPerformanceRows]
  );

  const formatDateTime = (value: string | null): string => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR");
  };

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
    setSelectedContractId("");
    setGlobalPeriod(nextPeriod);
    setNonConformitiesTeamId("");
    setTeamPerformanceFilters({ teamIds: [] });
    setTeamPerformanceByTeams(null);
  };
  const handleTabChange = (_: unknown, nextTab: number) => {
    const key = visibleTabs[nextTab];
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (!key || key === "ranking") {
          next.delete("tab");
        } else {
          next.set("tab", key);
        }
        return next;
      },
      { replace: true }
    );
  };
  const isDateFiltered = Boolean(globalPeriod.from && globalPeriod.to);
  const dateFilterLabel = `${formatDateLabel(globalPeriod.from)} a ${formatDateLabel(globalPeriod.to)}`;

  return (
    <Box>
      <PageHeader
        eyebrow="Análises avançadas"
        title="Dados - Segurança do Trabalho"
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
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((key) => (
            <Tab key={key} label={SAFETY_TAB_LABELS[key]} />
          ))}
        </Tabs>
      </Paper>

      {activeTabKey === "vistorias" && (
        <SafetyInspectionsTab
          contractId={selectedContractId || undefined}
          dateFilterHint={
            <DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />
          }
        />
      )}

      {activeTabKey === "teams" && (
        <QualityTeamsTab
          teamOptions={teamOptions.map((team) => ({ id: team.id, name: team.name }))}
          teamPerformanceFilters={teamPerformanceFilters}
          setTeamPerformanceFilters={setTeamPerformanceFilters}
          globalPeriod={globalPeriod}
          onSearchTeamPerformance={() => void loadTeamPerformanceData(teamPerformanceFilters)}
          teamPerformanceLoading={teamPerformanceLoading}
          teamPerformanceError={teamPerformanceError}
          teamPerformanceByTeams={teamPerformanceByTeams}
          teamPerformanceRows={teamPerformanceRows}
          teamPerformanceBarMax={teamPerformanceBarMax}
          clearTeamSelection={() => {
            setTeamPerformanceFilters((prev) => ({ ...prev, teamIds: [] }));
            setTeamPerformanceByTeams(null);
            setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
          }}
          dateFilterHint={<DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />}
        />
      )}

      {activeTabKey === "fiscais" && (
        <SafetyFiscaisTab
          data={inspectorsProduction}
          loading={loading}
          error={error}
          dateFilterHint={<DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />}
        />
      )}

      {activeTabKey === "overview" &&
        (qualityByService ? (
          qualityByService.services.length === 0 ? (
            <Paper sx={{ p: 2.5 }}>
              <Typography color="text.secondary">
                Nenhuma vistoria de Segurança do Trabalho encontrada no período da evolução mensal.
              </Typography>
            </Paper>
          ) : (
            <QualityOverviewTab
              title="Desempenho Mensal de Segurança do Trabalho"
              qualityByService={qualityByService}
              chartMonths={chartMonths}
              qualityChartMax={qualityChartMax}
              growthTitle="CRESCIMENTO (MÊS ANTERIOR VS MÊS VIGENTE)"
              dateFilterHint={
                <DateFilterHint
                  label={overviewRangeLabel}
                  isFiltered
                  textOverride={`Período fixo: ${overviewRangeLabel}`}
                />
              }
            />
          )
        ) : (
          <SafetyTabSkeleton />
        ))}

      {activeTabKey === "nonconformities" && (
        <QualityNonConformitiesTab
          checklistTitle="Perguntas com mais não conformidades por checklist (Top 10)"
          teamTitle="Não conformidades da equipe selecionada (Top 10)"
          topLimit={SAFETY_NC_TOP}
          byChecklist={nonConformitiesByChecklist}
          byTeam={nonConformitiesByTeam}
          teamOptions={teamOptions.map((team) => ({ id: team.id, name: team.name }))}
          selectedTeamId={nonConformitiesTeamId}
          onSelectedTeamIdChange={setNonConformitiesTeamId}
          byTeamLoading={nonConformitiesByTeamLoading}
          byTeamError={nonConformitiesByTeamError}
          dateFilterHint={<DateFilterHint label={dateFilterLabel} isFiltered={isDateFiltered} />}
        />
      )}

      {activeTabKey === "ranking" && (
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
