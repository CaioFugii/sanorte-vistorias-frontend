import { Box, Grid, Paper, Typography } from "@mui/material";

type QualityKpiStripProps = {
  qualitySummary: {
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
    field: {
      inspectionsCount: number;
      averagePercent: number;
    };
    postWork: {
      inspectionsCount: number;
      averagePercent: number;
    };
    remote: {
      inspectionsCount: number;
      averagePercent: number;
    };
    investmentWorks: {
      inspectionsCount: number;
      averagePercent: number;
    };
  };
};

export function QualityKpiStrip({
  qualitySummary,
}: QualityKpiStripProps): JSX.Element {
  const average = qualitySummary.averagePercent;
  const inspections = qualitySummary.inspectionsCount;
  const pending = qualitySummary.pendingCount;

  const cards = [
    {
      title: "Média Geral",
      value: `${average.toFixed(1).replace(".", ",")}%`,
    },
    {
      title: "Vistorias no período",
      value: inspections.toLocaleString("pt-BR"),
    },
    {
      title: "Pendentes de ajuste",
      value: pending.toLocaleString("pt-BR"),
    },
  ];
  const moduleCards = [
    { title: "Campo", key: "field" as const },
    { title: "Pós-obra", key: "postWork" as const },
    { title: "Remoto", key: "remote" as const },
    { title: "Obras de investimento", key: "investmentWorks" as const },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" color="text.secondary">
                {card.title}
              </Typography>
              <Box sx={{ mt: 0.75 }}>
                <Typography variant="h6" fontWeight={800}>
                  {card.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {moduleCards.map((card) => {
          const moduleData = qualitySummary[card.key];
          return (
            <Grid key={card.title} item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, border: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                <Typography variant="caption" color="text.secondary">
                  {card.title}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {moduleData.inspectionsCount.toLocaleString("pt-BR")} vistorias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Média: {moduleData.averagePercent.toFixed(1).replace(".", ",")}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
