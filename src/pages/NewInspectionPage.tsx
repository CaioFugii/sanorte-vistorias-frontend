import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistSelect } from "@/components/ChecklistSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { ServiceOrderSelect } from "@/components/ServiceOrderSelect";
import { TeamSelect } from "@/components/TeamSelect";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { ModuleType } from "@/domain";
import { ModuleSelect } from "@/components/ModuleSelect";
import { useReferenceStore } from "@/stores/referenceStore";

export const NewInspectionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const serviceOrders = useReferenceStore((state) => state.serviceOrders);
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState<ModuleType>(ModuleType.CAMPO);
  const [sectorId, setSectorId] = useState("");
  const [checklistId, setChecklistId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  useEffect(() => {
    if (!serviceOrderId) return;
    const so = serviceOrders.find((s) => s.id === serviceOrderId);
    setLocationDescription(so?.address ?? "");
  }, [serviceOrderId, serviceOrders]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !checklistId || !teamId || !serviceOrderId || !serviceDescription.trim()) {
      return;
    }
    setLoading(true);
    try {
      const inspection = await appRepository.createInspection({
        module,
        checklistId,
        teamId,
        serviceOrderId,
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
            <SectorSelect
              value={sectorId}
              onChange={(value) => {
                setSectorId(value);
                setChecklistId("");
                setServiceOrderId("");
                setLocationDescription("");
              }}
              required
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <ChecklistSelect
              value={checklistId}
              onChange={setChecklistId}
              module={module}
              sectorId={sectorId}
              disabled={!sectorId}
              required
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TeamSelect value={teamId} onChange={setTeamId} required />
          </Box>
          {sectorId && serviceOrders.length === 0 && navigator.onLine && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhuma Ordem de Serviço cadastrada para este setor. Administradores e gestores podem importar OS via Excel
              na página &quot;Ordens de Serviço&quot;.
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <ServiceOrderSelect
              value={serviceOrderId}
              onChange={setServiceOrderId}
              sectorId={sectorId || undefined}
              required
              disabled={!sectorId}
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
