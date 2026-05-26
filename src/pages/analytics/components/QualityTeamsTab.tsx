import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import {
  TeamOption,
  TeamPerformanceData,
  TeamPerformanceFilters,
  TeamPerformanceRow,
} from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityTeamsTabProps = {
  teamOptions: TeamOption[];
  teamPerformanceFilters: TeamPerformanceFilters;
  setTeamPerformanceFilters: Dispatch<SetStateAction<TeamPerformanceFilters>>;
  globalPeriod: { from: string; to: string };
  onSearchTeamPerformance: () => void;
  teamPerformanceLoading: boolean;
  teamPerformanceError: string | null;
  teamPerformanceByTeams: TeamPerformanceData | null;
  teamPerformanceRows: TeamPerformanceRow[];
  teamPerformanceBarMax: number;
  clearTeamSelection: () => void;
};

export function QualityTeamsTab({
  teamOptions,
  teamPerformanceFilters,
  setTeamPerformanceFilters,
  globalPeriod,
  onSearchTeamPerformance,
  teamPerformanceLoading,
  teamPerformanceError,
  teamPerformanceByTeams,
  teamPerformanceRows,
  teamPerformanceBarMax,
  clearTeamSelection,
}: QualityTeamsTabProps): JSX.Element {
  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={CHART_HEADER_SX}>
        <Typography variant="h6" fontWeight={800}>
          Desempenho por Equipe (Multi-equipes)
        </Typography>
      </Box>

      <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Período global aplicado: {globalPeriod.from} até {globalPeriod.to}
        </Typography>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr auto" }, mb: 2 }}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={teamOptions}
            value={teamOptions.filter((team) => teamPerformanceFilters.teamIds.includes(team.id))}
            onChange={(_, selectedTeams) => {
              setTeamPerformanceFilters((prev) => ({
                ...prev,
                teamIds: selectedTeams.map((team) => team.id),
              }));
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Equipes"
                placeholder={teamOptions.length === 0 ? "Sem equipes ativas" : "Selecione as equipes"}
              />
            )}
          />

          <Button
            variant="contained"
            onClick={onSearchTeamPerformance}
            disabled={teamPerformanceLoading || teamPerformanceFilters.teamIds.length === 0}
            sx={{ fontWeight: 700, minWidth: 140 }}
          >
            Buscar
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={clearTeamSelection}
            disabled={teamPerformanceFilters.teamIds.length === 0 || teamPerformanceLoading}
          >
            Limpar equipes
          </Button>
        </Box>

        {teamPerformanceError && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
            <Typography variant="body2" color="error.contrastText">
              {teamPerformanceError}
            </Typography>
          </Paper>
        )}

        {teamPerformanceLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!teamPerformanceLoading && teamPerformanceByTeams && (
          <Paper sx={{ p: 0, overflow: "hidden", border: "1px solid #dbe1ea" }}>
            <Box sx={{ display: "flex", bgcolor: "#f6f8fb" }}>
              <Box
                sx={{
                  width: 210,
                  bgcolor: "#001970",
                  color: "#fff",
                  borderRight: "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ px: 2, py: 1.6, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Média Geral
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {teamPerformanceByTeams.summary.averagePercent.toFixed(1).replace(".", ",")}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#ff8a80" }}>
                    Anterior:{" "}
                    {teamPerformanceByTeams.summary.previousAveragePercent.toFixed(1).replace(".", ",")}%
                  </Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.6, borderBottom: "1px dashed rgba(255,255,255,0.35)" }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Serviços Avaliados
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {teamPerformanceByTeams.summary.inspectionsCount.toLocaleString("pt-BR")}
                  </Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.6 }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Pendentes de Ajuste
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {teamPerformanceByTeams.summary.pendingAdjustmentsCount.toLocaleString("pt-BR")}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, px: 2, py: 1.5 }}>
                {teamPerformanceRows.length === 0 ? (
                  <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                    <Typography color="text.secondary">
                      Nenhuma equipe com dados no período selecionado.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.1}>
                    {teamPerformanceRows.map((row) => (
                      <Box key={row.teamId} sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            width: 210,
                            textTransform: "uppercase",
                            lineHeight: 1.1,
                          }}
                        >
                          {row.teamName}
                        </Typography>

                        <Box sx={{ flex: 1, height: 28, bgcolor: "#e2e8f0", borderRadius: 1, overflow: "hidden" }}>
                          <Box
                            sx={{
                              width: `${(row.averagePercent / teamPerformanceBarMax) * 100}%`,
                              bgcolor: "#030a79",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              px: 1,
                            }}
                          >
                            <Typography variant="caption" fontWeight={800} sx={{ color: "#fff" }}>
                              {row.averagePercent.toFixed(1).replace(".", ",")}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>

            <Box sx={{ px: 2, py: 1.4, bgcolor: "#001970", color: "#fff" }}>
              <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
                {teamPerformanceRows.map((row) => (
                  <Box key={`${row.teamId}-inspections`} sx={{ minWidth: 118 }}>
                    <Typography variant="caption" fontWeight={700}>
                      {row.teamName.toUpperCase()}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {row.inspectionsCount}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
