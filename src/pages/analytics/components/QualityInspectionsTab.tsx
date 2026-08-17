import { Box, Paper, Typography } from "@mui/material";
import { ReactNode } from "react";
import { ModuleType } from "@/domain/enums";
import { InspectionsPage } from "@/pages/InspectionsPage";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

const QUALITY_MODULE_OPTIONS = [
  ModuleType.CAMPO,
  ModuleType.REMOTO,
  ModuleType.POS_OBRA,
  ModuleType.OBRAS_INVESTIMENTO,
];

type QualityInspectionsTabProps = {
  contractId?: string;
  dateFilterHint: ReactNode;
};

export function QualityInspectionsTab({
  contractId,
  dateFilterHint,
}: QualityInspectionsTabProps): JSX.Element {
  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={CHART_HEADER_SX}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Vistorias - Qualidade
          </Typography>
          {dateFilterHint}
        </Box>
      </Box>
      <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        <InspectionsPage
          moduleOptions={QUALITY_MODULE_OPTIONS}
          hideHeader
          embedded
          contractId={contractId}
        />
      </Box>
    </Paper>
  );
}
