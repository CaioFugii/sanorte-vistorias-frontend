import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
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
import { ModuleType } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useSnackbar } from '@/utils/useSnackbar';
import { ModuleSelect } from '@/components/ModuleSelect';
import { TeamSelect } from '@/components/TeamSelect';
import { PercentBadge } from '@/components/PercentBadge';

export const DashboardPage = () => {
  const repository = useRepository();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
  }>({});
  const [summary, setSummary] = useState<{
    averagePercent: number;
    inspectionsCount: number;
    pendingCount: number;
  } | null>(null);
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
    try {
      setLoading(true);
      const [summaryData, rankingData] = await Promise.all([
        repository.getDashboardSummary(filters),
        repository.getTeamRanking(filters),
      ]);
      setSummary(summaryData);
      setTeamRanking(rankingData);
    } catch (error) {
      showSnackbar('Erro ao carregar dados do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    loadDashboardData();
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Inicial"
              type="date"
              value={filters.from || ''}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Final"
              type="date"
              value={filters.to || ''}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModuleSelect
              value={filters.module || ''}
              onChange={(module) => handleFilterChange('module', module)}
              label="Módulo"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TeamSelect
              value={filters.teamId || ''}
              onChange={(teamId) => handleFilterChange('teamId', teamId)}
              label="Equipe"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
            >
              Buscar
            </Button>
          </Grid>
        </Grid>
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
