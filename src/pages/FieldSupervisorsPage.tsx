import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { FieldSupervisor, PaginatedResponse } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import {
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableDeleteButton,
  TableEditButton,
} from "@/components/ui";

const DEFAULT_LIMIT = 10;

type NamedOption = { id: string; name: string };

function readApiMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message[0] ?? "Não foi possível concluir a operação.";
  if (typeof message === "string" && message.trim()) return message;
  return "Não foi possível concluir a operação.";
}

function formatContracts(contracts?: NamedOption[]): string {
  const names = contracts?.map((contract) => contract.name).filter(Boolean) ?? [];
  return names.length > 0 ? names.join(", ") : "—";
}

export const FieldSupervisorsPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<PaginatedResponse<FieldSupervisor> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldSupervisor | null>(null);
  const [deletingSupervisor, setDeletingSupervisor] = useState<FieldSupervisor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [contractOptions, setContractOptions] = useState<NamedOption[]>([]);
  const [coordinatorOptions, setCoordinatorOptions] = useState<NamedOption[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appRepository.getFieldSupervisors({ page, limit });
      setResult(response);
    } catch (loadError) {
      setError(readApiMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      try {
        const [contractsResponse, coordinatorsResponse] = await Promise.all([
          appRepository.getContracts({ page: 1, limit: 100 }),
          appRepository.getCoordinators({ page: 1, limit: 100, active: true }),
        ]);
        setContractOptions(contractsResponse.data);
        setCoordinatorOptions(coordinatorsResponse.data);
      } catch {
        setContractOptions([]);
        setCoordinatorOptions([]);
      }
    };
    void run();
  }, []);

  const supervisors = result?.data ?? [];
  const meta = result?.meta;
  const contractSelectOptions: NamedOption[] = [
    ...contractOptions,
    ...(editing?.contracts ?? []).filter(
      (contract) => !contractOptions.some((option) => option.id === contract.id),
    ),
  ];
  const currentCoordinator = editing?.coordinator;
  const coordinatorSelectOptions: NamedOption[] =
    currentCoordinator &&
    selectedCoordinatorId === currentCoordinator.id &&
    !coordinatorOptions.some((option) => option.id === currentCoordinator.id)
      ? [...coordinatorOptions, { id: currentCoordinator.id, name: currentCoordinator.name }]
      : coordinatorOptions;

  const openCreate = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setSelectedContractIds([]);
    setSelectedCoordinatorId(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (supervisor: FieldSupervisor) => {
    setEditing(supervisor);
    setName(supervisor.name);
    setActive(supervisor.active);
    setSelectedContractIds(supervisor.contracts?.map((contract) => contract.id) ?? []);
    setSelectedCoordinatorId(supervisor.coordinatorId ?? supervisor.coordinator?.id ?? null);
    setFormError(null);
    setDialogOpen(true);
  };

  if (loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Administração"
        title="Supervisores"
        subtitle="Cadastre supervisores de campo vinculados a um coordenador. Este cadastro não cria usuário nem senha."
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Novo supervisor
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTable title="Lista de supervisores">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Coordenador</TableCell>
              <TableCell>Contratos</TableCell>
              <TableCell>Status</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : supervisors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhum supervisor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              supervisors.map((supervisor) => (
                <TableRow key={supervisor.id}>
                  <TableCell>{supervisor.name}</TableCell>
                  <TableCell>{supervisor.coordinator?.name ?? "—"}</TableCell>
                  <TableCell>{formatContracts(supervisor.contracts)}</TableCell>
                  <TableCell>{supervisor.active ? "Ativo" : "Inativo"}</TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableEditButton onClick={() => openEdit(supervisor)} />
                      <TableDeleteButton onClick={() => setDeletingSupervisor(supervisor)} />
                    </TableActionsGroup>
                  </TableActionsCell>
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
            rowsPerPageOptions={[10, 20, 50, 100]}
            disabled={loading}
          />
        )}
      </SectionTable>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Editar supervisor" : "Novo supervisor"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Autocomplete
            options={coordinatorSelectOptions}
            value={coordinatorSelectOptions.find((option) => option.id === selectedCoordinatorId) ?? null}
            onChange={(_, selected) => setSelectedCoordinatorId(selected?.id ?? null)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} margin="normal" label="Coordenador" placeholder="Selecione o coordenador" />
            )}
          />
          <Autocomplete
            multiple
            options={contractSelectOptions}
            value={contractSelectOptions.filter((contract) => selectedContractIds.includes(contract.id))}
            onChange={(_, selected) => setSelectedContractIds(selected.map((contract) => contract.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} margin="normal" label="Contratos" placeholder="Selecione os contratos" />
            )}
          />
          <FormControlLabel
            control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />}
            label="Ativo"
          />
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !selectedCoordinatorId || saving}
            onClick={async () => {
              if (!selectedCoordinatorId) return;
              setSaving(true);
              setFormError(null);
              try {
                const payload = {
                  name: name.trim(),
                  active,
                  coordinatorId: selectedCoordinatorId,
                  contractIds: selectedContractIds,
                };
                if (editing) {
                  await appRepository.updateFieldSupervisor(editing.id, payload);
                } else {
                  await appRepository.createFieldSupervisor(payload);
                }
                setDialogOpen(false);
                await load();
              } catch (saveError) {
                setFormError(readApiMessage(saveError));
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deletingSupervisor}
        title="Remover supervisor"
        description={`Deseja remover o supervisor "${deletingSupervisor?.name ?? ""}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingSupervisor(null);
        }}
        onConfirm={async () => {
          if (!deletingSupervisor || deleting) return;
          setDeleting(true);
          setError(null);
          try {
            await appRepository.deleteFieldSupervisor(deletingSupervisor.id);
            setDeletingSupervisor(null);
            await load();
          } catch (deleteError) {
            setDeletingSupervisor(null);
            setError(readApiMessage(deleteError));
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
