import { Box, Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps): JSX.Element {
  return (
    <Box
      sx={{
        mb: 3,
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 2.5 },
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
        <Box>
          {eyebrow && (
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: 1 }}>
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Stack>
    </Box>
  );
}
