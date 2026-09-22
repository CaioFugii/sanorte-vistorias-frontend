import {
  Autocomplete,
  Box,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { TeamOption } from "./models";

function formatRatePercent(rate: number): string {
  const rounded = Math.round(rate * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString("pt-BR")
    : rounded.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatNonConformityCaption(count: number, answers: number, rate: number): string {
  return `Não conforme em ${count.toLocaleString("pt-BR")} de ${answers.toLocaleString("pt-BR")} respostas (${formatRatePercent(rate)}%)`;
}

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityNonConformitiesTabProps = {
  checklistTitle?: string;
  teamTitle?: string;
  topLimit?: number;
  byChecklist: {
    checklists: Array<{
      checklistId: string;
      checklistName: string;
      sectorName?: string;
      totalNonConformities: number;
      questions: Array<{
        checklistItemId: string;
        checklistItemTitle: string;
        nonConformitiesCount: number;
        answersCount: number;
        nonConformityRatePercent: number;
      }>;
    }>;
  } | null;
  byTeam: {
    checklists: Array<{
      checklistId: string;
      checklistName: string;
      sectorName?: string;
      totalNonConformities: number;
      questions: Array<{
        checklistItemId: string;
        checklistItemTitle: string;
        nonConformitiesCount: number;
        answersCount: number;
        nonConformityRatePercent: number;
      }>;
    }>;
  } | null;
  teamOptions: TeamOption[];
  selectedTeamId: string;
  onSelectedTeamIdChange: (teamId: string) => void;
  byTeamLoading: boolean;
  byTeamError: string | null;
  dateFilterHint: ReactNode;
};

export function QualityNonConformitiesTab({
  checklistTitle = "Perguntas com mais não conformidades por checklist (Top 5)",
  teamTitle = "Não conformidades da equipe selecionada por checklist (Top 5)",
  topLimit = 5,
  byChecklist,
  byTeam,
  teamOptions,
  selectedTeamId,
  onSelectedTeamIdChange,
  byTeamLoading,
  byTeamError,
  dateFilterHint,
}: QualityNonConformitiesTabProps): JSX.Element {
  const sortedTeamOptions = [...teamOptions].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );
  const selectedTeam = sortedTeamOptions.find((team) => team.id === selectedTeamId) ?? null;
  const selectedTeamName = selectedTeam?.name ?? "";

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={800}>
                {checklistTitle}
              </Typography>
              {dateFilterHint}
            </Box>
          </Box>
          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            {!byChecklist || byChecklist.checklists.length === 0 ? (
              <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                <Typography color="text.secondary">
                  Nenhuma não conformidade encontrada para o período selecionado.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {byChecklist.checklists.map((checklist) => (
                  <Grid key={checklist.checklistId} item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {checklist.checklistName}
                        {checklist.sectorName ? (
                          <Typography
                            component="span"
                            variant="subtitle2"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{ ml: 0.75 }}
                          >
                            · {checklist.sectorName}
                          </Typography>
                        ) : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total de não conformidades: {checklist.totalNonConformities.toLocaleString("pt-BR")}
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        {checklist.questions.slice(0, topLimit).map((question, index) => (
                          <Box
                            key={question.checklistItemId}
                            sx={{
                              py: 1,
                              borderBottom:
                                index < Math.min(checklist.questions.length, topLimit) - 1
                                  ? "1px solid #e2e8f0"
                                  : "none",
                            }}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {index + 1}. {question.checklistItemTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatNonConformityCaption(
                                question.nonConformitiesCount,
                                question.answersCount,
                                question.nonConformityRatePercent
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={800}>
                {teamTitle}
              </Typography>
              {dateFilterHint}
            </Box>
          </Box>
          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Box sx={{ mb: 2, maxWidth: 380 }}>
              <Autocomplete
                options={sortedTeamOptions}
                value={selectedTeam}
                onChange={(_, team) => onSelectedTeamIdChange(team?.id ?? "")}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipe"
                    placeholder="Buscar equipe"
                    size="small"
                  />
                )}
              />
            </Box>

            {byTeamLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {byTeamError && !byTeamLoading && (
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
                <Typography variant="body2" color="error.contrastText">
                  {byTeamError}
                </Typography>
              </Paper>
            )}

            {!byTeamLoading && !byTeamError && (!byTeam || byTeam.checklists.length === 0) && (
              <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                <Typography color="text.secondary">
                  {selectedTeamName
                    ? `Nenhuma não conformidade encontrada para ${selectedTeamName} no período selecionado.`
                    : `Selecione uma equipe para visualizar as não conformidades por checklist.`}
                </Typography>
              </Paper>
            )}

            {!byTeamLoading && !byTeamError && byTeam && byTeam.checklists.length > 0 && (
              <Grid container spacing={2}>
                {byTeam.checklists.map((checklist) => (
                  <Grid key={checklist.checklistId} item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {checklist.checklistName}
                        {checklist.sectorName ? (
                          <Typography
                            component="span"
                            variant="subtitle2"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{ ml: 0.75 }}
                          >
                            · {checklist.sectorName}
                          </Typography>
                        ) : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total de não conformidades: {checklist.totalNonConformities.toLocaleString("pt-BR")}
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        {checklist.questions.slice(0, topLimit).map((question, index) => (
                          <Box
                            key={question.checklistItemId}
                            sx={{
                              py: 1,
                              borderBottom:
                                index < Math.min(checklist.questions.length, topLimit) - 1
                                  ? "1px solid #e2e8f0"
                                  : "none",
                            }}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {index + 1}. {question.checklistItemTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatNonConformityCaption(
                                question.nonConformitiesCount,
                                question.answersCount,
                                question.nonConformityRatePercent
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
