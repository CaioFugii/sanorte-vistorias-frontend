import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistSelect } from "@/components/ChecklistSelect";
import { TeamSelect } from "@/components/TeamSelect";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { Collaborator, ModuleType } from "@/domain";
import { ModuleSelect } from "@/components/ModuleSelect";
import { CollaboratorMultiSelect } from "@/components/CollaboratorMultiSelect";
import { useEffect } from "react";

export const NewInspectionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [loadingCollaborators, setLoadingCollaborators] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [module, setModule] = useState<ModuleType>(ModuleType.QUALIDADE);
  const [checklistId, setChecklistId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [serviceDescription, setServiceDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  useEffect(() => {
    const loadCollaborators = async () => {
      setLoadingCollaborators(true);
      try {
        const response = await appRepository.getCollaborators({ page: 1, limit: 100 });
        setCollaborators(response.data.filter((collaborator) => collaborator.active));
      } finally {
        setLoadingCollaborators(false);
      }
    };
    loadCollaborators();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !checklistId || !teamId || !serviceDescription.trim()) {
      return;
    }
    setLoading(true);
    try {
      const inspection = await appRepository.createInspection({
        module,
        checklistId,
        teamId,
        collaboratorIds,
        serviceDescription,
        locationDescription,
        createdByUserId: user.id,
      });
      navigate(`/inspections/${inspection.externalId}/fill`);
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
            onChange={(value) => {
              setModule(value);
              setChecklistId("");
            }}
            required
          />
          <Box sx={{ mt: 2 }}>
            <ChecklistSelect value={checklistId} onChange={setChecklistId} module={module} required />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TeamSelect value={teamId} onChange={setTeamId} required />
          </Box>
          <Box sx={{ mt: 2 }}>
            <CollaboratorMultiSelect
              value={collaboratorIds}
              onChange={setCollaboratorIds}
              collaborators={collaborators}
              disabled={loadingCollaborators}
            />
          </Box>
          <TextField
            fullWidth
            label="Descrição do serviço"
            required
            value={serviceDescription}
            onChange={(event) => setServiceDescription(event.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Localização"
            value={locationDescription}
            onChange={(event) => setLocationDescription(event.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate("/inspections")}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Criar"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
