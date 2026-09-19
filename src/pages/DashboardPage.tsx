import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { Contract, DashboardOverview, UserRole } from "@/domain";
import { PageHeader } from "@/components/ui";
import { ModuleOverviewCard } from "@/pages/dashboard/ModuleOverviewCard";

const QUALITY_COLOR = "#3B6BFF";
const SAFETY_COLOR = "#7ED321";

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastFourMonthsRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth() - 3, 1);
  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

function formatPeriodHint(from: string, to: string): string {
  const format = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" })
      .format(new Date(year, (month || 1) - 1, 1))
      .replace(".", "");
    return label.replace(/^./, (char) => char.toUpperCase());
  };
  return `${format(from)} – ${format(to)}`;
}

export const DashboardPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { hasAnyRole, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === UserRole.ADMIN;
  const availableContracts = user?.contracts ?? [];
  const [adminContracts, setAdminContracts] = useState<Array<Pick<Contract, "id" | "name">>>([]);
  const contractsForFilters = isAdmin ? adminContracts : availableContracts;
  const [selectedContractId, setSelectedContractId] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const period = useMemo(() => getLastFourMonthsRange(), []);

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
    if (
      selectedContractId &&
      contractsForFilters.length > 0 &&
      !contractsForFilters.some((contract) => contract.id === selectedContractId)
    ) {
      setSelectedContractId("");
    }
  }, [contractsForFilters, selectedContractId]);

  useEffect(() => {
    if (!canAccessDashboard) return;

    let cancelled = false;
    const loadOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await appRepository.getDashboardOverview({
          from: period.from,
          to: period.to,
          contractId: selectedContractId || undefined,
        });
        if (!cancelled) setOverview(result);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        setOverview(null);
        setError(
          status === 403
            ? "Você não tem permissão para acessar o dashboard."
            : "Falha ao carregar o dashboard. Tente novamente."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [canAccessDashboard, period, selectedContractId, reloadToken]);

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
            bgcolor: "rgba(255, 255, 255, 0.7)",
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
        actions={
          <FormControl size="small" sx={{ minWidth: 260 }}>
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
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatPeriodHint(period.from, period.to)}
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "error.light" }}>
          <Typography color="error.contrastText" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="inherit"
            size="small"
            onClick={() => setReloadToken((current) => current + 1)}
          >
            Tentar novamente
          </Button>
        </Paper>
      )}

      {!error && overview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ModuleOverviewCard
              title="QUALIDADE"
              color={QUALITY_COLOR}
              data={overview.quality}
              onClick={() => navigate("/quality/analytics")}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ModuleOverviewCard
              title="SEGURANÇA DO TRABALHO"
              color={SAFETY_COLOR}
              data={overview.safetyWork}
              onClick={() => navigate("/safety/analytics")}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
