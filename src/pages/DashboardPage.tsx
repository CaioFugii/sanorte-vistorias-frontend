import {
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
import {
  Search,
  Clear,
  TrendingUp,
  Assignment,
  Warning,
  ArrowUpward,
  ArrowDownward,
  Schedule,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { appRepository } from '@/repositories/AppRepository';
import { PercentBadge } from '@/components/PercentBadge';
import { useAuthStore } from '@/stores/authStore';
import { Contract, UserRole } from '@/domain';
import { KpiCard, PageHeader } from '@/components/ui';

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    contractId?: string;
  }>(() => ({
    ...getCurrentMonthDateRange(),
    contractId: undefined,
  }));
  const [summary, setSummary] = useState({ averagePercent: 0, inspectionsCount: 0, pendingCount: 0 });

  const canAccessDashboard = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN, UserRole.SUPERVISOR]);

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
      setFilters((prev) => ({ ...prev, contractId: undefined }));
    }
  }, [contractsForFilters, filters.contractId]);

  useEffect(() => {
    if (canAccessDashboard) {
      loadDashboardData();
    }
  }, []);

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
      ...getCurrentMonthDateRange(),
      contractId: contractsForFilters.length === 1 ? contractsForFilters[0].id : undefined,
    };
    setFilters(defaultRange);
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
        title="Gestão de Performance Gerencial"
        subtitle="Acompanhe indicadores, desempenho de equipes e pendências em um painel centralizado."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Contrato</InputLabel>
              <Select
                value={filters.contractId || ''}
                label="Contrato"
                onChange={(e) => {
                  const nextContractId = e.target.value || undefined;
                  setFilters((prev) => ({ ...prev, contractId: nextContractId }));
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
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<TrendingUp color="primary" />}
              label="Média de Qualidade"
              value={<PercentBadge percent={summary.averagePercent} size="large" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<Assignment color="primary" />}
              label="Serviços Avaliados"
              value={
                <Typography variant="h3" sx={{ color: 'primary.dark' }}>
                  {summary.inspectionsCount}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<Warning color="warning" />}
              label="Pendentes de Ajuste"
              tone="warning"
              value={
                <Typography variant="h3" color="warning.main">
                  {summary.pendingCount}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<ArrowUpward color="primary" />}
              label="Faturamento Total"
              value={
                <Typography variant="h3" sx={{ color: 'primary.dark' }}>
                  {formatCurrency(0)}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<ArrowDownward color="primary" />}
              label="Despesa Total"
              value={
                <Typography variant="h3" sx={{ color: 'primary.dark' }}>
                  {formatCurrency(0)}
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard
              icon={<Schedule color="primary" />}
              label="Cronograma"
              value={
                <Typography variant="h3" sx={{ color: 'primary.dark' }}>
                  0%
                </Typography>
              }
            />
          </Grid>
        </Grid>
      )}

    </Box>
  );
};
