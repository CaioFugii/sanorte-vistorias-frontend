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

const SAFETY_MODULE_OPTIONS = [ModuleType.SEGURANCA_TRABALHO];

type SafetyInspectionsTabProps = {
  contractId?: string;
  dateFilterHint: ReactNode;
};

export function SafetyInspectionsTab({
  contractId,
  dateFilterHint,
}: SafetyInspectionsTabProps): JSX.Element {
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
            Vistorias - Segurança do Trabalho
          </Typography>
          {dateFilterHint}
        </Box>
      </Box>
      <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        <InspectionsPage
          moduleOptions={SAFETY_MODULE_OPTIONS}
          defaultModule={ModuleType.SEGURANCA_TRABALHO}
          hideHeader
          embedded
          contractId={contractId}
        />
      </Box>
    </Paper>
  );
}
