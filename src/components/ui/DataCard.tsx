import { Paper, Typography } from "@mui/material";

interface DataCardProps {
  title?: string;
  children: React.ReactNode;
}

export function DataCard({ title, children }: DataCardProps): JSX.Element {
  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      {title && (
        <Typography
          variant="h6"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", color: "primary.dark" }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Paper>
  );
}
