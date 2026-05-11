import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Visibility } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";
import { Contract, InvestmentWork, InvestmentWorkStatus, PaginatedResponse, Team, UserRole } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_LIMIT = 10;

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateToDisplay(value: string): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

const statusLabel: Record<InvestmentWorkStatus, string> = {
  [InvestmentWorkStatus.EM_ANDAMENTO]: "Em andamento",
  [InvestmentWorkStatus.PARALISADA]: "Paralisada",
  [InvestmentWorkStatus.FINALIZADA]: "Finalizada",
  [InvestmentWorkStatus.CANCELADA]: "Cancelada",
};

type InvestmentWorkInspection = NonNullable<InvestmentWork["inspectionStats"]>["lastInspections"][number];

export const InvestmentWorksPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const detailFrom = `${location.pathname}${location.search}`;
  const { user, hasAnyRole } = useAuthStore();
  const canAccess = hasAnyRole([UserRole.ADMIN, UserRole.GESTOR, UserRole.FISCAL]);
  const canManage = hasAnyRole([UserRole.ADMIN, UserRole.GESTOR]);
  const isAdmin = user?.role === UserRole.ADMIN;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResponse<InvestmentWork> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [contractId, setContractId] = useState("");
  const [status, setStatus] = useState<"" | InvestmentWorkStatus>("");
  const [active, setActive] = useState<"" | "true" | "false">("true");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [monitorDialogOpen, setMonitorDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentWork | null>(null);
  const [deleting, setDeleting] = useState<InvestmentWork | null>(null);
  const [monitoringWork, setMonitoringWork] = useState<InvestmentWork | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [workName, setWorkName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [basin, setBasin] = useState("");
  const [service, setService] = useState("");
  const [teamId, setTeamId] = useState("");
  const [materialNetwork, setMaterialNetwork] = useState("");
  const [singularities, setSingularities] = useState("");
  const [formContractId, setFormContractId] = useState("");
  const [formStatus, setFormStatus] = useState<InvestmentWorkStatus>(InvestmentWorkStatus.EM_ANDAMENTO);
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setWorkName("");
    setStartDate("");
    setExpectedEndDate("");
    setAddress("");
    setDistrict("");
    setBasin("");
    setService("");
    setTeamId("");
    setMaterialNetwork("");
    setSingularities("");
    setFormContractId("");
    setFormStatus(InvestmentWorkStatus.EM_ANDAMENTO);
    setFormActive(true);
    setFormError(null);
  };

  const today = formatDateForInput(new Date());
  const minExpectedEndDate = startDate && startDate > today ? startDate : today;

  const loadReferenceData = async () => {
    const teamsPromise = appRepository.getTeams({ page: 1, limit: 100 });
    if (isAdmin) {
      const [contractsResult, teamsResult] = await Promise.all([
        appRepository.getContracts({ page: 1, limit: 100 }),
        teamsPromise,
      ]);
      setContracts(contractsResult.data);
      setTeams(teamsResult.data.filter((item) => item.active));
      return;
    }
    setContracts((user?.contracts ?? []).map((contract) => ({ id: contract.id, name: contract.name })));
    const teamsResult = await teamsPromise;
    setTeams(teamsResult.data.filter((item) => item.active));
  };

  const loadInvestmentWorks = async () => {
    setLoading(true);
    try {
      const data = await appRepository.getInvestmentWorks({
        page,
        limit,
        search: search.trim() || undefined,
        contractId: contractId || undefined,
        status: status || undefined,
        active: active === "" ? undefined : active === "true",
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    void loadReferenceData();
  }, [canAccess, isAdmin, user?.contracts]);

  useEffect(() => {
    if (!canAccess) return;
    void loadInvestmentWorks();
  }, [canAccess, page, limit, search, contractId, status, active]);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const data = result?.data ?? [];
  const meta = result?.meta;
  const inspectionStats = monitoringWork?.inspectionStats;

  return (
    <Box>
      <PageHeader
        eyebrow="Operação"
        title="Obras de Investimento"
        subtitle="Cadastre, acompanhe e relacione obras de investimento às vistorias."
        actions={
          canManage ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditing(null);
                resetForm();
                setDialogOpen(true);
              }}
            >
              Nova obra
            </Button>
          ) : undefined
        }
      />

      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          label="Buscar"
          placeholder="Nome, endereço, bairro ou serviço"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Contrato</InputLabel>
          <Select value={contractId} label="Contrato" onChange={(event) => setContractId(event.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>
                {contract.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as InvestmentWorkStatus | "")}>
            <MenuItem value="">Todos</MenuItem>
            {Object.values(InvestmentWorkStatus).map((item) => (
              <MenuItem key={item} value={item}>
                {statusLabel[item]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Ativa</InputLabel>
          <Select value={active} label="Ativa" onChange={(event) => setActive(event.target.value as "" | "true" | "false")}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <SectionTable title="Lista de obras">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Obra</TableCell>
              <TableCell>Contrato</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ativa</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Nenhuma obra encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.workName}</TableCell>
                  <TableCell>{item.contract?.name ?? "—"}</TableCell>
                  <TableCell>{item.team?.name ?? "—"}</TableCell>
                  <TableCell>{statusLabel[item.status]}</TableCell>
                  <TableCell>{item.active ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    {formatDateToDisplay(item.startDate)} - {formatDateToDisplay(item.expectedEndDate)}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={async () => {
                        setMonitorDialogOpen(true);
                        setMonitoringWork(null);
                        setMonitorError(null);
                        setMonitorLoading(true);
                        try {
                          const detail = await appRepository.getInvestmentWork(item.id);
                          setMonitoringWork(detail);
                        } catch (error) {
                          setMonitorError(
                            error instanceof Error
                              ? error.message
                              : "Não foi possível carregar o acompanhamento da obra."
                          );
                        } finally {
                          setMonitorLoading(false);
                        }
                      }}
                    >
                      Acompanhar
                    </Button>
                    {canManage && (
                      <>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setEditing(item);
                          setWorkName(item.workName);
                          setStartDate(item.startDate);
                          setExpectedEndDate(item.expectedEndDate);
                          setAddress(item.address);
                          setDistrict(item.district);
                          setBasin(item.basin);
                          setService(item.service);
                          setTeamId(item.teamId);
                          setMaterialNetwork(item.materialNetwork);
                          setSingularities(item.singularities ?? "");
                          setFormContractId(item.contractId);
                          setFormStatus(item.status);
                          setFormActive(item.active);
                          setDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="small" color="error" startIcon={<Delete />} onClick={() => setDeleting(item)}>
                        Excluir
                      </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {meta && meta.total > 0 && (
          <ListPagination
            meta={meta}
            onPageChange={setPage}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            disabled={loading}
          />
        )}
      </SectionTable>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Editar obra de investimento" : "Nova obra de investimento"}</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2} mt={1}>
            <TextField label="Nome da obra" value={workName} onChange={(event) => setWorkName(event.target.value)} required />
            <FormControl required>
              <InputLabel>Contrato</InputLabel>
              <Select value={formContractId} label="Contrato" onChange={(event) => setFormContractId(event.target.value)}>
                {contracts.map((contract) => (
                  <MenuItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField type="date" label="Data de início" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} required />
            <TextField
              type="date"
              label="Previsão de término"
              value={expectedEndDate}
              onChange={(event) => {
                setExpectedEndDate(event.target.value);
                setFormError(null);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: minExpectedEndDate }}
              helperText={`Data mínima: ${new Date(minExpectedEndDate).toLocaleDateString("pt-BR")}`}
              error={Boolean(expectedEndDate && expectedEndDate < minExpectedEndDate)}
              required
            />
            <TextField label="Endereço" value={address} onChange={(event) => setAddress(event.target.value)} required />
            <TextField label="Bairro" value={district} onChange={(event) => setDistrict(event.target.value)} required />
            <TextField label="Bacia" value={basin} onChange={(event) => setBasin(event.target.value)} required />
            <TextField label="Serviço" value={service} onChange={(event) => setService(event.target.value)} required />
            <FormControl required>
              <InputLabel>Equipe</InputLabel>
              <Select value={teamId} label="Equipe" onChange={(event) => setTeamId(event.target.value)}>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Rede material" value={materialNetwork} onChange={(event) => setMaterialNetwork(event.target.value)} required />
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select value={formStatus} label="Status" onChange={(event) => setFormStatus(event.target.value as InvestmentWorkStatus)}>
                {Object.values(InvestmentWorkStatus).map((item) => (
                  <MenuItem key={item} value={item}>
                    {statusLabel[item]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Singularidades"
              value={singularities}
              onChange={(event) => setSingularities(event.target.value)}
              multiline
              minRows={2}
            />
            <FormControl>
              <InputLabel>Ativa</InputLabel>
              <Select value={formActive ? "true" : "false"} label="Ativa" onChange={(event) => setFormActive(event.target.value === "true")}>
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={
              saving ||
              !workName.trim() ||
              !startDate ||
              !expectedEndDate ||
              !address.trim() ||
              !district.trim() ||
              !basin.trim() ||
              !service.trim() ||
              !teamId ||
              !materialNetwork.trim() ||
              !formContractId
            }
            onClick={async () => {
              if (expectedEndDate < minExpectedEndDate) {
                setFormError(
                  "A previsão de término não pode ser anterior à data de hoje nem à data de início."
                );
                return;
              }
              setSaving(true);
              try {
                const payload = {
                  contractId: formContractId,
                  workName: workName.trim(),
                  startDate,
                  expectedEndDate,
                  address: address.trim(),
                  district: district.trim(),
                  basin: basin.trim(),
                  service: service.trim(),
                  teamId,
                  materialNetwork: materialNetwork.trim(),
                  singularities: singularities.trim() || undefined,
                  status: formStatus,
                };
                if (editing) {
                  await appRepository.updateInvestmentWork(editing.id, {
                    ...payload,
                    active: formActive,
                  });
                } else {
                  await appRepository.createInvestmentWork(payload);
                }
                setDialogOpen(false);
                await loadInvestmentWorks();
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={monitorDialogOpen} onClose={() => setMonitorDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Acompanhamento da obra</DialogTitle>
        <DialogContent>
          {monitorLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={28} />
            </Box>
          ) : monitorError ? (
            <Alert severity="error">{monitorError}</Alert>
          ) : !monitoringWork ? (
            <Alert severity="info">Nenhum dado de acompanhamento disponível.</Alert>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                {monitoringWork.workName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {monitoringWork.address}
              </Typography>

              <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }} gap={1.5} mb={2}>
                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total de vistorias
                  </Typography>
                  <Typography variant="h6">{inspectionStats?.total ?? "—"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pendentes
                  </Typography>
                  <Typography variant="h6">{inspectionStats?.pendingTotal ?? "—"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Média (%)
                  </Typography>
                  <Typography variant="h6">
                    {typeof inspectionStats?.averagePercentual === "number"
                      ? `${inspectionStats.averagePercentual.toFixed(2)}%`
                      : "—"}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Média score (%)
                  </Typography>
                  <Typography variant="h6">
                    {typeof inspectionStats?.averageScorePercent === "number"
                      ? `${inspectionStats.averageScorePercent.toFixed(2)}%`
                      : "—"}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Últimas vistorias
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Módulo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(inspectionStats?.lastInspections ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nenhuma vistoria vinculada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (inspectionStats?.lastInspections ?? []).map((inspection: InvestmentWorkInspection) => (
                      <TableRow key={inspection.externalId ?? inspection.id ?? `${inspection.createdAt}-${inspection.status}`}>
                        <TableCell>{inspection.module ?? "—"}</TableCell>
                        <TableCell>{inspection.status ?? "—"}</TableCell>
                        <TableCell>{inspection.serviceDescription ?? "—"}</TableCell>
                        <TableCell>
                          {inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            disabled={!inspection.externalId && !inspection.id}
                            onClick={() => {
                              const inspectionId = inspection.externalId ?? inspection.id;
                              if (!inspectionId) return;
                              setMonitorDialogOpen(false);
                              navigate(`/inspections/${inspectionId}`, {
                                state: { from: detailFrom },
                              });
                            }}
                          >
                            Ver vistoria
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMonitorDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {formError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {formError}
        </Alert>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Excluir obra de investimento"
        description={`Deseja excluir a obra "${deleting?.workName ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deletingLoading}
        onClose={() => {
          if (deletingLoading) return;
          setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting || deletingLoading) return;
          setDeletingLoading(true);
          setDeleteError(null);
          try {
            await appRepository.deleteInvestmentWork(deleting.id);
            setDeleting(null);
            await loadInvestmentWorks();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível excluir a obra.";
            setDeleteError(message);
          } finally {
            setDeletingLoading(false);
          }
        }}
      />

      {deleteError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {deleteError}
        </Alert>
      )}

      {!navigator.onLine && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Obras de investimento só podem ser consultadas e alteradas quando online.
        </Alert>
      )}
    </Box>
  );
};
