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
import {
  CoordinatorsRankingData,
  FieldSupervisorsRankingData,
  ForemenRankingData,
} from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type RankingPerson = {
  id: string;
  name: string;
  averagePercent: number;
  inspectionsCount: number;
  nonConformitiesCount: number;
  pendingAdjustmentsCount: number;
  resolvedCount: number;
};

type RankingSectionConfig = {
  title: string;
  personLabel: string;
  emptyMessage: string;
  people: RankingPerson[];
};

type QualityForemenTabProps = {
  data: ForemenRankingData | null;
  supervisors?: FieldSupervisorsRankingData | null;
  coordinators?: CoordinatorsRankingData | null;
  loading: boolean;
  error: string | null;
  dateFilterHint: ReactNode;
  areaLabel?: string;
};

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function RankingSection({
  section,
  areaLabel,
  dateFilterHint,
}: {
  section: RankingSectionConfig;
  areaLabel: string;
  dateFilterHint: ReactNode;
}): JSX.Element {
  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={CHART_HEADER_SX}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {section.title}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {areaLabel}
            </Typography>
          </Box>
          {dateFilterHint}
        </Box>
      </Box>

      <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        {section.people.length === 0 && (
          <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
            <Typography color="text.secondary">{section.emptyMessage}</Typography>
          </Paper>
        )}

        {section.people.length > 0 && (
          <Paper sx={{ p: 2, mb: 2.5, border: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
              Nota média
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {section.people.map((person) => {
                const barColor = getKpiScoreHighlight(person.averagePercent).textColor;
                const width = Math.min(100, Math.max(0, person.averagePercent));
                return (
                  <Box key={person.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      title={person.name}
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
                      {person.name}
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
                      {formatPercent(person.averagePercent)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {section.people.length > 0 && (
          <Paper sx={{ overflow: "auto", border: "1px solid #e2e8f0" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>{section.personLabel}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Nota média</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Vistorias</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Não conformidades</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Pendências abertas</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Pendências resolvidas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.people.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{person.name}</TableCell>
                    <TableCell align="right">{formatPercent(person.averagePercent)}</TableCell>
                    <TableCell align="right">{person.inspectionsCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{person.nonConformitiesCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{person.pendingAdjustmentsCount.toLocaleString("pt-BR")}</TableCell>
                    <TableCell align="right">{person.resolvedCount.toLocaleString("pt-BR")}</TableCell>
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

export function QualityForemenTab({
  data,
  supervisors,
  coordinators,
  loading,
  error,
  dateFilterHint,
  areaLabel = "Qualidade",
}: QualityForemenTabProps): JSX.Element {
  const sections: RankingSectionConfig[] = [];
  if (coordinators !== undefined) {
    sections.push({
      title: "Resultado por coordenadores",
      personLabel: "Coordenador",
      emptyMessage: "Nenhum resultado de coordenador encontrado para o período selecionado.",
      people: (coordinators?.coordinators ?? []).map((person) => ({
        id: person.id,
        name: person.name,
        averagePercent: person.averagePercent,
        inspectionsCount: person.inspectionsCount,
        nonConformitiesCount: person.nonConformitiesCount,
        pendingAdjustmentsCount: person.pendingAdjustmentsCount,
        resolvedCount: person.resolvedCount,
      })),
    });
  }
  if (supervisors !== undefined) {
    sections.push({
      title: "Resultado por supervisores",
      personLabel: "Supervisor",
      emptyMessage: "Nenhum resultado de supervisor encontrado para o período selecionado.",
      people: (supervisors?.supervisors ?? []).map((person) => ({
        id: person.id,
        name: person.name,
        averagePercent: person.averagePercent,
        inspectionsCount: person.inspectionsCount,
        nonConformitiesCount: person.nonConformitiesCount,
        pendingAdjustmentsCount: person.pendingAdjustmentsCount,
        resolvedCount: person.resolvedCount,
      })),
    });
  }
  sections.push({
    title: "Resultado por encarregados",
    personLabel: "Encarregado",
    emptyMessage: "Nenhum resultado de encarregado encontrado para o período selecionado.",
    people: (data?.foremen ?? []).map((foreman) => ({
      id: foreman.foremanId,
      name: foreman.foremanName,
      averagePercent: foreman.averagePercent,
      inspectionsCount: foreman.inspectionsCount,
      nonConformitiesCount: foreman.nonConformitiesCount,
      pendingAdjustmentsCount: foreman.pendingAdjustmentsCount,
      resolvedCount: foreman.resolvedCount,
    })),
  });

  if (loading) {
    return (
      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 2.5, bgcolor: "#f8fafc", display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 1.5, bgcolor: "error.light" }}>
        <Typography variant="body2" color="error.contrastText">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sections.map((section) => (
        <RankingSection
          key={section.title}
          section={section}
          areaLabel={areaLabel}
          dateFilterHint={dateFilterHint}
        />
      ))}
    </Box>
  );
}
