import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { getKpiScoreHighlight } from "./kpiScoreHighlight";
import { ForemenRankingData } from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityForemenTabProps = {
  data: ForemenRankingData | null;
  loading: boolean;
  error: string | null;
  dateFilterHint: ReactNode;
};

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

export function QualityForemenTab({
  data,
  loading,
  error,
  dateFilterHint,
}: QualityForemenTabProps): JSX.Element {
  const foremen = data?.foremen ?? [];

  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={CHART_HEADER_SX}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Resultado por encarregados
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              Qualidade
            </Typography>
          </Box>
          {dateFilterHint}
        </Box>
      </Box>

      <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && !loading && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
            <Typography variant="body2" color="error.contrastText">
              {error}
            </Typography>
          </Paper>
        )}

        {!loading && !error && foremen.length === 0 && (
          <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
            <Typography color="text.secondary">
              Nenhum resultado de encarregado encontrado para o período selecionado.
            </Typography>
          </Paper>
        )}

        {!loading && !error && foremen.length > 0 && (
          <Paper sx={{ p: 2, mb: 2.5, border: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              Nota média
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {foremen.map((foreman) => {
                const barColor = getKpiScoreHighlight(foreman.averagePercent).textColor;
                const width = Math.min(100, Math.max(0, foreman.averagePercent));
                return (
                  <Box key={foreman.foremanId} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      title={foreman.foremanName}
                      sx={{
                        width: { xs: 120, sm: 220 },
                        flexShrink: 0,
                        textTransform: "uppercase",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {foreman.foremanName}
                    </Typography>
                    <Box sx={{ flex: 1, height: 22, bgcolor: "#e2e8f0", borderRadius: 1, overflow: "hidden" }}>
                      <Box
                        sx={{
                          width: `${width}%`,
                          height: "100%",
                          bgcolor: barColor,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={800} sx={{ width: 72, flexShrink: 0, textAlign: "right" }}>
                      {formatPercent(foreman.averagePercent)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {!loading && !error && foremen.length > 0 && (
          <Paper sx={{ overflow: "auto", border: "1px solid #e2e8f0" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Encarregado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Nota média</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Vistorias</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Não conformidades</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Pendências abertas</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Pendências resolvidas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {foremen.map((foreman) => (
                  <TableRow key={foreman.foremanId} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{foreman.foremanName}</TableCell>
                    <TableCell align="right">{formatPercent(foreman.averagePercent)}</TableCell>
                    <TableCell align="right">{foreman.inspectionsCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{foreman.nonConformitiesCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{foreman.pendingAdjustmentsCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{foreman.resolvedCount.toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
