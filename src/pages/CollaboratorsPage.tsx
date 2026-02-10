import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Collaborator } from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useSnackbar } from '@/utils/useSnackbar';

export const CollaboratorsPage = () => {
  const repository = useRepository();
  const { showSnackbar } = useSnackbar();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  useEffect(() => {
    loadCollaborators();
  }, []);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const response = await repository.getCollaborators({ limit: 100 }); // Buscar até 100 colaboradores
      setCollaborators(response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar colaboradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (collaborator?: Collaborator) => {
    if (collaborator) {
      setEditingCollaborator(collaborator);
      setFormData({ name: collaborator.name, active: collaborator.active });
    } else {
      setEditingCollaborator(null);
      setFormData({ name: '', active: true });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCollaborator(null);
  };

  const handleSave = async () => {
    try {
      if (editingCollaborator) {
        await repository.updateCollaborator(
          editingCollaborator.id,
          formData
        );
        showSnackbar('Colaborador atualizado com sucesso', 'success');
      } else {
        await repository.createCollaborator(formData);
        showSnackbar('Colaborador criado com sucesso', 'success');
      }
      handleCloseDialog();
      loadCollaborators();
    } catch (error) {
      showSnackbar('Erro ao salvar colaborador', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        await repository.deleteCollaborator(id);
        showSnackbar('Colaborador excluído com sucesso', 'success');
        loadCollaborators();
      } catch (error) {
        showSnackbar('Erro ao excluir colaborador', 'error');
      }
    }
  };

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
        <Typography variant="h4">Colaboradores</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Colaborador
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collaborators.map((collaborator) => (
              <TableRow key={collaborator.id}>
                <TableCell>{collaborator.name}</TableCell>
                <TableCell>
                  {collaborator.active ? 'Ativo' : 'Inativo'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(collaborator)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(collaborator.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
            }
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
