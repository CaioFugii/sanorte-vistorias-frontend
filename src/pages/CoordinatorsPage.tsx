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
import { Coordinator, PaginatedResponse } from "@/domain";
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

export const CoordinatorsPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<PaginatedResponse<Coordinator> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coordinator | null>(null);
  const [deletingCoordinator, setDeletingCoordinator] = useState<Coordinator | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [contractOptions, setContractOptions] = useState<NamedOption[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appRepository.getCoordinators({ page, limit });
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
        const response = await appRepository.getContracts({ page: 1, limit: 100 });
        setContractOptions(response.data);
      } catch {
        setContractOptions([]);
      }
    };
    void run();
  }, []);

  const coordinators = result?.data ?? [];
  const meta = result?.meta;
  const contractSelectOptions: NamedOption[] = [
    ...contractOptions,
    ...(editing?.contracts ?? []).filter(
      (contract) => !contractOptions.some((option) => option.id === contract.id),
    ),
  ];

  const openCreate = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setSelectedContractIds([]);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (coordinator: Coordinator) => {
    setEditing(coordinator);
    setName(coordinator.name);
    setActive(coordinator.active);
    setSelectedContractIds(coordinator.contracts?.map((contract) => contract.id) ?? []);
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
        title="Coordenadores"
        subtitle="Cadastre coordenadores da hierarquia de campo. Este cadastro não cria usuário nem senha."
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Novo coordenador
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTable title="Lista de coordenadores">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Contratos</TableCell>
              <TableCell>Status</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : coordinators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  Nenhum coordenador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              coordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                  <TableCell>{coordinator.name}</TableCell>
                  <TableCell>{formatContracts(coordinator.contracts)}</TableCell>
                  <TableCell>{coordinator.active ? "Ativo" : "Inativo"}</TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableEditButton onClick={() => openEdit(coordinator)} />
                      <TableDeleteButton onClick={() => setDeletingCoordinator(coordinator)} />
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
        <DialogTitle>{editing ? "Editar coordenador" : "Novo coordenador"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              setFormError(null);
              try {
                const payload = { name: name.trim(), active, contractIds: selectedContractIds };
                if (editing) {
                  await appRepository.updateCoordinator(editing.id, payload);
                } else {
                  await appRepository.createCoordinator(payload);
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
        open={!!deletingCoordinator}
        title="Remover coordenador"
        description={`Deseja remover o coordenador "${deletingCoordinator?.name ?? ""}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingCoordinator(null);
        }}
        onConfirm={async () => {
          if (!deletingCoordinator || deleting) return;
          setDeleting(true);
          setError(null);
          try {
            await appRepository.deleteCoordinator(deletingCoordinator.id);
            setDeletingCoordinator(null);
            await load();
          } catch (deleteError) {
            setDeletingCoordinator(null);
            setError(readApiMessage(deleteError));
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
