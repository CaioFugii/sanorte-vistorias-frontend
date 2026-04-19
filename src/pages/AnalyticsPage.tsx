import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, Team, UserRole } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

type QualityByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardQualityByService>>;
type CurrentMonthByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardCurrentMonthByService>>;
type SafetyWorkLowScoreCollaboratorsResponse = Awaited<
  ReturnType<typeof appRepository.getDashboardSafetyWorkLowScoreCollaborators>
>;
type TeamPerformanceByTeamsResponse = Awaited<ReturnType<typeof appRepository.getDashboardTeamPerformanceByTeams>>;

const MONTH_COLORS = ["#ef6c00", "#1976d2", "#fbc02d", "#2e7d32", "#8e24aa", "#00897b"];
const DEFAULT_LOW_SCORE_THRESHOLD = 70;
const DEFAULT_LOW_SCORE_LIMIT = 15;

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

function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

function formatDateBr(yyyyMMdd: string): string {
  const [year, month, day] = yyyyMMdd.split("-");
  if (!year || !month || !day) return yyyyMMdd;
  return `${day}/${month}/${year}`;
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

export function AnalyticsPage(): JSX.Element {
  const { hasAnyRole, user } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const initialSafetyFilters = useMemo(() => {
    const range = getCurrentMonthRange();
    return {
      from: range.from,
      to: range.to,
      lowScoreThreshold: DEFAULT_LOW_SCORE_THRESHOLD,
      limit: DEFAULT_LOW_SCORE_LIMIT,
    };
  }, []);
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
  const [lowScoreFilters, setLowScoreFilters] = useState(initialSafetyFilters);
  const [lowScoreCollaborators, setLowScoreCollaborators] = useState<SafetyWorkLowScoreCollaboratorsResponse | null>(null);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [teamPerformanceFilters, setTeamPerformanceFilters] = useState(initialTeamPerformanceFilters);
  const [teamPerformanceByTeams, setTeamPerformanceByTeams] = useState<TeamPerformanceByTeamsResponse | null>(null);
  const [teamPerformanceLoading, setTeamPerformanceLoading] = useState(false);
  const [teamPerformanceError, setTeamPerformanceError] = useState<string | null>(null);
  const [usingFakeTeamPerformance, setUsingFakeTeamPerformance] = useState(false);
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

  const loadAnalyticsData = async (
    safetyFilters: typeof lowScoreFilters,
    contractId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const [qualityRes, currentRes, lowScoreRes] = await Promise.all([
        appRepository.getDashboardQualityByService({
          ...qualityRange,
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardCurrentMonthByService({
          contractId: contractId || undefined,
        }),
        appRepository.getDashboardSafetyWorkLowScoreCollaborators({
          ...safetyFilters,
          contractId: contractId || undefined,
        }),
      ]);
      setQualityByService(qualityRes);
      setCurrentMonthByService(currentRes);
      setLowScoreCollaborators(lowScoreRes);
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
    void loadAnalyticsData(initialSafetyFilters, selectedContractId || undefined);
  }, [canAccessAnalytics, initialSafetyFilters, qualityRange, selectedContractId]);

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

  const lowScoreBarMax = useMemo(
    () =>
      Math.max(
        ...(lowScoreCollaborators?.collaborators.map((item) => item.badScoreRatePercent) || [0]),
        100
      ),
    [lowScoreCollaborators]
  );

  const teamPerformanceRows = useMemo(() => {
    if (!teamPerformanceByTeams) return [];
    return [...teamPerformanceByTeams.teams].sort((a, b) => b.averagePercent - a.averagePercent);
  }, [teamPerformanceByTeams]);

  const teamPerformanceBarMax = useMemo(
    () => Math.max(...(teamPerformanceRows.map((row) => row.averagePercent) || [0]), 100),
    [teamPerformanceRows]
  );

  const handleSearchLowScoreCollaborators = () => {
    void loadAnalyticsData(lowScoreFilters, selectedContractId || undefined);
  };

  const handleSearchTeamPerformance = () => {
    void loadTeamPerformanceData(teamPerformanceFilters);
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
              <Box sx={{ px: 2.5, py: 2, bgcolor: "#9bc400", color: "#fff" }}>
                <Typography variant="h6" fontWeight={800} align="center">
                  Desempenho Mensal de Qualidade
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} align="center">
                  
                </Typography>
              </Box>

              <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Visão comparativa multi-mês por tipo de serviço
                  </Typography>
                </Box>

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

              <Box sx={{ px: 2.5, py: 1.8, bgcolor: "#001970", color: "#fff" }}>
                <Typography variant="subtitle2" fontWeight={800} align="center" sx={{ mb: 1 }}>
                  {growthTitle}
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, pb: 0.5 }}>
                  {qualityByService.services.map((item) => (
                    <Box key={`growth-${item.serviceKey}`} sx={{ minWidth: 110, flex: 1, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
                        {item.serviceLabel}
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ color: "#d3e86b" }}>
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
              <Box sx={{ px: 2, py: 1.5, bgcolor: "#9bc400", color: "#fff" }}>
                <Typography variant="subtitle1" fontWeight={800} align="center">
                  Desempenho Mensal por Serviço
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} align="center">
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
          <Box sx={{ px: 2.5, py: 1.7, bgcolor: "#9bc400", color: "#fff" }}>
            <Typography variant="h6" fontWeight={800}>
              Desempenho por Equipe (Multi-equipes)
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              Período: {formatDateBr(teamPerformanceFilters.from)} a {formatDateBr(teamPerformanceFilters.to)}
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
          <Box sx={{ px: 2.5, py: 1.7, bgcolor: "#0b158a", color: "#fff" }}>
            <Typography variant="h6" fontWeight={800}>
              Segurança do Trabalho - Colaboradores com Nota Baixa
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
                  value={lowScoreFilters.from}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: lowScoreFilters.to }}
                  onChange={(event) => {
                    const from = event.target.value;
                    setLowScoreFilters((prev) => ({
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
                  value={lowScoreFilters.to}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: lowScoreFilters.from }}
                  onChange={(event) => {
                    const to = event.target.value;
                    setLowScoreFilters((prev) => ({
                      ...prev,
                      to,
                      from: to < prev.from ? to : prev.from,
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limiar nota baixa"
                  value={lowScoreFilters.lowScoreThreshold}
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (!Number.isFinite(parsed)) return;
                    setLowScoreFilters((prev) => ({
                      ...prev,
                      lowScoreThreshold: Math.max(0, Math.min(100, parsed)),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limite"
                  value={lowScoreFilters.limit}
                  inputProps={{ min: 1, max: 100, step: 1 }}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (!Number.isFinite(parsed)) return;
                    setLowScoreFilters((prev) => ({
                      ...prev,
                      limit: Math.max(1, Math.min(100, parsed)),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2} display="flex" alignItems="stretch">
                <Button
                  variant="contained"
                  onClick={handleSearchLowScoreCollaborators}
                  disabled={loading}
                  sx={{ width: "100%", fontWeight: 700 }}
                >
                  Buscar
                </Button>
              </Grid>
            </Grid>

            {lowScoreCollaborators && lowScoreCollaborators.collaborators.length === 0 && (
              <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                <Typography color="text.secondary">
                  Nenhum colaborador encontrado abaixo do limiar selecionado no período.
                </Typography>
              </Paper>
            )}

            {lowScoreCollaborators && lowScoreCollaborators.collaborators.length > 0 && (
              <Stack spacing={1.5}>
                {lowScoreCollaborators.collaborators.map((item) => (
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
      </Box>
      )}
    </Box>
  );
}
