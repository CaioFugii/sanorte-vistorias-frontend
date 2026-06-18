import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import { DashboardTeamRankingMetric } from "@/api/repositories/ApiRepository";
import { ListPagination } from "@/components/ListPagination";
import { PercentBadge } from "@/components/PercentBadge";
import { Dispatch, ReactNode, SetStateAction } from "react";
import {
  TeamRankingInspectionItem,
  TeamRankingInspectionsMeta,
  TeamRankingOrderBy,
  TeamRankingQualityRow,
} from "./models";

const CHART_HEADER_SX = {
  px: 2.5,
  py: 1.7,
  bgcolor: "transparent",
  borderBottom: "1px solid #e2e8f0",
};

type QualityRankingTabProps = {
  teamRankingQuality: TeamRankingQualityRow[];
  rankingOrderBy: TeamRankingOrderBy;
  rankingOrder: "asc" | "desc";
  setRankingOrderBy: Dispatch<SetStateAction<TeamRankingOrderBy>>;
  setRankingOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  sortedTeamRankingQuality: TeamRankingQualityRow[];
  rankingInspectionsOpen: boolean;
  setRankingInspectionsOpen: Dispatch<SetStateAction<boolean>>;
  rankingInspectionsLoading: boolean;
  rankingInspectionsError: string | null;
  rankingInspectionsItems: TeamRankingInspectionItem[];
  rankingInspectionsMeta: TeamRankingInspectionsMeta;
  openRankingInspections: (
    teamId: string,
    teamName: string,
    metric: DashboardTeamRankingMetric,
    page?: number,
    limit?: number
  ) => Promise<void>;
  formatDateTime: (value: string | null) => string;
  setRankingInspectionsMeta: Dispatch<SetStateAction<TeamRankingInspectionsMeta>>;
  dateFilterHint: ReactNode;
};

export function QualityRankingTab({
  teamRankingQuality,
  rankingOrderBy,
  rankingOrder,
  setRankingOrderBy,
  setRankingOrder,
  sortedTeamRankingQuality,
  rankingInspectionsOpen,
  setRankingInspectionsOpen,
  rankingInspectionsLoading,
  rankingInspectionsError,
  rankingInspectionsItems,
  rankingInspectionsMeta,
  openRankingInspections,
  formatDateTime,
  setRankingInspectionsMeta,
  dateFilterHint,
}: QualityRankingTabProps): JSX.Element {
  return (
    <>
      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={CHART_HEADER_SX}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6" fontWeight={800}>
              Ranking por Equipes - Qualidade
            </Typography>
            {dateFilterHint}
          </Box>
        </Box>

        <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
          {teamRankingQuality.length === 0 ? (
            <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
              <Typography color="text.secondary">
                Nenhum dado de ranking encontrado para o período selecionado.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Equipe</TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={rankingOrderBy === "average"}
                        direction={rankingOrderBy === "average" ? rankingOrder : "desc"}
                        onClick={() => {
                          if (rankingOrderBy === "average") {
                            setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                          } else {
                            setRankingOrderBy("average");
                            setRankingOrder("desc");
                          }
                        }}
                      >
                        Média
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={rankingOrderBy === "field"}
                        direction={rankingOrderBy === "field" ? rankingOrder : "desc"}
                        onClick={() => {
                          if (rankingOrderBy === "field") {
                            setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                          } else {
                            setRankingOrderBy("field");
                            setRankingOrder("desc");
                          }
                        }}
                      >
                        Campo
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={rankingOrderBy === "remote"}
                        direction={rankingOrderBy === "remote" ? rankingOrder : "desc"}
                        onClick={() => {
                          if (rankingOrderBy === "remote") {
                            setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                          } else {
                            setRankingOrderBy("remote");
                            setRankingOrder("desc");
                          }
                        }}
                      >
                        Remoto
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={rankingOrderBy === "postWork"}
                        direction={rankingOrderBy === "postWork" ? rankingOrder : "desc"}
                        onClick={() => {
                          if (rankingOrderBy === "postWork") {
                            setRankingOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                          } else {
                            setRankingOrderBy("postWork");
                            setRankingOrder("desc");
                          }
                        }}
                      >
                        Pós-obra
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Pendentes</TableCell>
                    <TableCell align="center">Qtd Vistorias</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedTeamRankingQuality.map((team) => (
                    <TableRow key={team.teamId} hover>
                      <TableCell>{team.teamName}</TableCell>
                      <TableCell align="center">
                        <PercentBadge percent={team.averagePercent} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver vistorias da métrica">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => void openRankingInspections(team.teamId, team.teamName, "field")}
                          >
                            <PercentBadge percent={team.fieldPercent} size="small" />
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver vistorias da métrica">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => void openRankingInspections(team.teamId, team.teamName, "remote")}
                          >
                            <PercentBadge percent={team.remotePercent} size="small" />
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver vistorias da métrica">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => void openRankingInspections(team.teamId, team.teamName, "postWork")}
                          >
                            <PercentBadge percent={team.postWorkPercent} size="small" />
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">{team.pendingCount}</TableCell>
                      <TableCell align="center">{team.inspectionsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Paper>

      <Dialog open={rankingInspectionsOpen} onClose={() => setRankingInspectionsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {rankingInspectionsMeta.teamName
            ? `Equipe: ${rankingInspectionsMeta.teamName}`
            : "Vistorias da métrica"}
          <IconButton onClick={() => setRankingInspectionsOpen(false)} size="small" aria-label="Fechar">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {rankingInspectionsLoading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          {rankingInspectionsError && !rankingInspectionsLoading && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {rankingInspectionsError}
            </Typography>
          )}
          {!rankingInspectionsLoading && !rankingInspectionsError && (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>OS</TableCell>
                    <TableCell>Endereço</TableCell>
                    <TableCell>Módulo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Nota</TableCell>
                    <TableCell>Data da Execução da Ordem de serviço</TableCell>
                    <TableCell>Criada em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankingInspectionsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          Nenhuma vistoria encontrada para os filtros selecionados.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankingInspectionsItems.map((inspection) => (
                      <TableRow key={inspection.inspectionId}>
                        <TableCell>{inspection.serviceOrderNumber || "-"}</TableCell>
                        <TableCell>{inspection.serviceOrderAddress || "-"}</TableCell>
                        <TableCell>{inspection.module}</TableCell>
                        <TableCell>{inspection.status}</TableCell>
                        <TableCell align="center">
                          <PercentBadge percent={inspection.scorePercent} size="small" />
                        </TableCell>
                        <TableCell>{formatDateTime(inspection.finishedAt)}</TableCell>
                        <TableCell>{formatDateTime(inspection.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {rankingInspectionsMeta.total > 0 && (
                <ListPagination
                  meta={rankingInspectionsMeta}
                  onPageChange={(page) =>
                    void openRankingInspections(
                      rankingInspectionsMeta.teamId,
                      rankingInspectionsMeta.teamName,
                      rankingInspectionsMeta.metric,
                      page
                    )
                  }
                  onRowsPerPageChange={(newLimit) => {
                    setRankingInspectionsMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                    void openRankingInspections(
                      rankingInspectionsMeta.teamId,
                      rankingInspectionsMeta.teamName,
                      rankingInspectionsMeta.metric,
                      1,
                      newLimit
                    );
                  }}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  disabled={rankingInspectionsLoading}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
