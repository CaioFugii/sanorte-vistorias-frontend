import { Box, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

type QualityByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardQualityByService>>;
type CurrentMonthByServiceResponse = Awaited<ReturnType<typeof appRepository.getDashboardCurrentMonthByService>>;

const MONTH_COLORS = ["#ef6c00", "#1976d2", "#fbc02d", "#2e7d32", "#8e24aa", "#00897b"];

function getDefaultQualityRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - 3, 1);
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

export function AnalyticsPage(): JSX.Element {
  const { hasAnyRole } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityByService, setQualityByService] = useState<QualityByServiceResponse | null>(null);
  const [currentMonthByService, setCurrentMonthByService] = useState<CurrentMonthByServiceResponse | null>(null);

  useEffect(() => {
    if (!canAccessAnalytics) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = getDefaultQualityRange();
        const [qualityRes, currentRes] = await Promise.all([
          appRepository.getDashboardQualityByService(range),
          appRepository.getDashboardCurrentMonthByService(),
        ]);
        setQualityByService(qualityRes);
        setCurrentMonthByService(currentRes);
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
    load();
  }, [canAccessAnalytics]);

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
          <Grid item xs={7}>
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

          <Grid item xs={5}>
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
      </Box>
      )}
    </Box>
  );
}
