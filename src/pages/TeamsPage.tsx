import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Edit, Refresh } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useReferenceStore } from '@/stores/referenceStore';
import { Collaborator, PaginatedResponse, Team } from '@/domain';
import { appRepository } from '@/repositories/AppRepository';
import { CollaboratorMultiSelect } from '@/components/CollaboratorMultiSelect';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ListPagination } from '@/components/ListPagination';
import { PageHeader, SectionTable } from '@/components/ui';

const DEFAULT_LIMIT = 10;

export const TeamsPage = (): JSX.Element => {
  const refreshFromApi = useReferenceStore((state) => state.refreshFromApi);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResponse<Team> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [isContractor, setIsContractor] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getTeamFormFriendlyError = (error: unknown): string | null => {
    if (!error || typeof error !== "object") return null;
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    const normalized = Array.isArray(message) ? message[0] : message;
    if (typeof normalized !== "string") return null;
    const lower = normalized.toLowerCase();
    if (
      lower.includes("equipe empreiteira não pode ter colaboradores vinculados") ||
      lower.includes("equipe empreiteira não permite vínculo de colaboradores")
    ) {
      return "Equipe empreiteira não pode ter colaboradores. Desmarque a opção ou remova os colaboradores selecionados.";
    }
    return null;
  };

  const loadTeams = async () => {
    setLoading(true);
    const res = await appRepository.getTeams({ page, limit });
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    loadTeams();
  }, [page, limit]);

  useEffect(() => {
    const run = async () => {
      const collaboratorsResponse = await appRepository.getCollaborators({ page: 1, limit: 100 });
      setCollaborators(collaboratorsResponse.data.filter((c) => c.active));
    };
    run();
  }, []);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  const teams = result?.data ?? [];
  const meta = result?.meta;

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
        title="Equipes"
        subtitle="Configure equipes de campo e mantenha o catálogo técnico atualizado."
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refreshFromApi().then(() => loadTeams())}
            >
              Atualizar catálogo
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingTeam(null);
                setName("");
                setActive(true);
                setIsContractor(false);
                setSelectedCollaboratorIds([]);
                setFormError(null);
                setDialogOpen(true);
              }}
            >
              Nova equipe
            </Button>
          </Box>
        }
      />

      <SectionTable title="Lista de equipes">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Colaboradores</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhuma equipe cadastrada.
                </TableCell>
              </TableRow>
            ) : (
            teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.isContractor ? "Empreiteira" : "Própria"}</TableCell>
                <TableCell>
                  {(team.collaboratorIds?.length ?? team.collaborators?.length ?? 0)}
                </TableCell>
                <TableCell>{team.active ? 'Ativa' : 'Inativa'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditingTeam(team);
                      setName(team.name);
                      setActive(team.active);
                      setIsContractor(team.isContractor ?? false);
                      setSelectedCollaboratorIds(
                        team.collaboratorIds ?? team.collaborators?.map((collaborator) => collaborator.id) ?? []
                      );
                      setFormError(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setDeletingTeam(team)}
                  >
                    <Delete />
                  </IconButton>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTeam ? "Editar equipe" : "Nova equipe"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch checked={active} onChange={(e) => setActive(e.target.checked)} />
            }
            label="Ativa"
          />
          <FormControlLabel
            control={
              <Switch
                checked={isContractor}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsContractor(checked);
                  setFormError(null);
                  if (checked) setSelectedCollaboratorIds([]);
                }}
              />
            }
            label="É empreiteira?"
          />
          <Box sx={{ mt: 2 }}>
            <CollaboratorMultiSelect
              value={selectedCollaboratorIds}
              onChange={setSelectedCollaboratorIds}
              collaborators={collaborators}
              label="Colaboradores da equipe"
              disabled={isContractor}
            />
          </Box>
          {isContractor && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Equipes empreiteiras não permitem vínculo de colaboradores.
            </Alert>
          )}
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFormError(null);
              setDialogOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              setFormError(null);
              try {
                if (editingTeam) {
                  await appRepository.updateTeam(editingTeam.id, {
                    name,
                    active,
                    isContractor,
                    collaboratorIds: isContractor ? [] : selectedCollaboratorIds,
                  });
                } else {
                  await appRepository.createTeam({
                    name,
                    active,
                    isContractor,
                    collaboratorIds: isContractor ? [] : selectedCollaboratorIds,
                  });
                }
                setDialogOpen(false);
                await refreshFromApi();
                await loadTeams();
              } catch (error) {
                const friendlyError = getTeamFormFriendlyError(error);
                if (friendlyError) setFormError(friendlyError);
                else throw error;
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
        open={!!deletingTeam}
        title="Remover equipe"
        description={`Deseja remover a equipe "${deletingTeam?.name ?? ""}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingTeam(null);
        }}
        onConfirm={async () => {
          if (!deletingTeam || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteTeam(deletingTeam.id);
            setDeletingTeam(null);
            await refreshFromApi();
            await loadTeams();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
