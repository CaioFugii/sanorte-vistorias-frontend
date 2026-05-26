import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, Team, UserRole, ModuleType } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";
import { QualityKpiStrip } from "@/pages/analytics/components/QualityKpiStrip";
import { QualityOverviewTab } from "@/pages/analytics/components/QualityOverviewTab";
import { QualityRankingTab } from "@/pages/analytics/components/QualityRankingTab";
import { QualityServicesTab } from "@/pages/analytics/components/QualityServicesTab";
import { QualityTeamsTab } from "@/pages/analytics/components/QualityTeamsTab";
import { QualityNonConformitiesTab } from "@/pages/analytics/components/QualityNonConformitiesTab";
import { TeamRankingInspectionItem, TeamRankingOrderBy } from "@/pages/analytics/components/models";

type QualityByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardQualityByService>>;
type CurrentMonthByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardCurrentMonthByService>>;
type TeamPerformanceByTeamsResponse = Awaited<ReturnType<typeof appRepository.getDashboardTeamPerformanceByTeams>>;
type QualitySummaryFromApi = Awaited<ReturnType<typeof appRepository.getDashboardQualitySummary>>;
type NonConformitiesByChecklistResponse = Awaited<
  ReturnType<typeof appRepository.getDashboardNonConformitiesByChecklist>
>;
type NonConformitiesByTeamResponse = Awaited<ReturnType<typeof appRepository.getDashboardNonConformitiesByTeam>>;
const MONTH_COLORS = ["#ef6c00", "#1976d2", "#fbc02d", "#2e7d32", "#8e24aa", "#00897b"];
const QUALITY_MODULES: ModuleType[] = [
  ModuleType.CAMPO,
  ModuleType.REMOTO,
  ModuleType.POS_OBRA,
  ModuleType.OBRAS_INVESTIMENTO,
];

function getDefaultQualityRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - 3, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getInitialGlobalPeriod(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getFixedQualityRange(): { from: string; to: string } {
  return getDefaultQualityRange();
}

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date).toUpperCase();
}

function formatMonthYearLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
    .format(date)
    .replace(/^./, (char) => char.toUpperCase());
}

function teamMatchesContract(team: Team, contractId?: string): boolean {
  if (!contractId) return true;
  if (team.contractIds?.includes(contractId)) return true;
  return Boolean(team.contracts?.some((contract) => contract.id === contractId));
}

function mergeQualityByServiceResponses(
  responses: QualityByServiceResponse[]
): QualityByServiceResponse {
  const period = Array.from(new Set(responses.flatMap((response) => response.period))).sort();
  const servicesMap = new Map<
    string,
    {
      serviceLabel: string;
      byMonth: Map<string, { weightedQualitySum: number; inspectionsCount: number }>;
    }
  >();

  for (const response of responses) {
    for (const service of response.services) {
      const current = servicesMap.get(service.serviceKey) ?? {
        serviceLabel: service.serviceLabel,
        byMonth: new Map<string, { weightedQualitySum: number; inspectionsCount: number }>(),
      };
      for (const point of service.series) {
        const month = current.byMonth.get(point.month) ?? {
          weightedQualitySum: 0,
          inspectionsCount: 0,
        };
        month.weightedQualitySum += point.qualityPercent * point.inspectionsCount;
        month.inspectionsCount += point.inspectionsCount;
        current.byMonth.set(point.month, month);
      }
      servicesMap.set(service.serviceKey, current);
    }
  }

  const services = Array.from(servicesMap.entries())
    .map(([serviceKey, service]) => {
      const series = period.map((month) => {
        const monthData = service.byMonth.get(month);
        const inspectionsCount = monthData?.inspectionsCount ?? 0;
        return {
          month,
          inspectionsCount,
          qualityPercent:
            inspectionsCount > 0
              ? Number((monthData!.weightedQualitySum / inspectionsCount).toFixed(2))
              : 0,
        };
      });
      const nonZeroSeries = series.filter((item) => item.inspectionsCount > 0);
      const growth =
        nonZeroSeries.length >= 2
          ? {
              fromMonth: nonZeroSeries[nonZeroSeries.length - 2].month,
              toMonth: nonZeroSeries[nonZeroSeries.length - 1].month,
              growthPercent: Number(
                (
                  nonZeroSeries[nonZeroSeries.length - 1].qualityPercent -
                  nonZeroSeries[nonZeroSeries.length - 2].qualityPercent
                ).toFixed(2)
              ),
              deltaPoints: Number(
                (
                  nonZeroSeries[nonZeroSeries.length - 1].qualityPercent -
                  nonZeroSeries[nonZeroSeries.length - 2].qualityPercent
                ).toFixed(2)
              ),
            }
          : null;
      return {
        serviceKey,
        serviceLabel: service.serviceLabel,
        series,
        growth,
      };
    })
    .sort((a, b) => a.serviceLabel.localeCompare(b.serviceLabel));

  return { period, services };
}

export function AnalyticsPage(): JSX.Element {
  const { hasAnyRole, user } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const [globalPeriod, setGlobalPeriod] = useState(getInitialGlobalPeriod);
  const initialTeamPerformanceFilters = useMemo(() => {
    return {
      teamIds: [] as string[],
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityByService, setQualityByService] = useState<QualityByServiceResponse | null>(null);
  const [currentMonthByService, setCurrentMonthByService] = useState<CurrentMonthByServiceResponse | null>(null);
  const [qualitySummaryFromApi, setQualitySummaryFromApi] = useState<QualitySummaryFromApi | null>(null);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [teamPerformanceFilters, setTeamPerformanceFilters] = useState(initialTeamPerformanceFilters);
  const [teamPerformanceByTeams, setTeamPerformanceByTeams] = useState<TeamPerformanceByTeamsResponse | null>(null);
  const [teamPerformanceLoading, setTeamPerformanceLoading] = useState(false);
  const [teamPerformanceError, setTeamPerformanceError] = useState<string | null>(null);
  const [nonConformitiesByChecklist, setNonConformitiesByChecklist] =
    useState<NonConformitiesByChecklistResponse | null>(null);
  const [nonConformitiesByTeam, setNonConformitiesByTeam] = useState<NonConformitiesByTeamResponse | null>(null);
  const [nonConformitiesTeamId, setNonConformitiesTeamId] = useState("");
  const [nonConformitiesByTeamLoading, setNonConformitiesByTeamLoading] = useState(false);
  const [nonConformitiesByTeamError, setNonConformitiesByTeamError] = useState<string | null>(null);
  const [teamRankingQuality, setTeamRankingQuality] = useState<
    Array<{
      teamId: string;
      teamName: string;
      averagePercent: number;
      inspectionsCount: number;
      pendingCount: number;
      fieldPercent: number;
      remotePercent: number;
      postWorkPercent: number;
      investmentWorksPercent: number;
    }>
  >([]);
  const [rankingOrderBy, setRankingOrderBy] = useState<TeamRankingOrderBy>("average");
  const [rankingOrder, setRankingOrder] = useState<"asc" | "desc">("desc");
  const [rankingInspectionsOpen, setRankingInspectionsOpen] = useState(false);
  const [rankingInspectionsLoading, setRankingInspectionsLoading] = useState(false);
  const [rankingInspectionsError, setRankingInspectionsError] = useState<string | null>(null);
  const [rankingInspectionsItems, setRankingInspectionsItems] = useState<TeamRankingInspectionItem[]>([]);
  const [rankingInspectionsMeta, setRankingInspectionsMeta] = useState({
    teamId: "",
    teamName: "",
    metric: "field" as DashboardTeamRankingMetric,
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [activeTab, setActiveTab] = useState(0);

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

  const loadAnalyticsData = async (contractId?: string, period: { from: string; to: string } = globalPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const qualityRange = getFixedQualityRange();
      const [qualityResponses, currentResponse, summaryResponse, nonConformitiesChecklistResponse] = await Promise.all([
        Promise.all(
          QUALITY_MODULES.map((module) =>
            appRepository.getDashboardQualityByService({
              ...qualityRange,
              contractId: contractId || undefined,
              module,
            })
          )
        ),
        appRepository.getDashboardCurrentMonthByService({
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardQualitySummary({
          from: period.from,
          to: period.to,
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardNonConformitiesByChecklist({
          from: period.from,
          to: period.to,
          contractId: contractId || undefined,
          limitPerChecklist: 3,
        }),
      ]);
      const teamRanking = await appRepository.getDashboardTeamRanking({
        from: period.from,
        to: period.to,
        contractId: contractId || undefined,
      });
      const qualityRes =
        qualityResponses.length > 1
          ? mergeQualityByServiceResponses(qualityResponses)
          : qualityResponses[0];
      setQualityByService(qualityRes ?? null);
      setCurrentMonthByService(currentResponse ?? null);
      setQualitySummaryFromApi(summaryResponse);
      setNonConformitiesByChecklist(nonConformitiesChecklistResponse ?? null);
      setTeamRankingQuality(
        teamRanking.map((item) => ({
          teamId: item.teamId,
          teamName: item.teamName,
          averagePercent: item.averagePercent,
          inspectionsCount: item.inspectionsCount,
          pendingCount: item.pendingCount,
          fieldPercent: item.fieldPercent,
          remotePercent: item.remotePercent,
          postWorkPercent: item.postWorkPercent,
          investmentWorksPercent: item.investmentWorksPercent,
        }))
      );
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message =
        status === 403
          ? "Você não tem permissão para acessar os gráficos."
          : "Falha ao carregar os dados de gráficos.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamsOptions = async (): Promise<Team[]> => {
    try {
      const result = await appRepository.getTeams({
        page: 1,
        limit: 100,
      });
      const activeTeams = result.data.filter(
        (team) => team.active && teamMatchesContract(team, selectedContractId || undefined)
      );
      setTeamOptions(activeTeams);
      return activeTeams;
    } catch {
      setTeamOptions([]);
      return [];
    }
  };

  const loadTeamPerformanceData = async (filters: typeof teamPerformanceFilters): Promise<void> => {
    if (filters.teamIds.length === 0) {
      setTeamPerformanceByTeams(null);
      setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
      return;
    }

    setTeamPerformanceLoading(true);
    setTeamPerformanceError(null);

    const payload = {
      from: globalPeriod.from,
      to: globalPeriod.to,
      teamIds: filters.teamIds,
      contractId: selectedContractId || undefined,
    };

    try {
      const result = await appRepository.getDashboardTeamPerformanceByTeams(payload);
      setTeamPerformanceByTeams(result);
    } catch {
      setTeamPerformanceError("Falha ao carregar o gráfico de desempenho por equipes.");
    } finally {
      setTeamPerformanceLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccessAnalytics) return;
    void loadAnalyticsData(selectedContractId || undefined, globalPeriod);
  }, [canAccessAnalytics, globalPeriod, selectedContractId]);

  useEffect(() => {
    if (!canAccessAnalytics) return;

    const bootstrapTeamPerformance = async () => {
      const teams = await loadTeamsOptions();
      const nextFilters = {
        ...initialTeamPerformanceFilters,
        teamIds: [],
      };
      setTeamPerformanceFilters(nextFilters);
      setTeamPerformanceByTeams(null);
      if (teams.length === 0) {
        setTeamPerformanceError("Nenhuma equipe ativa encontrada para pesquisa.");
      } else {
        setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
      }
    };

    void bootstrapTeamPerformance();
  }, [canAccessAnalytics, initialTeamPerformanceFilters, selectedContractId, globalPeriod]);

  useEffect(() => {
    if (!canAccessAnalytics) return;
    if (!nonConformitiesTeamId) {
      setNonConformitiesByTeam(null);
      setNonConformitiesByTeamError(null);
      return;
    }

    const loadNonConformitiesByTeam = async () => {
      setNonConformitiesByTeamLoading(true);
      setNonConformitiesByTeamError(null);
      try {
        const response = await appRepository.getDashboardNonConformitiesByTeam({
          from: globalPeriod.from,
          to: globalPeriod.to,
          teamId: nonConformitiesTeamId,
          contractId: selectedContractId || undefined,
          limit: 5,
        });
        setNonConformitiesByTeam(response);
      } catch {
        setNonConformitiesByTeam(null);
        setNonConformitiesByTeamError("Falha ao carregar o top de não conformidades da equipe.");
      } finally {
        setNonConformitiesByTeamLoading(false);
      }
    };

    void loadNonConformitiesByTeam();
  }, [canAccessAnalytics, globalPeriod, nonConformitiesTeamId, selectedContractId]);

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

  const currentMonthLabel = useMemo(() => {
    if (!currentMonthByService?.month) return "";
    return formatMonthYearLabel(currentMonthByService.month);
  }, [currentMonthByService]);

  const growthTitle = "CRESCIMENTO (MÊS ANTERIOR VS MÊS VIGENTE)";

  const teamPerformanceRows = useMemo(() => {
    if (!teamPerformanceByTeams) return [];
    return [...teamPerformanceByTeams.teams].sort((a, b) => b.averagePercent - a.averagePercent);
  }, [teamPerformanceByTeams]);

  const teamPerformanceBarMax = useMemo(
    () => Math.max(...(teamPerformanceRows.map((row) => row.averagePercent) || [0]), 100),
    [teamPerformanceRows]
  );

  const handleSearchTeamPerformance = () => {
    void loadTeamPerformanceData(teamPerformanceFilters);
  };
  const sortedTeamRankingQuality = useMemo(() => {
    return [...teamRankingQuality].sort((a, b) => {
      const aValue =
        rankingOrderBy === "average"
          ? a.averagePercent
          : rankingOrderBy === "field"
          ? a.fieldPercent
          : rankingOrderBy === "remote"
            ? a.remotePercent
            : rankingOrderBy === "postWork"
              ? a.postWorkPercent
              : a.investmentWorksPercent;
      const bValue =
        rankingOrderBy === "average"
          ? b.averagePercent
          : rankingOrderBy === "field"
          ? b.fieldPercent
          : rankingOrderBy === "remote"
            ? b.remotePercent
            : rankingOrderBy === "postWork"
              ? b.postWorkPercent
              : b.investmentWorksPercent;
      return rankingOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [teamRankingQuality, rankingOrder, rankingOrderBy]);
  const formatDateTime = (value: string | null): string => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR");
  };
  const openRankingInspections = async (
    teamId: string,
    teamName: string,
    metric: DashboardTeamRankingMetric,
    page = 1,
    limit = rankingInspectionsMeta.limit
  ) => {
    setRankingInspectionsOpen(true);
    setRankingInspectionsLoading(true);
    setRankingInspectionsError(null);
    try {
      const response = await appRepository.getDashboardTeamRankingInspections(teamId, {
        from: globalPeriod.from,
        to: globalPeriod.to,
        metric,
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

  if (!canAccessAnalytics) {
    return <Navigate to="/inspections/mine" replace />;
  }

  const handleClearFilters = () => {
    setSelectedContractId("");
    setGlobalPeriod(getInitialGlobalPeriod());
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Análises avançadas"
        title="Central de Gráficos"
        subtitle="Leituras visuais para apoio gerencial. Layout focado em desktop para validação executiva."
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

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "error.light" }}>
          <Typography color="error.contrastText">{error}</Typography>
        </Paper>
      )}

      {!loading && !error && qualityByService && currentMonthByService && (
        <Box sx={{ minWidth: 1180 }}>
          {qualitySummaryFromApi && (
            <QualityKpiStrip qualitySummary={qualitySummaryFromApi} />
          )}

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, nextTab) => setActiveTab(nextTab)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Visão Geral" />
              <Tab label="Serviços" />
              <Tab label="Equipes" />
              <Tab label="Ranking" />
              <Tab label="Não conformidades" />
            </Tabs>
          </Paper>

          {activeTab === 0 && (
            <QualityOverviewTab
              qualityByService={qualityByService}
              chartMonths={chartMonths}
              qualityChartMax={qualityChartMax}
              growthTitle={growthTitle}
            />
          )}

          {activeTab === 1 && (
            <QualityServicesTab
              qualityByService={qualityByService}
              currentMonthByService={currentMonthByService}
              currentMonthLabel={currentMonthLabel}
            />
          )}

          {activeTab === 2 && (
            <QualityTeamsTab
              teamOptions={teamOptions.map((team) => ({ id: team.id, name: team.name }))}
              teamPerformanceFilters={teamPerformanceFilters}
              setTeamPerformanceFilters={setTeamPerformanceFilters}
              globalPeriod={globalPeriod}
              onSearchTeamPerformance={handleSearchTeamPerformance}
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
            />
          )}

          {activeTab === 3 && (
            <QualityRankingTab
              teamRankingQuality={teamRankingQuality}
              rankingOrderBy={rankingOrderBy}
              rankingOrder={rankingOrder}
              setRankingOrderBy={setRankingOrderBy}
              setRankingOrder={setRankingOrder}
              sortedTeamRankingQuality={sortedTeamRankingQuality}
              rankingInspectionsOpen={rankingInspectionsOpen}
              setRankingInspectionsOpen={setRankingInspectionsOpen}
              rankingInspectionsLoading={rankingInspectionsLoading}
              rankingInspectionsError={rankingInspectionsError}
              rankingInspectionsItems={rankingInspectionsItems}
              rankingInspectionsMeta={rankingInspectionsMeta}
              openRankingInspections={openRankingInspections}
              formatDateTime={formatDateTime}
              setRankingInspectionsMeta={setRankingInspectionsMeta}
            />
          )}

          {activeTab === 4 && (
            <QualityNonConformitiesTab
              byChecklist={nonConformitiesByChecklist}
              byTeam={nonConformitiesByTeam}
              teamOptions={teamOptions.map((team) => ({ id: team.id, name: team.name }))}
              selectedTeamId={nonConformitiesTeamId}
              onSelectedTeamIdChange={setNonConformitiesTeamId}
              byTeamLoading={nonConformitiesByTeamLoading}
              byTeamError={nonConformitiesByTeamError}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
