import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import { QualityByServiceData, QualityChartMonth } from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityOverviewTabProps = {
  qualityByService: QualityByServiceData;
  chartMonths: QualityChartMonth[];
  qualityChartMax: number;
  growthTitle: string;
  dateFilterHint: ReactNode;
};

export function QualityOverviewTab({
  qualityByService,
  chartMonths,
  qualityChartMax,
  growthTitle,
  dateFilterHint,
}: QualityOverviewTabProps): JSX.Element {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 0, height: "100%", overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={800}>
                Desempenho Mensal de Qualidade
              </Typography>
              {dateFilterHint}
            </Box>
          </Box>

          <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              useFlexGap
              sx={{ mb: 2, flexWrap: "wrap", rowGap: 1, px: 1 }}
            >
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
                      const inspectionsCount = point?.inspectionsCount ?? 0;
                      const barHeightPercent = (value / qualityChartMax) * 100;
                      const visualHeight =
                        inspectionsCount > 0
                          ? `${Math.max(barHeightPercent, 2)}%`
                          : "2px";
                      return (
                        <Box
                          key={`${item.serviceKey}-${month.key}`}
                          sx={{
                            flex: 1,
                            height: visualHeight,
                            bgcolor: month.color,
                            borderRadius: "4px 4px 0 0",
                            position: "relative",
                            opacity: inspectionsCount > 0 ? 1 : 0.35,
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
                    {item.growth
                      ? `${item.growth.growthPercent >= 0 ? "+" : ""}${item.growth.growthPercent
                          .toFixed(2)
                          .replace(".", ",")}%`
                      : "-"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
