import {
  Autocomplete,
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
} from '@mui/material';
import { Search, Clear, TrendingUp, Assignment, Warning } from '@mui/icons-material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { appRepository } from '@/repositories/AppRepository';
import { PercentBadge } from '@/components/PercentBadge';
import { ModuleType } from '@/domain/enums';
import { ModuleSelect } from '@/components/ModuleSelect';
import { useAuthStore } from '@/stores/authStore';
import { Contract, Team, UserRole } from '@/domain';
import { KpiCard, PageHeader } from '@/components/ui';

const MIN_TEAM_SEARCH_LENGTH = 4;

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function teamMatchesContract(team: Team, contractId?: string): boolean {
  if (!contractId) return true;
  if (team.contractIds?.includes(contractId)) return true;
  return Boolean(team.contracts?.some((contract) => contract.id === contractId));
}

export const DashboardPage = (): JSX.Element => {
  const { hasAnyRole, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, 'id' | 'name'>>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [filters, setFilters] = useState<{
    from?: string;
    to?: string;
    module?: ModuleType;
    teamId?: string;
    contractId?: string;
  }>(() => ({
    ...getDefaultDateRange(),
    module: undefined,
    teamId: undefined,
    contractId: undefined,
  }));
  const [summary, setSummary] = useState({ averagePercent: 0, inspectionsCount: 0, pendingCount: 0 });
  const [teamFilterSearchInput, setTeamFilterSearchInput] = useState('');
  const [selectedSummaryTeam, setSelectedSummaryTeam] = useState<Team | null>(null);
  const [teamFilterOptions, setTeamFilterOptions] = useState<Team[]>([]);
  const [teamFilterLoading, setTeamFilterLoading] = useState(false);
  const teamFilterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamFilterRequestRef = useRef(0);

  const canAccessDashboard = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminContracts([]);
      return;
    }
    let cancelled = false;
    const loadContracts = async () => {
      try {
        const result = await appRepository.getContracts({ page: 1, limit: 100 });
        if (!cancelled) setAdminContracts(result.data);
      } catch {
        if (!cancelled) setAdminContracts([]);
      }
    };
    void loadContracts();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (contractsForFilters.length === 1) {
      const singleContractId = contractsForFilters[0].id;
      setFilters((prev) => ({
        ...prev,
        contractId: prev.contractId || singleContractId,
      }));
      return;
    }
    if (
      filters.contractId &&
      !contractsForFilters.some((contract) => contract.id === filters.contractId)
    ) {
      setFilters((prev) => ({ ...prev, contractId: undefined, teamId: undefined }));
      setSelectedSummaryTeam(null);
      setTeamFilterSearchInput('');
      setTeamFilterOptions([]);
    }
  }, [contractsForFilters, filters.contractId]);

  useEffect(() => {
    if (canAccessDashboard) {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    const trimmed = teamFilterSearchInput.trim();
    if (trimmed.length < MIN_TEAM_SEARCH_LENGTH) {
      if (teamFilterDebounceRef.current) {
        clearTimeout(teamFilterDebounceRef.current);
        teamFilterDebounceRef.current = null;
      }
      setTeamFilterLoading(false);
      setTeamFilterOptions(selectedSummaryTeam ? [selectedSummaryTeam] : []);
      return;
    }

    if (teamFilterDebounceRef.current) clearTimeout(teamFilterDebounceRef.current);
    teamFilterDebounceRef.current = setTimeout(async () => {
      const requestId = ++teamFilterRequestRef.current;
      setTeamFilterLoading(true);
      try {
        const result = await appRepository.getTeams({
          page: 1,
          limit: 100,
          name: trimmed,
        });
        const filteredByContract = result.data.filter((team) =>
          teamMatchesContract(team, filters.contractId)
        );
        if (requestId !== teamFilterRequestRef.current) return;
        const selectedOptions = selectedSummaryTeam ? [selectedSummaryTeam] : [];
        setTeamFilterOptions(
          [...selectedOptions, ...filteredByContract].filter(
            (team, index, all) => all.findIndex((existing) => existing.id === team.id) === index
          )
        );
      } catch {
        if (requestId !== teamFilterRequestRef.current) return;
        setTeamFilterOptions(selectedSummaryTeam ? [selectedSummaryTeam] : []);
      } finally {
        if (requestId === teamFilterRequestRef.current) {
          setTeamFilterLoading(false);
        }
      }
      teamFilterDebounceRef.current = null;
    }, 400);

    return () => {
      if (teamFilterDebounceRef.current) clearTimeout(teamFilterDebounceRef.current);
    };
  }, [teamFilterSearchInput, selectedSummaryTeam, filters.contractId]);

  const loadDashboardData = async (overrideFilters?: typeof filters) => {
    const effectiveFilters = overrideFilters ?? filters;
    if (!effectiveFilters.from || !effectiveFilters.to) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summaryData = await appRepository.getDashboardSummary(effectiveFilters);
      setSummary(summaryData);
    } catch (err) {
      const message =
        (err as { response?: { status?: number } })?.response?.status === 403
          ? 'Você não tem permissão para acessar o dashboard.'
          : 'Falha ao carregar o dashboard. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const defaultRange = {
      ...getDefaultDateRange(),
      module: undefined as ModuleType | undefined,
      teamId: undefined,
      contractId: undefined,
    };
    setFilters(defaultRange);
    setSelectedSummaryTeam(null);
    setTeamFilterSearchInput('');
    setTeamFilterOptions([]);
    loadDashboardData(defaultRange);
  };

  if (!canAccessDashboard) {
    return <Navigate to="/inspections/mine" replace />;
  }

  return (
    <Box position="relative">
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <PageHeader
        eyebrow="Gestão de performance"
        title="Dashboard Operacional"
        subtitle="Acompanhe indicadores, desempenho de equipes e pendências em um painel centralizado."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              type="date"
              label="Data inicial"
              value={filters.from || ''}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: filters.to || undefined }}
              onChange={(e) => {
                const from = e.target.value || undefined;
                setFilters((prev) => {
                  const next = { ...prev, from };
                  if (from && prev.to && from > prev.to) next.to = from;
                  return next;
                });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              type="date"
              label="Data final"
              value={filters.to || ''}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: filters.from || undefined }}
              onChange={(e) => {
                const to = e.target.value || undefined;
                setFilters((prev) => {
                  const next = { ...prev, to };
                  if (to && prev.from && to < prev.from) next.from = to;
                  return next;
                });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModuleSelect
              value={filters.module || ''}
              onChange={(value) => setFilters((prev) => ({ ...prev, module: value }))}
              label="Módulo"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Contrato</InputLabel>
              <Select
                value={filters.contractId || ''}
                label="Contrato"
                onChange={(e) => {
                  const nextContractId = e.target.value || undefined;
                  setSelectedSummaryTeam(null);
                  setTeamFilterSearchInput('');
                  setTeamFilterOptions([]);
                  setFilters((prev) => ({ ...prev, contractId: nextContractId, teamId: undefined }));
                }}
              >
                <MenuItem value="">
                  <em>Todos os contratos</em>
                </MenuItem>
                {contractsForFilters.map((contract) => (
                  <MenuItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={teamFilterOptions}
              value={selectedSummaryTeam}
              inputValue={teamFilterSearchInput}
              onChange={(_, value) => {
                setSelectedSummaryTeam(value);
                setFilters((prev) => ({ ...prev, teamId: value?.id || undefined }));
                if (value) {
                  setTeamFilterSearchInput(value.name);
                }
              }}
              onInputChange={(_, value, reason) => {
                setTeamFilterSearchInput(value);
                if (reason === 'clear') {
                  setSelectedSummaryTeam(null);
                  setTeamFilterOptions([]);
                  setFilters((prev) => ({ ...prev, teamId: undefined }));
                  return;
                }

                if (reason === 'input' && selectedSummaryTeam && value !== selectedSummaryTeam.name) {
                  setSelectedSummaryTeam(null);
                  setFilters((prev) => ({ ...prev, teamId: undefined }));
                }
              }}
              loading={teamFilterLoading}
              filterOptions={(options) => options}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={
                teamFilterSearchInput.trim().length < MIN_TEAM_SEARCH_LENGTH
                  ? `Digite pelo menos ${MIN_TEAM_SEARCH_LENGTH} caracteres`
                  : 'Nenhuma equipe encontrada'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Equipe (resumo)"
                  placeholder="Digite o nome da equipe"
                  helperText="Busque equipes pelo nome"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {teamFilterLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={() => loadDashboardData()}
            disabled={!filters.from || !filters.to}
          >
            Buscar
          </Button>
          <Button variant="outlined" startIcon={<Clear />} onClick={handleClearFilters}>
            Limpar filtros
          </Button>
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error.contrastText" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" color="inherit" size="small" onClick={() => loadDashboardData()}>
            Tentar novamente
          </Button>
        </Paper>
      )}

      {!error && summary && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<TrendingUp color="primary" />}
                label="Média Geral"
                value={<PercentBadge percent={summary.averagePercent} size="large" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<Assignment color="primary" />}
                label="Serviços Avaliados"
                value={<Typography variant="h3" sx={{ color: 'primary.dark' }}>{summary.inspectionsCount}</Typography>}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                icon={<Warning color="warning" />}
                label="Pendentes de Ajuste"
                tone="warning"
                value={<Typography variant="h3" color="warning.main">{summary.pendingCount}</Typography>}
              />
            </Grid>
          </Grid>
        </>
      )}

    </Box>
  );
};
