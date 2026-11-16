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
import { Foreman, PaginatedResponse } from "@/domain";
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

function readApiMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message[0] ?? "Não foi possível concluir a operação.";
  if (typeof message === "string" && message.trim()) return message;
  return "Não foi possível concluir a operação.";
}

type SupervisorOption = { id: string; name: string };

function formatTeams(foreman: Foreman): string {
  const names = foreman.teams?.map((team) => team.name).filter(Boolean) ?? [];
  return names.length > 0 ? names.join(", ") : "—";
}

function formatSupervisor(foreman: Foreman): string {
  return foreman.fieldSupervisor?.name?.trim() || "—";
}

export const ForemenPage = ({ embedded = false }: { embedded?: boolean }): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<PaginatedResponse<Foreman> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Foreman | null>(null);
  const [deletingForeman, setDeletingForeman] = useState<Foreman | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [selectedFieldSupervisorId, setSelectedFieldSupervisorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appRepository.getForemen({ page, limit });
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
        const response = await appRepository.getFieldSupervisors({
          page: 1,
          limit: 100,
          active: true,
        });
        setSupervisorOptions(response.data);
      } catch {
        setSupervisorOptions([]);
      }
    };
    void run();
  }, []);

  const foremen = result?.data ?? [];
  const meta = result?.meta;

  const openCreate = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setSelectedFieldSupervisorId(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (foreman: Foreman) => {
    setEditing(foreman);
    setName(foreman.name);
    setActive(foreman.active);
    setSelectedFieldSupervisorId(foreman.fieldSupervisorId ?? foreman.fieldSupervisor?.id ?? null);
    setFormError(null);
    setDialogOpen(true);
  };

  const currentSupervisor = editing?.fieldSupervisor;
  const supervisorSelectOptions: SupervisorOption[] =
    currentSupervisor &&
    selectedFieldSupervisorId === currentSupervisor.id &&
    !supervisorOptions.some((option) => option.id === currentSupervisor.id)
      ? [...supervisorOptions, { id: currentSupervisor.id, name: currentSupervisor.name }]
      : supervisorOptions;

  if (!embedded && loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {embedded ? (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Novo encarregado
          </Button>
        </Box>
      ) : (
        <PageHeader
          eyebrow="Administração"
          title="Encarregados"
          subtitle="Cadastre encarregados e acompanhe as equipes vinculadas a cada um."
          actions={
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              Novo encarregado
            </Button>
          }
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTable title="Lista de encarregados">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Supervisor</TableCell>
              <TableCell>Equipes</TableCell>
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
            ) : foremen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhum encarregado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              foremen.map((foreman) => (
                <TableRow key={foreman.id}>
                  <TableCell>{foreman.name}</TableCell>
                  <TableCell>{formatSupervisor(foreman)}</TableCell>
                  <TableCell>{formatTeams(foreman)}</TableCell>
                  <TableCell>{foreman.active ? "Ativo" : "Inativo"}</TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableEditButton onClick={() => openEdit(foreman)} />
                      <TableDeleteButton onClick={() => setDeletingForeman(foreman)} />
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
        <DialogTitle>{editing ? "Editar encarregado" : "Novo encarregado"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Autocomplete
            options={supervisorSelectOptions}
            value={supervisorSelectOptions.find((option) => option.id === selectedFieldSupervisorId) ?? null}
            onChange={(_, selected) => setSelectedFieldSupervisorId(selected?.id ?? null)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} margin="normal" label="Supervisor" placeholder="Sem supervisor" />
            )}
          />
          <FormControlLabel
            control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />}
            label="Ativo"
          />
          {editing && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Equipes vinculadas: {formatTeams(editing)}. O vínculo é alterado no cadastro da equipe.
            </Alert>
          )}
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
                if (editing) {
                  await appRepository.updateForeman(editing.id, {
                    name: name.trim(),
                    active,
                    fieldSupervisorId: selectedFieldSupervisorId,
                  });
                } else {
                  await appRepository.createForeman({
                    name: name.trim(),
                    active,
                    fieldSupervisorId: selectedFieldSupervisorId,
                  });
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
        open={!!deletingForeman}
        title="Remover encarregado"
        description={`Deseja remover o encarregado "${deletingForeman?.name ?? ""}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingForeman(null);
        }}
        onConfirm={async () => {
          if (!deletingForeman || deleting) return;
          setDeleting(true);
          setError(null);
          try {
            await appRepository.deleteForeman(deletingForeman.id);
            setDeletingForeman(null);
            await load();
          } catch (deleteError) {
            setDeletingForeman(null);
            setError(readApiMessage(deleteError));
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
