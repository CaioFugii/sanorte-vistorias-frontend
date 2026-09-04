import { Box, Typography } from "@mui/material";
import { getInspectorColor } from "./inspectorColors";
import { InspectorProductionRow } from "./models";

type InspectorsDailyLineChartProps = {
  days: string[];
  inspectors: InspectorProductionRow[];
};

function formatDayLabel(value: string): string {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

export function InspectorsDailyLineChart({
  days,
  inspectors,
}: InspectorsDailyLineChartProps): JSX.Element {
  const width = 920;
  const height = 280;
  const padding = { top: 18, right: 16, bottom: 36, left: 36 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const rawMax = Math.max(
    ...inspectors.flatMap((inspector) => inspector.dailyCounts.map((item) => item.count)),
    0
  );
  const yMax = Math.max(1, rawMax);
  const yTicks = Array.from({ length: yMax + 1 }, (_, index) => index);
  const labelStep = days.length > 16 ? Math.ceil(days.length / 12) : 1;

  const xForIndex = (index: number): number => {
    if (days.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (days.length - 1)) * plotWidth;
  };

  const yForCount = (count: number): number => {
    return padding.top + plotHeight - (count / yMax) * plotHeight;
  };

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
            return (
              <text
                key={`x-${day}`}
                x={xForIndex(index)}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {formatDayLabel(day)}
              </text>
            );
          })}

          {inspectors.map((inspector, inspectorIndex) => {
            const color = getInspectorColor(inspectorIndex);
            const points = inspector.dailyCounts
              .map((item, index) => `${xForIndex(index)},${yForCount(item.count)}`)
              .join(" ");
            return (
              <g key={inspector.userId}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {inspector.dailyCounts.map((item, index) => (
                  <circle
                    key={`${inspector.userId}-${item.date}`}
                    cx={xForIndex(index)}
                    cy={yForCount(item.count)}
                    r={3.4}
                    fill="#fff"
                    stroke={color}
                    strokeWidth={2}
                  >
                    <title>
                      {`${inspector.userName} — ${formatDayLabel(item.date)}: ${item.count} vistoria(s)`}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 2,
          mt: 1.5,
        }}
      >
        {inspectors.map((inspector, index) => (
          <Box key={inspector.userId} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: getInspectorColor(index) }} />
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {inspector.userName}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
