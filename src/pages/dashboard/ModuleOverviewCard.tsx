import { Box, Paper, Typography } from "@mui/material";
import { DashboardOverviewModule } from "@/domain";

type ModuleOverviewCardProps = {
  title: string;
  subtitle?: string;
  color: string;
  data: DashboardOverviewModule;
  onClick: () => void;
};

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatCount(value: number): string {
  return value.toLocaleString("pt-BR");
}

function monthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" })
    .format(new Date(year, (month || 1) - 1, 1))
    .toUpperCase();
}

function Donut({ percent, color }: { percent: number; color: string }): JSX.Element {
  const size = 78;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const dash = (clamped / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8edf3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Typography
        variant="caption"
        fontWeight={800}
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0B1F5B",
        }}
      >
        {formatPercent(percent)}
      </Typography>
    </Box>
  );
}

export function ModuleOverviewCard({
  title,
  subtitle = "VISTORIAS GERAIS",
  color,
  data,
  onClick,
}: ModuleOverviewCardProps): JSX.Element {
  const barMax = Math.max(...data.months.map((month) => month.averagePercent), 100);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        height: "100%",
        cursor: "pointer",
        borderRadius: 3,
        boxShadow: "0 8px 24px rgba(11, 31, 91, 0.06)",
        "&:hover": { boxShadow: "0 10px 28px rgba(11, 31, 91, 0.1)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0B1F5B", letterSpacing: 0.2 }}>
            {title}
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: "#64748b", letterSpacing: 0.6 }}>
            {subtitle}
          </Typography>
        </Box>
        <Donut percent={data.averagePercent} color={color} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.months.length, 1)}, 1fr)`,
          alignItems: "end",
          gap: 1.5,
          minHeight: 180,
          mb: 1.5,
        }}
      >
        {data.months.map((month) => {
          const heightPercent = (month.averagePercent / barMax) * 100;
          return (
            <Box key={month.month} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0B1F5B", mb: 0.75 }}>
                {formatPercent(month.averagePercent)}
              </Typography>
              <Box
                sx={{
                  width: "72%",
                  maxWidth: 72,
                  height: 132,
                  bgcolor: "#eef2f6",
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "flex-end",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: `${heightPercent}%`,
                    minHeight: month.inspectionsCount > 0 ? 8 : 0,
                    bgcolor: color,
                    borderRadius: 1.5,
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ mt: 1, color: "#0B1F5B", textAlign: "center", lineHeight: 1.15 }}
              >
                {monthLabel(month.month)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.months.length, 1)}, 1fr)`,
          gap: 1.5,
        }}
      >
        {data.months.map((month) => (
          <Typography
            key={`${month.month}-count`}
            variant="subtitle2"
            fontWeight={800}
            sx={{ color: "#0B1F5B", textAlign: "center" }}
          >
            {formatCount(month.inspectionsCount)}
          </Typography>
        ))}
      </Box>
      <Typography
        variant="caption"
        fontWeight={800}
        sx={{ display: "block", textAlign: "center", color: "#0B1F5B", mt: 0.5, letterSpacing: 0.4 }}
      >
        TOTAL DE VISTORIAS
      </Typography>
    </Paper>
  );
}
