import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Edit, Refresh } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useReferenceStore } from '@/stores/referenceStore';
import { Collaborator, Team } from '@/domain';
import { appRepository } from '@/repositories/AppRepository';
import { CollaboratorMultiSelect } from '@/components/CollaboratorMultiSelect';

export const TeamsPage = (): JSX.Element => {
  const teams = useReferenceStore((state) => state.teams);
  const refreshFromApi = useReferenceStore((state) => state.refreshFromApi);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    const run = async () => {
      await loadCache();
      const collaboratorsResponse = await appRepository.getCollaborators({ page: 1, limit: 100 });
      setCollaborators(collaboratorsResponse.data.filter((collaborator) => collaborator.active));
      setLoading(false);
  };
    run();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Equipes</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refreshFromApi()}
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
              setSelectedCollaboratorIds([]);
              setDialogOpen(true);
            }}
        >
            Nova equipe
        </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Colaboradores</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
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
                      setSelectedCollaboratorIds(
                        team.collaboratorIds ?? team.collaborators?.map((collaborator) => collaborator.id) ?? []
                      );
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={async () => {
                      if (!window.confirm("Deseja remover esta equipe?")) return;
                      await appRepository.deleteTeam(team.id);
                      await refreshFromApi();
                    }}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
          <Box sx={{ mt: 2 }}>
            <CollaboratorMultiSelect
              value={selectedCollaboratorIds}
              onChange={setSelectedCollaboratorIds}
              collaborators={collaborators}
              label="Colaboradores da equipe"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              try {
                if (editingTeam) {
                  await appRepository.updateTeam(editingTeam.id, {
                    name,
                    active,
                    collaboratorIds: selectedCollaboratorIds,
                  });
                } else {
                  await appRepository.createTeam({
                    name,
                    active,
                    collaboratorIds: selectedCollaboratorIds,
                  });
                }
                setDialogOpen(false);
                await refreshFromApi();
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
