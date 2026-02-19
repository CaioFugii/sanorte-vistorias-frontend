import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { appRepository } from '@/repositories/AppRepository';
import { PercentBadge } from '@/components/PercentBadge';
import { InspectionStatus, ModuleType } from '@/domain/enums';
import { TeamSelect } from '@/components/TeamSelect';
import { ModuleSelect } from '@/components/ModuleSelect';

export const DashboardPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }>({});
  const [summary, setSummary] = useState({ averagePercent: 0, inspectionsCount: 0, pendingCount: 0 });
  const [teamRanking, setTeamRanking] = useState<Array<{
    teamId: string;
    teamName: string;
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
      setLoading(true);
    if (navigator.onLine) {
      const [summaryData, rankingData] = await Promise.all([
        appRepository.getDashboardSummary(filters),
        appRepository.getDashboardTeamRanking(filters),
      ]);
      setSummary(summaryData);
      setTeamRanking(rankingData);
      setLoading(false);
      return;
    }
    const inspections = await appRepository.listInspections();
    const filtered = inspections.filter((inspection) => {
      if (filters.module && inspection.status === InspectionStatus.RASCUNHO) return true;
      if (filters.teamId && inspection.teamId !== filters.teamId) return false;
      return true;
    });
    const avgBase = filtered.filter((i) => typeof i.scorePercent === 'number');
    const averagePercent =
      avgBase.length > 0
        ? Math.round(avgBase.reduce((sum, i) => sum + (i.scorePercent ?? 0), 0) / avgBase.length)
        : 0;
    setSummary({
      averagePercent,
      inspectionsCount: filtered.length,
      pendingCount: filtered.filter((i) => i.status === InspectionStatus.PENDENTE_AJUSTE).length,
    });
    const teams = await appRepository.getCachedTeams();
    setTeamRanking(
      teams.map((team) => ({
        teamId: team.id,
        teamName: team.name,
        averagePercent: averagePercent,
        inspectionsCount: filtered.filter((i) => i.teamId === team.id).length,
        pendingCount: filtered.filter(
          (i) => i.teamId === team.id && i.status === InspectionStatus.PENDENTE_AJUSTE
        ).length,
      }))
    );
    setLoading(false);
  };

  if (loading && !summary) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data inicial"
              value={filters.from || ""}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value || undefined }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data final"
              value={filters.to || ""}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value || undefined }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModuleSelect
              value={filters.module || ""}
              onChange={(value) => setFilters((prev) => ({ ...prev, module: value }))}
              label="Módulo"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TeamSelect
              value={filters.teamId || ""}
              onChange={(value) => setFilters((prev) => ({ ...prev, teamId: value || undefined }))}
              label="Equipe"
              onlyActive={false}
            />
          </Grid>
        </Grid>
        <Button variant="contained" startIcon={<Search />} onClick={loadDashboardData}>
          Buscar
        </Button>
      </Paper>

      {summary && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Média Geral
                </Typography>
                <PercentBadge percent={summary.averagePercent} size="large" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Serviços Avaliados
                </Typography>
                <Typography variant="h3">{summary.inspectionsCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Pendentes
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {summary.pendingCount}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper>
            <Typography variant="h6" sx={{ p: 2 }}>
              Ranking por Equipes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Equipe</TableCell>
                    <TableCell align="center">Média</TableCell>
                    <TableCell align="center">Qtd Vistorias</TableCell>
                    <TableCell align="center">Pendentes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamRanking.map((team) => (
                    <TableRow key={team.teamId}>
                      <TableCell>{team.teamName}</TableCell>
                      <TableCell align="center">
                        <PercentBadge percent={team.averagePercent} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        {team.inspectionsCount}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={team.pendingCount}
                          color={team.pendingCount > 0 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};
