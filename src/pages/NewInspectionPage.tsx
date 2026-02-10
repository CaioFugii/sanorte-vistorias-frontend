import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ModuleType,
  InspectionStatus,
  Checklist,
} from '@/domain';
import { useRepository } from '@/app/RepositoryProvider';
import { useAuthStore } from '@/stores';
import { useSnackbar } from '@/utils/useSnackbar';
import { ModuleSelect } from '@/components/ModuleSelect';
import { TeamSelect } from '@/components/TeamSelect';
import { CollaboratorsMultiSelect } from '@/components/CollaboratorsMultiSelect';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

export const NewInspectionPage = () => {
  const navigate = useNavigate();
  const repository = useRepository();
  const { user } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState<ModuleType | ''>('');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistId, setChecklistId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [serviceDescription, setServiceDescription] = useState('');
  const [locationDescription, setLocationDescription] = useState('');

  useEffect(() => {
    if (module) {
      loadChecklists();
    } else {
      setChecklists([]);
      setChecklistId('');
    }
  }, [module]);

  const loadChecklists = async () => {
    try {
      const data = await repository.getChecklistsByModule(module as ModuleType);
      setChecklists(data);
    } catch (error) {
      showSnackbar('Erro ao carregar checklists', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!module || !checklistId || !teamId || !serviceDescription.trim()) {
      showSnackbar('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setLoading(true);
      const inspection = await repository.createInspection({
        module: module as ModuleType,
        checklistId,
        teamId,
        serviceDescription,
        locationDescription: locationDescription || undefined,
        collaboratorIds: collaboratorIds.length > 0 ? collaboratorIds : undefined,
        status: InspectionStatus.RASCUNHO,
        scorePercent: 0,
        createdByUserId: user.id,
      });

      showSnackbar('Vistoria criada com sucesso', 'success');
      navigate(`/inspections/${inspection.id}/fill`);
    } catch (error) {
      showSnackbar('Erro ao criar vistoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nova Vistoria
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <ModuleSelect
            value={module}
            onChange={(m) => {
              setModule(m);
              setChecklistId('');
            }}
            required
            disabled={loading}
          />

          <FormControl fullWidth required disabled={loading || !module} sx={{ mt: 2 }}>
            <InputLabel>Checklist</InputLabel>
            <Select
              value={checklistId}
              onChange={(e) => setChecklistId(e.target.value)}
              label="Checklist"
            >
              {checklists.map((checklist) => (
                <MenuItem key={checklist.id} value={checklist.id}>
                  {checklist.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <TeamSelect
              value={teamId}
              onChange={setTeamId}
              required
              disabled={loading}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <CollaboratorsMultiSelect
              value={collaboratorIds}
              onChange={setCollaboratorIds}
              disabled={loading}
            />
          </Box>

          <TextField
            fullWidth
            label="Descrição do Serviço"
            required
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            disabled={loading}
            margin="normal"
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Localização (opcional)"
            value={locationDescription}
            onChange={(e) => setLocationDescription(e.target.value)}
            disabled={loading}
            margin="normal"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inspections')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Criar Vistoria'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
