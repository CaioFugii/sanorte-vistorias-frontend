import { Box, Typography } from "@mui/material";

type DateFilterHintProps = {
  label: string;
  isFiltered: boolean;
  textOverride?: string;
};

export function DateFilterHint({
  label,
  isFiltered,
  textOverride,
}: DateFilterHintProps): JSX.Element {
  const content = textOverride ?? (isFiltered ? `Filtrado: ${label}` : "Sem filtro de data");

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.9,
        py: 0.2,
        borderRadius: 999,
        border: "1px solid #dbe1ea",
        bgcolor: isFiltered ? "#f0f7ff" : "#f8fafc",
      }}
    >
      <Typography
        component="span"
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, lineHeight: 1.1 }}
      >
        {content}
      </Typography>
    </Box>
  );
}
