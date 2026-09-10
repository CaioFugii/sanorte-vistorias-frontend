import { Box, Grid, Paper, Typography } from "@mui/material";
import { getKpiScoreHighlight } from "@/pages/analytics/components/kpiScoreHighlight";
import { SafetyWorkSummary } from "@/pages/analytics/components/models";

type SafetyKpiStripProps = {
  summary: SafetyWorkSummary;
};

function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function SafetyKpiStrip({ summary }: SafetyKpiStripProps): JSX.Element {
  const checklists = summary.checklists ?? [];
  const averageHighlight = getKpiScoreHighlight(summary.averagePercent);

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: "1px solid #e2e8f0", height: "100%" }}>
            <Typography variant="caption" color="text.secondary">
              Média Geral
            </Typography>
            <Box sx={{ mt: 0.75 }}>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 1,
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  lineHeight: 1.6,
                  color: averageHighlight.textColor,
                  bgcolor: averageHighlight.backgroundColor,
                  border: `1px solid ${averageHighlight.borderColor}`,
                }}
              >
                {formatPercent(summary.averagePercent, 1)}
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: "1px solid #e2e8f0", height: "100%" }}>
            <Typography variant="caption" color="text.secondary">
              Avaliações
            </Typography>
            <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
              {checklists.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma avaliação no período.
                </Typography>
              ) : (
                checklists.map((checklist) => {
                  const scoreHighlight = getKpiScoreHighlight(checklist.averagePercent);
                  return (
                    <Box
                      key={checklist.checklistId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {checklist.checklistName}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 0.75,
                            py: 0.15,
                            borderRadius: 1,
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: scoreHighlight.textColor,
                            bgcolor: scoreHighlight.backgroundColor,
                            border: `1px solid ${scoreHighlight.borderColor}`,
                          }}
                        >
                          {formatPercent(checklist.averagePercent, 1)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {checklist.inspectionsCount.toLocaleString("pt-BR")}{" "}
                          {checklist.inspectionsCount === 1 ? "vistoria" : "vistorias"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
