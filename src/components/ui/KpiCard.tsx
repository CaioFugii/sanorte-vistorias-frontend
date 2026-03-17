import { Box, Paper, Typography } from "@mui/material";

interface KpiCardProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warning";
}

export function KpiCard({ icon, label, value, tone = "default" }: KpiCardProps): JSX.Element {
  return (
    <Paper sx={{ p: 3, textAlign: "center" }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          color: tone === "warning" ? "warning.main" : "text.primary",
        }}
      >
        {icon}
        {label}
      </Typography>
      <Box>{value}</Box>
    </Paper>
  );
}
