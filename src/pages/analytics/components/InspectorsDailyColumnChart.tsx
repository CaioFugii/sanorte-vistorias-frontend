import { Box, Typography } from "@mui/material";

type InspectorColumnSeries = {
  userId: string;
  userName: string;
  color: string;
  dailyCounts: Array<{ date: string; count: number }>;
};

type InspectorsDailyColumnChartProps = {
  days: string[];
  series: InspectorColumnSeries[];
};

function formatDayLabel(value: string): string {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

function buildYAxis(rawMax: number): { yMax: number; ticks: number[] } {
  const max = Math.max(1, rawMax);
  if (max <= 5) {
    return {
      yMax: max,
      ticks: Array.from({ length: max + 1 }, (_, index) => index),
    };
  }

  const rough = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const yMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= yMax; value += step) {
    ticks.push(value);
  }
  return { yMax, ticks };
}

export function InspectorsDailyColumnChart({
  days,
  series,
}: InspectorsDailyColumnChartProps): JSX.Element {
  const width = 960;
  const height = 300;
  const rawMax = Math.max(
    ...series.flatMap((inspector) => inspector.dailyCounts.map((item) => item.count)),
    0
  );
  const { yMax, ticks: yTicks } = buildYAxis(rawMax);
  const padding = { top: 16, right: 12, bottom: 36, left: yMax >= 100 ? 48 : 40 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = days.length > 0 ? plotWidth / days.length : plotWidth;
  const groupInner = slotWidth * 0.82;
  const barWidth = series.length > 0 ? groupInner / series.length : 0;
  const labelStep = days.length > 16 ? Math.ceil(days.length / 12) : 1;

  const yForCount = (count: number): number => {
    return padding.top + plotHeight - (count / yMax) * plotHeight;
  };

  const baseline = yForCount(0);

  return (
    <Box>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box
          component="svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Acompanhamento diário de vistorias por fiscal"
          sx={{ width: "100%", minWidth: 560, height: "auto", display: "block" }}
        >
          {yTicks.map((tick) => {
            const y = yForCount(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  {tick}
                </text>
              </g>
            );
          })}

          {days.map((day, index) => {
            if (index % labelStep !== 0 && index !== days.length - 1) return null;
            const x = padding.left + index * slotWidth + slotWidth / 2;
            return (
              <text key={`x-${day}`} x={x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
                {formatDayLabel(day)}
              </text>
            );
          })}

          {days.map((day, dayIndex) =>
            series.map((inspector, seriesIndex) => {
              const count = inspector.dailyCounts[dayIndex]?.count ?? 0;
              if (count <= 0) return null;
              const x = padding.left + dayIndex * slotWidth + (slotWidth - groupInner) / 2 + seriesIndex * barWidth;
              const y = yForCount(count);
              return (
                <rect
                  key={`${inspector.userId}-${day}`}
                  x={x}
                  y={y}
                  width={Math.max(barWidth - 1, 1)}
                  height={Math.max(baseline - y, 1)}
                  fill={inspector.color}
                  rx={1}
                >
                  <title>
                    {`${inspector.userName} — ${formatDayLabel(day)}: ${count} vistoria(s)`}
                  </title>
                </rect>
              );
            })
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
        {series.map((inspector) => (
          <Box key={inspector.userId} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "2px", bgcolor: inspector.color }} />
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {inspector.userName}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
