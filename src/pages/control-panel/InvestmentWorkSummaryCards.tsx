import { Box, Paper, Typography } from "@mui/material";
import { InvestmentWorkSummary } from "@/domain";

function formatPeriod(from: string, to: string): string {
  const label = (value: string) => {
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}/${month}/${year}` : value;
  };
  return `${label(from)} a ${label(to)}`;
}

function Card({
  title,
  period,
  goal,
  done,
}: {
  title: string;
  period: { from: string; to: string };
  goal: number;
  done: number;
}): JSX.Element {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 220 }}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatPeriod(period.from, period.to)}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
        {done} / {goal}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Realizadas / meta
      </Typography>
    </Paper>
  );
}

export function InvestmentWorkSummaryCards({
  summary,
}: {
  summary: InvestmentWorkSummary | null;
}): JSX.Element | null {
  if (!summary) return null;
  return (
    <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
      <Card title="Campo" period={summary.field.period} goal={summary.field.goal} done={summary.field.done} />
      <Card
        title="Pós Obra"
        period={summary.postWork.period}
        goal={summary.postWork.goal}
        done={summary.postWork.done}
      />
    </Box>
  );
}
