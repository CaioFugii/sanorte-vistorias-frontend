import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { InspectorsDailyLineChart } from "./InspectorsDailyLineChart";
import { getInspectorColor } from "./inspectorColors";
import { InspectorsProductionData } from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type SafetyFiscaisTabProps = {
  data: InspectorsProductionData | null;
  loading: boolean;
  error: string | null;
  dateFilterHint: ReactNode;
};

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDayLabel(value: string): string {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

function formatAverage(value: number): string {
  const digits = Number.isInteger(value) ? 0 : 2;
  return value.toFixed(digits).replace(".", ",");
}

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SafetyFiscaisTab({
  data,
  loading,
  error,
  dateFilterHint,
}: SafetyFiscaisTabProps): JSX.Element {
  const today = todayDateKey();
  const inspectors = data?.inspectors ?? [];
  const days = data?.days ?? [];

  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={CHART_HEADER_SX}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Produção diária dos fiscais
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              Segurança do Trabalho
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

        {!loading && !error && inspectors.length === 0 && (
          <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
            <Typography color="text.secondary">
              Nenhuma vistoria de Segurança do Trabalho encontrada para o período selecionado.
            </Typography>
          </Paper>
        )}

        {!loading && !error && inspectors.length > 0 && (
          <>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {inspectors.map((inspector, index) => (
                <Grid key={inspector.userId} item xs={12} sm={6} md={inspectors.length === 1 ? 12 : 6} lg={4}>
                  <Paper sx={{ p: 2, border: "1px solid #e2e8f0", borderLeft: `4px solid ${getInspectorColor(index)}` }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "uppercase" }}>
                      {inspector.userName}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Vistorias
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {inspector.inspectionsCount.toLocaleString("pt-BR")}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Dias com avaliação
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {inspector.daysWithInspections}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Média
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {formatAverage(inspector.dailyAverage)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Paper sx={{ overflow: "auto", border: "1px solid #e2e8f0", mb: 2.5 }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        bgcolor: "#fff",
                        fontWeight: 800,
                        minWidth: 160,
                      }}
                    >
                      Fiscais
                    </TableCell>
                    {days.map((day) => {
                      const date = parseDateOnly(day);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = day === today;
                      return (
                        <TableCell
                          key={day}
                          align="center"
                          sx={{
                            minWidth: 64,
                            bgcolor: isToday ? "#dcfce7" : isWeekend ? "#f1f5f9" : "#fff",
                            py: 1,
                          }}
                        >
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {WEEKDAY_LABELS[date.getDay()]}
                          </Typography>
                          <Typography variant="caption" fontWeight={800} display="block">
                            {formatDayLabel(day)}
                          </Typography>
                        </TableCell>
                      );
                    })}
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        right: 0,
                        zIndex: 2,
                        bgcolor: "#eff6ff",
                        fontWeight: 800,
                        minWidth: 88,
                      }}
                    >
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspectors.map((inspector, inspectorIndex) => (
                    <TableRow key={inspector.userId} hover>
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          bgcolor: "#fff",
                          fontWeight: 700,
                          borderLeft: `4px solid ${getInspectorColor(inspectorIndex)}`,
                        }}
                      >
                        {inspector.userName}
                      </TableCell>
                      {inspector.dailyCounts.map((item) => {
                        const date = parseDateOnly(item.date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = item.date === today;
                        return (
                          <TableCell
                            key={`${inspector.userId}-${item.date}`}
                            align="center"
                            sx={{
                              bgcolor: isToday ? "#dcfce7" : isWeekend ? "#f8fafc" : "#fff",
                              fontWeight: item.count > 0 ? 700 : 400,
                              color: item.count > 0 ? "text.primary" : "text.disabled",
                            }}
                          >
                            {item.count}
                          </TableCell>
                        );
                      })}
                      <TableCell
                        align="center"
                        sx={{
                          position: "sticky",
                          right: 0,
                          bgcolor: "#eff6ff",
                          fontWeight: 800,
                        }}
                      >
                        {inspector.inspectionsCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                Acompanhamento de vistorias
              </Typography>
              <InspectorsDailyLineChart days={days} inspectors={inspectors} />
            </Paper>
          </>
        )}
      </Box>
    </Paper>
  );
}
