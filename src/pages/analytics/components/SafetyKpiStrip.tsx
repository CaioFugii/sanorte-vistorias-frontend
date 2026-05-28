import { Box, Grid, Paper, Typography } from "@mui/material";
import { getKpiScoreHighlight } from "@/pages/analytics/components/kpiScoreHighlight";

type SafetyKpiStripProps = {
  summary: {
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  };
};

function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function SafetyKpiStrip({ summary }: SafetyKpiStripProps): JSX.Element {
  const cards = [
    {
      title: "Média Geral",
      value: formatPercent(summary.averagePercent, 1),
      scorePercent: summary.averagePercent,
    },
    {
      title: "Vistorias no período",
      value: summary.inspectionsCount.toLocaleString("pt-BR"),
    },
    {
      title: "Pendentes de ajuste",
      value: summary.pendingCount.toLocaleString("pt-BR"),
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {cards.map((card) => {
          const scoreHighlight = card.scorePercent !== undefined ? getKpiScoreHighlight(card.scorePercent) : null;
          return (
            <Grid key={card.title} item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
                <Typography variant="caption" color="text.secondary">
                  {card.title}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  {scoreHighlight ? (
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
                        color: scoreHighlight.textColor,
                        bgcolor: scoreHighlight.backgroundColor,
                        border: `1px solid ${scoreHighlight.borderColor}`,
                      }}
                    >
                      {card.value}
                    </Box>
                  ) : (
                    <Typography variant="h6" fontWeight={800}>
                      {card.value}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
