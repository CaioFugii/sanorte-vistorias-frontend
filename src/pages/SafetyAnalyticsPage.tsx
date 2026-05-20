import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { Contract, UserRole } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

export function SafetyAnalyticsPage(): JSX.Element {
  const { hasAnyRole, user } = useAuthStore();
  const canAccessAnalytics = hasAnyRole([UserRole.GESTOR, UserRole.ADMIN]);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const initialFilters = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      lowScoreThreshold: 70,
      limit: 15,
    };
  }, []);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof appRepository.getDashboardSafetyWorkLowScoreCollaborators>
  > | null>(null);

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
      setSelectedContractId((current) => current || contractsForFilters[0].id);
    }
  }, [contractsForFilters]);

  const loadData = async (nextFilters: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await appRepository.getDashboardSafetyWorkLowScoreCollaborators({
        ...nextFilters,
        contractId: selectedContractId || undefined,
      });
      setData(result);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? "Você não tem permissão para acessar os gráficos de Segurança do Trabalho."
          : "Falha ao carregar os dados de Segurança do Trabalho."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccessAnalytics) return;
    void loadData(filters);
  }, [canAccessAnalytics, selectedContractId]);

  if (!canAccessAnalytics) {
    return <Navigate to="/inspections/mine" replace />;
  }

  const lowScoreBarMax = Math.max(
    ...(data?.collaborators.map((item) => item.badScoreRatePercent) || [0]),
    100
  );
  const formatPercent = (value: number, digits = 2) =>
    `${value.toFixed(digits).replace(".", ",")}%`;

  return (
    <Box>
      <PageHeader
        eyebrow="Análises avançadas"
        title="Gráficos - Segurança do Trabalho"
        subtitle="Acompanhamento de colaboradores com nota baixa no módulo de Segurança do Trabalho."
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Contrato</InputLabel>
              <Select
                value={selectedContractId}
                label="Contrato"
                onChange={(event) => setSelectedContractId(event.target.value)}
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
      </Paper>

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.7, bgcolor: "#0b158a", color: "#fff" }}>
          <Typography variant="h6" fontWeight={800}>
            Segurança do Trabalho - Colaboradores com Nota Baixa
          </Typography>
        </Box>

        <Box sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="date"
                label="Data inicial"
                value={filters.from}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: filters.to }}
                onChange={(event) => {
                  const from = event.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    from,
                    to: from > prev.to ? from : prev.to,
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="date"
                label="Data final"
                value={filters.to}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: filters.from }}
                onChange={(event) => {
                  const to = event.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    to,
                    from: to < prev.from ? to : prev.from,
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Limiar nota baixa"
                value={filters.lowScoreThreshold}
                inputProps={{ min: 0, max: 100, step: 1 }}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (!Number.isFinite(parsed)) return;
                  setFilters((prev) => ({
                    ...prev,
                    lowScoreThreshold: Math.max(0, Math.min(100, parsed)),
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Limite"
                value={filters.limit}
                inputProps={{ min: 1, max: 100, step: 1 }}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (!Number.isFinite(parsed)) return;
                  setFilters((prev) => ({
                    ...prev,
                    limit: Math.max(1, Math.min(100, parsed)),
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12} md={2} display="flex" alignItems="stretch">
              <Button
                variant="contained"
                onClick={() => void loadData(filters)}
                disabled={loading}
                sx={{ width: "100%", fontWeight: 700 }}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {error && (
            <Paper sx={{ p: 1.5, mb: 2, bgcolor: "error.light" }}>
              <Typography variant="body2" color="error.contrastText">
                {error}
              </Typography>
            </Paper>
          )}

          {!loading && !error && data && data.collaborators.length === 0 && (
            <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px dashed #cbd5e1" }}>
              <Typography color="text.secondary">
                Nenhum colaborador encontrado abaixo do limiar selecionado no período.
              </Typography>
            </Paper>
          )}

          {!loading && !error && data && data.collaborators.length > 0 && (
            <Stack spacing={1.5}>
              {data.collaborators.map((item) => (
                <Paper key={item.collaboratorId} sx={{ p: 1.75, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {item.collaboratorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.badScoresCount} notas ruins em {item.inspectionsCount} inspeções
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="error.main">
                      {formatPercent(item.badScoreRatePercent)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.25, height: 10, borderRadius: 999, bgcolor: "#e2e8f0", overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${(item.badScoreRatePercent / lowScoreBarMax) * 100}%`,
                        bgcolor: "#d32f2f",
                        height: "100%",
                      }}
                    />
                  </Box>

                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Média
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatPercent(item.averagePercent)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Pior nota
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="error.main">
                        {formatPercent(item.worstScorePercent, 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Melhor nota
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {formatPercent(item.bestScorePercent, 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
