import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { TeamOption } from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityNonConformitiesTabProps = {
  byChecklist: {
    checklists: Array<{
      checklistId: string;
      checklistName: string;
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
    nonConformities: Array<{
      checklistItemId: string;
      checklistItemTitle: string;
      nonConformitiesCount: number;
      answersCount: number;
      nonConformityRatePercent: number;
      checklistsCount: number;
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
  byChecklist,
  byTeam,
  teamOptions,
  selectedTeamId,
  onSelectedTeamIdChange,
  byTeamLoading,
  byTeamError,
  dateFilterHint,
}: QualityNonConformitiesTabProps): JSX.Element {
  const selectedTeamName = teamOptions.find((team) => team.id === selectedTeamId)?.name ?? "";

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={CHART_HEADER_SX}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={800}>
                Perguntas com mais não conformidades por checklist (Top 5)
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
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total de NC: {checklist.totalNonConformities.toLocaleString("pt-BR")}
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        {checklist.questions.slice(0, 5).map((question, index) => (
                          <Box
                            key={question.checklistItemId}
                            sx={{ py: 1, borderBottom: index < 4 ? "1px solid #e2e8f0" : "none" }}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {index + 1}. {question.checklistItemTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {question.nonConformitiesCount.toLocaleString("pt-BR")} NC em{" "}
                              {question.answersCount.toLocaleString("pt-BR")} respostas (
                              {question.nonConformityRatePercent.toFixed(1).replace(".", ",")}%)
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
                Top não conformidades da equipe selecionada (Top 5)
              </Typography>
              {dateFilterHint}
            </Box>
          </Box>
          <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Box sx={{ mb: 2, maxWidth: 380 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Equipe</InputLabel>
                <Select
                  value={selectedTeamId}
                  label="Equipe"
                  onChange={(event) => onSelectedTeamIdChange(event.target.value)}
                >
                  {teamOptions.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

            {!byTeamLoading && !byTeamError && (!byTeam || byTeam.nonConformities.length === 0) && (
              <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
                <Typography color="text.secondary">
                  {selectedTeamName
                    ? `Nenhuma não conformidade encontrada para ${selectedTeamName} no período selecionado.`
                    : "Selecione uma equipe para visualizar o top 5 de não conformidades."}
                </Typography>
              </Paper>
            )}

            {!byTeamLoading && !byTeamError && byTeam && byTeam.nonConformities.length > 0 && (
              <Paper sx={{ p: 2, border: "1px solid #e2e8f0" }}>
                {byTeam.nonConformities.slice(0, 5).map((item, index) => (
                  <Box
                    key={item.checklistItemId}
                    sx={{ py: 1.2, borderBottom: index < 4 ? "1px solid #e2e8f0" : "none" }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {index + 1}. {item.checklistItemTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.nonConformitiesCount.toLocaleString("pt-BR")} NC em{" "}
                      {item.answersCount.toLocaleString("pt-BR")} respostas (
                      {item.nonConformityRatePercent.toFixed(1).replace(".", ",")}%)
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
