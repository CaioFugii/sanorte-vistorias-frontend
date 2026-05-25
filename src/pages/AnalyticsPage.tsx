import {
  Autocomplete,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, Team, UserRole, ModuleType } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";
import { PercentBadge } from "@/components/PercentBadge";
import { ListPagination } from "@/components/ListPagination";

type QualityByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardQualityByService>>;
type CurrentMonthByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardCurrentMonthByService>>;
type TeamPerformanceByTeamsResponse = Awaited<ReturnType<typeof appRepository.getDashboardTeamPerformanceByTeams>>;
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

const MONTH_COLORS = ["#ef6c00", "#1976d2", "#fbc02d", "#2e7d32", "#8e24aa", "#00897b"];
const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};
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

function getCurrentMonthRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
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

function buildFakeTeamPerformanceByTeams(
  params: {
    from: string;
    to: string;
    teamIds: string[];
  },
  teamOptions: Team[]
): TeamPerformanceByTeamsResponse {
  const selectedTeams =
    params.teamIds.length > 0
      ? teamOptions.filter((team) => params.teamIds.includes(team.id))
      : teamOptions.slice(0, 3);

  const baseTeams =
    selectedTeams.length > 0
      ? selectedTeams
      : [
          { id: "fake-team-1", name: "Equipe Alpha", active: true },
          { id: "fake-team-2", name: "Equipe Beta", active: true },
          { id: "fake-team-3", name: "Equipe Gama", active: true },
        ];

  const teams = baseTeams.map((team, teamIndex) => {
    const collaborators = Array.from({ length: 4 }, (_, collaboratorIndex) => {
      const qualityPercent = Math.max(52, 88 - teamIndex * 4 - collaboratorIndex * 3.4);
      const inspectionsCount = 8 + teamIndex * 3 + collaboratorIndex * 4;
      return {
        collaboratorId: `${team.id}-fake-c-${collaboratorIndex + 1}`,
        collaboratorName: `Colaborador ${collaboratorIndex + 1}`,
        qualityPercent: Number(qualityPercent.toFixed(1)),
        inspectionsCount,
      };
    });

    const averagePercent =
      collaborators.reduce((acc, collaborator) => acc + collaborator.qualityPercent, 0) / collaborators.length;
    const inspectionsCount = collaborators.reduce((acc, collaborator) => acc + collaborator.inspectionsCount, 0);
    const pendingAdjustmentsCount = Math.max(0, Math.round((100 - averagePercent) / 8));

    return {
      teamId: team.id,
      teamName: team.name,
      averagePercent: Number(averagePercent.toFixed(1)),
      inspectionsCount,
      pendingAdjustmentsCount,
      collaborators,
    };
  });

  const averagePercent = teams.reduce((acc, team) => acc + team.averagePercent, 0) / Math.max(teams.length, 1);

  return {
    from: params.from,
    to: params.to,
    teamIds: baseTeams.map((team) => team.id),
    summary: {
      averagePercent: Number(averagePercent.toFixed(1)),
      previousAveragePercent: Number((averagePercent - 1.7).toFixed(1)),
      inspectionsCount: teams.reduce((acc, team) => acc + team.inspectionsCount, 0),
      pendingAdjustmentsCount: teams.reduce((acc, team) => acc + team.pendingAdjustmentsCount, 0),
    },
    teams,
  };
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

function mergeCurrentMonthByServiceResponses(
  responses: CurrentMonthByServiceResponse[]
): CurrentMonthByServiceResponse {
  const serviceMap = new Map<
    string,
    {
      serviceLabel: string;
      weightedQualitySum: number;
      inspectionsCount: number;
    }
  >();

  for (const response of responses) {
    for (const service of response.services) {
      const current = serviceMap.get(service.serviceKey) ?? {
        serviceLabel: service.serviceLabel,
        weightedQualitySum: 0,
        inspectionsCount: 0,
      };
      current.weightedQualitySum += service.qualityPercent * service.inspectionsCount;
      current.inspectionsCount += service.inspectionsCount;
      serviceMap.set(service.serviceKey, current);
    }
  }

  const services = Array.from(serviceMap.entries()).map(([serviceKey, service]) => ({
    serviceKey,
    serviceLabel: service.serviceLabel,
    inspectionsCount: service.inspectionsCount,
    qualityPercent:
      service.inspectionsCount > 0
        ? Number((service.weightedQualitySum / service.inspectionsCount).toFixed(1))
        : 0,
  }));

  const inspectionsCount = services.reduce((acc, item) => acc + item.inspectionsCount, 0);
  const averagePercent =
    inspectionsCount > 0
      ? Number(
          (
            services.reduce((acc, item) => acc + item.qualityPercent * item.inspectionsCount, 0) /
            inspectionsCount
          ).toFixed(1)
        )
      : 0;
  const pendingAdjustmentsCount = responses.reduce(
    (acc, response) => acc + response.summary.pendingAdjustmentsCount,
    0
  );

  return {
    month: responses[0]?.month ?? "",
    summary: {
      averagePercent,
      inspectionsCount,
      pendingAdjustmentsCount,
    },
    services,
  };
}

export function AnalyticsPage(): JSX.Element {
  const { hasAnyRole, user } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const initialTeamPerformanceFilters = useMemo(() => {
    const range = getCurrentMonthRange();
    return {
      from: range.from,
      to: range.to,
      teamIds: [] as string[],
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityByService, setQualityByService] = useState<QualityByServiceResponse | null>(null);
  const [currentMonthByService, setCurrentMonthByService] = useState<CurrentMonthByServiceResponse | null>(null);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [teamPerformanceFilters, setTeamPerformanceFilters] = useState(initialTeamPerformanceFilters);
  const [teamPerformanceByTeams, setTeamPerformanceByTeams] = useState<TeamPerformanceByTeamsResponse | null>(null);
  const [teamPerformanceLoading, setTeamPerformanceLoading] = useState(false);
  const [teamPerformanceError, setTeamPerformanceError] = useState<string | null>(null);
  const [usingFakeTeamPerformance, setUsingFakeTeamPerformance] = useState(false);
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
    }>
  >([]);
  const [rankingOrderBy, setRankingOrderBy] = useState<"average" | "field" | "remote" | "postWork">("average");
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
  const qualityRange = useMemo(() => getDefaultQualityRange(), []);

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

  const loadAnalyticsData = async (contractId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [qualityResponses, currentResponses] = await Promise.all([
        Promise.all(
          QUALITY_MODULES.map((module) =>
            appRepository.getDashboardQualityByService({
              ...qualityRange,
              contractId: contractId || undefined,
              module,
            })
          )
        ),
        Promise.all(
          QUALITY_MODULES.map((module) =>
            appRepository.getDashboardCurrentMonthByService({
              contractId: contractId || undefined,
              module,
            })
          )
        ),
      ]);
      const teamRanking = await appRepository.getDashboardTeamRanking({
        from: qualityRange.from,
        to: qualityRange.to,
        contractId: contractId || undefined,
      });
      const qualityRes =
        qualityResponses.length > 1
          ? mergeQualityByServiceResponses(qualityResponses)
          : qualityResponses[0];
      const currentRes =
        currentResponses.length > 1
          ? mergeCurrentMonthByServiceResponses(currentResponses)
          : currentResponses[0];
      setQualityByService(qualityRes ?? null);
      setCurrentMonthByService(currentRes ?? null);
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
        contractId: selectedContractId || undefined,
      });
      const activeTeams = result.data.filter((team) => team.active);
      setTeamOptions(activeTeams);
      return activeTeams;
    } catch {
      setTeamOptions([]);
      return [];
    }
  };

  const loadTeamPerformanceData = async (
    filters: typeof teamPerformanceFilters,
    options: Team[] = teamOptions
  ): Promise<void> => {
    if (filters.teamIds.length === 0) {
      setTeamPerformanceByTeams(null);
      setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
      setUsingFakeTeamPerformance(false);
      return;
    }

    setTeamPerformanceLoading(true);
    setTeamPerformanceError(null);
    setUsingFakeTeamPerformance(false);

    const payload = {
      from: filters.from,
      to: filters.to,
      teamIds: filters.teamIds,
      contractId: selectedContractId || undefined,
    };

    try {
      const result = await appRepository.getDashboardTeamPerformanceByTeams(payload);
      setTeamPerformanceByTeams(result);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setTeamPerformanceByTeams(buildFakeTeamPerformanceByTeams(payload, options));
        setUsingFakeTeamPerformance(true);
      } else {
        setTeamPerformanceError("Falha ao carregar o gráfico de desempenho por equipes.");
      }
    } finally {
      setTeamPerformanceLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccessAnalytics) return;
    void loadAnalyticsData(selectedContractId || undefined);
  }, [canAccessAnalytics, qualityRange, selectedContractId]);

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
      setUsingFakeTeamPerformance(false);
      if (teams.length === 0) {
        setTeamPerformanceError("Nenhuma equipe ativa encontrada para pesquisa.");
      } else {
        setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
      }
    };

    void bootstrapTeamPerformance();
  }, [canAccessAnalytics, initialTeamPerformanceFilters, selectedContractId]);

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

  const currentMonthBarMax = useMemo(
    () => Math.max(...(currentMonthByService?.services.map((item) => item.qualityPercent) || [0]), 100),
    [currentMonthByService]
  );

  const currentMonthLabel = useMemo(() => {
    if (!currentMonthByService?.month) return "";
    return formatMonthYearLabel(currentMonthByService.month);
  }, [currentMonthByService]);

  const growthTitle = useMemo(() => {
    if (chartMonths.length < 2) return "CRESCIMENTO MENSAL";
    const prev = chartMonths[chartMonths.length - 2].label;
    const last = chartMonths[chartMonths.length - 1].label;
    return `CRESCIMENTO ${prev} - ${last}`;
  }, [chartMonths]);

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
            : a.postWorkPercent;
      const bValue =
        rankingOrderBy === "average"
          ? b.averagePercent
          : rankingOrderBy === "field"
          ? b.fieldPercent
          : rankingOrderBy === "remote"
            ? b.remotePercent
            : b.postWorkPercent;
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
        from: qualityRange.from,
        to: qualityRange.to,
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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 0, height: "100%", overflow: "hidden" }}>
              <Box sx={CHART_HEADER_SX}>
                <Typography variant="h6" fontWeight={800}>
                  Desempenho Mensal de Qualidade
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  
                </Typography>
              </Box>

              <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2, flexWrap: "wrap" }}>
                  {chartMonths.map((month) => (
                    <Box key={month.key} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: month.color, borderRadius: 0.5 }} />
                      <Typography variant="caption" fontWeight={700}>
                        {month.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ height: 290, display: "flex", alignItems: "flex-end", gap: 2, pb: 1 }}>
                  {qualityByService.services.map((item) => (
                    <Box key={item.serviceKey} sx={{ minWidth: 92, flex: 1 }}>
                      <Box sx={{ height: 240, display: "flex", alignItems: "flex-end", gap: 0.6, mb: 1 }}>
                        {chartMonths.map((month, index) => {
                          const point = item.series.find((seriesItem) => seriesItem.month === month.key);
                          const value = point?.qualityPercent ?? 0;
                          return (
                            <Box
                              key={`${item.serviceKey}-${month.key}`}
                              sx={{
                                flex: 1,
                                height: `${(value / qualityChartMax) * 100}%`,
                                bgcolor: month.color,
                                borderRadius: "4px 4px 0 0",
                                position: "relative",
                              }}
                            >
                              {index === chartMonths.length - 1 && (
                                <Typography
                                  variant="caption"
                                  fontWeight={700}
                                  sx={{
                                    position: "absolute",
                                    top: -20,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    color: "#2e7d32",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {value.toFixed(2).replace(".", ",")}%
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                      <Typography variant="caption" fontWeight={700} display="block" align="center">
                        {item.serviceLabel}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ px: 2.5, py: 1.8, borderTop: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  {growthTitle}
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, pb: 0.5 }}>
                  {qualityByService.services.map((item) => (
                    <Box key={`growth-${item.serviceKey}`} sx={{ minWidth: 110, flex: 1, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.serviceLabel}
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {item.growth ? `${item.growth.growthPercent >= 0 ? "+" : ""}${item.growth.growthPercent.toFixed(2).replace(".", ",")}%` : "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 0, height: "100%", overflow: "hidden" }}>
              <Box sx={CHART_HEADER_SX}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Desempenho Mensal por Serviço
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {currentMonthLabel}
                </Typography>
              </Box>

              <Box sx={{ px: 1.5, py: 1.5, bgcolor: "#f7f8fa" }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 132,
                      bgcolor: "#001970",
                      color: "#fff",
                      borderRadius: 1,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ px: 1.2, py: 1.25, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Média Geral
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {currentMonthByService.summary.averagePercent.toFixed(1).replace(".", ",")}%
                      </Typography>
                    </Box>
                    <Box sx={{ px: 1.2, py: 1.25, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Serviços Avaliados
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {currentMonthByService.summary.inspectionsCount.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 1.2, py: 1.25 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Pendentes de Ajuste
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>
                        {currentMonthByService.summary.pendingAdjustmentsCount.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ height: 248, display: "flex", alignItems: "flex-end", gap: 1.1 }}>
                      {currentMonthByService.services.map((item) => (
                        <Box key={item.serviceKey} sx={{ flex: 1, minWidth: 56 }}>
                          <Box sx={{ height: 210, display: "flex", alignItems: "flex-end" }}>
                            <Box
                              sx={{
                                width: "100%",
                                height: `${(item.qualityPercent / currentMonthBarMax) * 100}%`,
                                bgcolor: "#0b158a",
                                borderRadius: "4px 4px 0 0",
                                position: "relative",
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                sx={{
                                  position: "absolute",
                                  top: -20,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  color: "#0f172a",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.qualityPercent.toFixed(1).replace(".", ",")}%
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            display="block"
                            align="center"
                            fontWeight={800}
                            sx={{ mt: 0.5, lineHeight: 1.1 }}
                          >
                            {item.serviceLabel}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Typography variant="h6" fontWeight={800}>
              Desempenho por Equipe (Multi-equipes)
            </Typography>
          </Box>

          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Data inicial"
                  value={teamPerformanceFilters.from}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: teamPerformanceFilters.to }}
                  onChange={(event) => {
                    const from = event.target.value;
                    setTeamPerformanceFilters((prev) => ({
                      ...prev,
                      from,
                      to: from > prev.to ? from : prev.to,
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Data final"
                  value={teamPerformanceFilters.to}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: teamPerformanceFilters.from }}
                  onChange={(event) => {
                    const to = event.target.value;
                    setTeamPerformanceFilters((prev) => ({
                      ...prev,
                      to,
                      from: to < prev.from ? to : prev.from,
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={teamOptions}
                  value={teamOptions.filter((team) => teamPerformanceFilters.teamIds.includes(team.id))}
                  onChange={(_, selectedTeams) => {
                    setTeamPerformanceFilters((prev) => ({
                      ...prev,
                      teamIds: selectedTeams.map((team) => team.id),
                    }));
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Equipes"
                      placeholder={teamOptions.length === 0 ? "Sem equipes ativas" : "Selecione as equipes"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={2} display="flex" alignItems="stretch">
                <Button
                  variant="contained"
                  onClick={handleSearchTeamPerformance}
                  disabled={
                    teamPerformanceLoading ||
                    teamPerformanceFilters.from === "" ||
                    teamPerformanceFilters.to === "" ||
                    teamPerformanceFilters.teamIds.length === 0
                  }
                  sx={{ width: "100%", fontWeight: 700 }}
                >
                  Buscar
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setTeamPerformanceFilters((prev) => ({ ...prev, teamIds: [] }));
                  setTeamPerformanceByTeams(null);
                  setUsingFakeTeamPerformance(false);
                  setTeamPerformanceError("Selecione ao menos uma equipe para buscar.");
                }}
                disabled={teamPerformanceFilters.teamIds.length === 0 || teamPerformanceLoading}
              >
                Limpar equipes
              </Button>
            </Box>

            {usingFakeTeamPerformance && (
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#fff8e1", border: "1px solid #ffe082" }}>
                <Typography variant="body2" color="text.secondary">
                  Dados fake em uso para este gráfico porque a rota ainda não está disponível no backend.
                </Typography>
              </Paper>
            )}

            {teamPerformanceError && (
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
                <Typography variant="body2" color="error.contrastText">
                  {teamPerformanceError}
                </Typography>
              </Paper>
            )}

            {teamPerformanceLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {!teamPerformanceLoading && teamPerformanceByTeams && (
              <Paper sx={{ p: 0, overflow: "hidden", border: "1px solid #dbe1ea" }}>
                <Box sx={{ display: "flex", bgcolor: "#f6f8fb" }}>
                  <Box
                    sx={{
                      width: 210,
                      bgcolor: "#001970",
                      color: "#fff",
                      borderRight: "1px solid rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.6, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Média Geral
                      </Typography>
                      <Typography variant="h4" fontWeight={900}>
                        {teamPerformanceByTeams.summary.averagePercent.toFixed(1).replace(".", ",")}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#ff8a80" }}>
                        Anterior: {teamPerformanceByTeams.summary.previousAveragePercent.toFixed(1).replace(".", ",")}%
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1.6, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Serviços Avaliados
                      </Typography>
                      <Typography variant="h4" fontWeight={900}>
                        {teamPerformanceByTeams.summary.inspectionsCount.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1.6 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Pendentes de Ajuste
                      </Typography>
                      <Typography variant="h4" fontWeight={900}>
                        {teamPerformanceByTeams.summary.pendingAdjustmentsCount.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, px: 2, py: 1.5 }}>
                    {teamPerformanceRows.length === 0 ? (
                      <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                        <Typography color="text.secondary">
                          Nenhuma equipe com dados no período selecionado.
                        </Typography>
                      </Paper>
                    ) : (
                      <Stack spacing={1.1}>
                        {teamPerformanceRows.map((row) => (
                          <Box key={row.teamId} sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              sx={{
                                width: 210,
                                textTransform: "uppercase",
                                lineHeight: 1.1,
                              }}
                            >
                              {row.teamName}
                            </Typography>

                            <Box sx={{ flex: 1, height: 28, bgcolor: "#e2e8f0", borderRadius: 1, overflow: "hidden" }}>
                              <Box
                                sx={{
                                  width: `${(row.averagePercent / teamPerformanceBarMax) * 100}%`,
                                  bgcolor: "#030a79",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  px: 1,
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} sx={{ color: "#fff" }}>
                                  {row.averagePercent.toFixed(1).replace(".", ",")}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Box>

                <Box sx={{ px: 2, py: 1.4, bgcolor: "#001970", color: "#fff" }}>
                  <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
                    {teamPerformanceRows.map((row) => (
                      <Box key={`${row.teamId}-inspections`} sx={{ minWidth: 118 }}>
                        <Typography variant="caption" fontWeight={700}>
                          {row.teamName.toUpperCase()}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {row.inspectionsCount}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            )}
          </Box>
        </Paper>

        <Paper sx={{ mt: 3, p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Typography variant="h6" fontWeight={800}>
              Ranking por Equipes - Qualidade
            </Typography>
          </Box>

          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            {teamRankingQuality.length === 0 ? (
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
                      <TableCell align="center">
                        <TableSortLabel
                          active={rankingOrderBy === "average"}
                          direction={rankingOrderBy === "average" ? rankingOrder : "desc"}
                          onClick={() => {
                            if (rankingOrderBy === "average") {
                              setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                            } else {
                              setRankingOrderBy("average");
                              setRankingOrder("desc");
                            }
                          }}
                        >
                          Média
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={rankingOrderBy === "field"}
                          direction={rankingOrderBy === "field" ? rankingOrder : "desc"}
                          onClick={() => {
                            if (rankingOrderBy === "field") {
                              setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                            } else {
                              setRankingOrderBy("field");
                              setRankingOrder("desc");
                            }
                          }}
                        >
                          Campo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={rankingOrderBy === "remote"}
                          direction={rankingOrderBy === "remote" ? rankingOrder : "desc"}
                          onClick={() => {
                            if (rankingOrderBy === "remote") {
                              setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                            } else {
                              setRankingOrderBy("remote");
                              setRankingOrder("desc");
                            }
                          }}
                        >
                          Remoto
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={rankingOrderBy === "postWork"}
                          direction={rankingOrderBy === "postWork" ? rankingOrder : "desc"}
                          onClick={() => {
                            if (rankingOrderBy === "postWork") {
                              setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                            } else {
                              setRankingOrderBy("postWork");
                              setRankingOrder("desc");
                            }
                          }}
                        >
                          Pós-obra
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Pendentes</TableCell>
                      <TableCell align="center">Qtd Vistorias</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedTeamRankingQuality.map((team) => (
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
                              onClick={() =>
                                void openRankingInspections(team.teamId, team.teamName, "field")
                              }
                            >
                              <PercentBadge percent={team.fieldPercent} size="small" />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver vistorias da métrica">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() =>
                                void openRankingInspections(team.teamId, team.teamName, "remote")
                              }
                            >
                              <PercentBadge percent={team.remotePercent} size="small" />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver vistorias da métrica">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() =>
                                void openRankingInspections(team.teamId, team.teamName, "postWork")
                              }
                            >
                              <PercentBadge percent={team.postWorkPercent} size="small" />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">{team.pendingCount}</TableCell>
                        <TableCell align="center">{team.inspectionsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </Paper>

        <Dialog
          open={rankingInspectionsOpen}
          onClose={() => setRankingInspectionsOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {rankingInspectionsMeta.teamName
              ? `Equipe: ${rankingInspectionsMeta.teamName}`
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
                        rankingInspectionsMeta.metric,
                        page
                      )
                    }
                    onRowsPerPageChange={(newLimit) => {
                      setRankingInspectionsMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                      void openRankingInspections(
                        rankingInspectionsMeta.teamId,
                        rankingInspectionsMeta.teamName,
                        rankingInspectionsMeta.metric,
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
      )}
    </Box>
  );
}
