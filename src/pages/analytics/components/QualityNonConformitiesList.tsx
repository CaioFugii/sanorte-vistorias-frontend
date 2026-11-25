import { ExpandMore, ChevronRight } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { TeamOption } from "./models";

export type QualityNonConformitiesListData = {
  from: string;
  to: string;
  teamId?: string;
  limitPerChecklist: number;
  modules: Array<{
    module: "REMOTO" | "POS_OBRA" | "CAMPO" | "OBRA_SEM_TIPO" | "SEGURANCA_TRABALHO";
    sectors: Array<{
      sectorName: string;
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
    }>;
  }>;
};

const MODULE_LABELS: Record<QualityNonConformitiesListData["modules"][number]["module"], string> = {
  REMOTO: "Remoto",
  POS_OBRA: "Pós-obra",
  CAMPO: "Campo",
  OBRA_SEM_TIPO: "Obra de investimento sem tipo",
  SEGURANCA_TRABALHO: "Segurança do Trabalho",
};

const SECTOR_LABELS: Record<string, string> = {
  AGUA: "Água",
  ESGOTO: "Esgoto",
  REPOSICAO: "Reposição",
  DESOBSTRUCAO: "Desobstrução",
  HIDROMETRIA: "Hidrometria",
};

function normalizeSectorName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function sectorHeading(name: string): string {
  if (!name.trim()) return "SEM SETOR";
  const label = SECTOR_LABELS[normalizeSectorName(name)] ?? name;
  return label.toLocaleUpperCase("pt-BR");
}

function formatRatePercent(rate: number): string {
  const rounded = Math.round(rate * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString("pt-BR")
    : rounded.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatNonConformityCaption(count: number, answers: number, rate: number): string {
  return `Não conforme em ${count.toLocaleString("pt-BR")} de ${answers.toLocaleString("pt-BR")} respostas (${formatRatePercent(rate)}%)`;
}

function formatNonConformityCount(count: number): string {
  return `${count.toLocaleString("pt-BR")} não conformidade${count === 1 ? "" : "s"}`;
}

type QualityNonConformitiesListProps = {
  data: QualityNonConformitiesListData | null;
  loading: boolean;
  error: string | null;
  dateFilterHint?: ReactNode;
  showHeading?: boolean;
  showTeamFilter?: boolean;
  teamOptions?: TeamOption[];
  selectedTeamId?: string;
  onSelectedTeamIdChange?: (teamId: string) => void;
  emptyMessage?: string;
};

export function QualityNonConformitiesList({
  data,
  loading,
  error,
  dateFilterHint,
  showHeading = true,
  showTeamFilter = false,
  teamOptions = [],
  selectedTeamId = "",
  onSelectedTeamIdChange,
  emptyMessage = "Nenhuma não conformidade encontrada para o período selecionado.",
}: QualityNonConformitiesListProps): JSX.Element {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const sortedTeamOptions = [...teamOptions].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );
  const selectedTeam = sortedTeamOptions.find((team) => team.id === selectedTeamId) ?? null;

  useEffect(() => {
    setOpenKeys(new Set());
  }, [data]);

  const toggleChecklist = (key: string) => {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const body = (
    <>
      {showHeading && (
        <Box
          sx={{
            px: 2.5,
            py: 1.7,
            borderBottom: "1px solid #e2e8f0",
          }}
        >
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
              Não conformidades por módulo e setor
            </Typography>
            {dateFilterHint}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Clique no checklist para ver as 5 perguntas com mais não conformidade.
          </Typography>
        </Box>
      )}

      <Box sx={{ p: showHeading ? 2.5 : 0, bgcolor: showHeading ? "#f8fafc" : "transparent" }}>
        {showTeamFilter && (
          <Box sx={{ mb: 2.5, maxWidth: 420 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              Filtrar por equipe
            </Typography>
            <Autocomplete
              options={sortedTeamOptions}
              value={selectedTeam}
              onChange={(_, team) => onSelectedTeamIdChange?.(team?.id ?? "")}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipe"
                  placeholder="Todas as equipes"
                  size="small"
                />
              )}
            />
          </Box>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
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

        {!loading && !error && (!data || data.modules.length === 0) && (
          <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
          </Paper>
        )}

        {!loading && !error && data && data.modules.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.modules.map((module) => (
              <Box key={module.module}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.1,
                    bgcolor: "primary.dark",
                    color: "primary.contrastText",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: 0.4 }}>
                    {MODULE_LABELS[module.module].toLocaleUpperCase("pt-BR")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    bgcolor: "#fff",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  {module.sectors.map((sector) => (
                    <Box key={`${module.module}-${sector.sectorName}`} sx={{ mb: 1.5, "&:last-of-type": { mb: 0 } }}>
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        color="primary.main"
                        sx={{ display: "block", mb: 0.75, letterSpacing: 0.3 }}
                      >
                        {sectorHeading(sector.sectorName)}
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {sector.checklists.map((checklist) => {
                          const key = `${module.module}:${sector.sectorName}:${checklist.checklistId}`;
                          const open = openKeys.has(key);
                          return (
                            <Box key={key}>
                              <Box
                                component="button"
                                type="button"
                                aria-expanded={open}
                                onClick={() => toggleChecklist(key)}
                                sx={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                  textAlign: "left",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: open ? "8px 8px 0 0" : 1,
                                  bgcolor: "#fff",
                                  px: 1.5,
                                  py: 1.15,
                                  cursor: "pointer",
                                  font: "inherit",
                                  color: "inherit",
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                  {open ? (
                                    <ExpandMore fontSize="small" color="action" />
                                  ) : (
                                    <ChevronRight fontSize="small" color="action" />
                                  )}
                                  <Typography variant="body2" fontWeight={800} sx={{ minWidth: 0 }}>
                                    {checklist.checklistName}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ flexShrink: 0 }}
                                >
                                  {formatNonConformityCount(checklist.totalNonConformities)}
                                </Typography>
                              </Box>
                              {open && (
                                <Box
                                  sx={{
                                    border: "1px solid #e2e8f0",
                                    borderTop: "none",
                                    borderRadius: "0 0 8px 8px",
                                    px: 2,
                                    py: 0.5,
                                  }}
                                >
                                  {checklist.questions.map((question, index) => (
                                    <Box
                                      key={question.checklistItemId}
                                      sx={{
                                        py: 1,
                                        borderBottom:
                                          index < checklist.questions.length - 1
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
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );

  if (!showHeading) {
    return <Box>{body}</Box>;
  }

  return <Paper sx={{ p: 0, overflow: "hidden" }}>{body}</Paper>;
}
