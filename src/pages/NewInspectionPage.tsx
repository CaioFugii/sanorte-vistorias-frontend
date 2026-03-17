import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistSelect } from "@/components/ChecklistSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { TeamSelect } from "@/components/TeamSelect";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { ModuleType } from "@/domain";
import { ModuleSelect } from "@/components/ModuleSelect";

export const NewInspectionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [osSearchLoading, setOsSearchLoading] = useState(false);
  const loading = submitLoading || checklistLoading || osSearchLoading;
  const [module, setModule] = useState<ModuleType>(ModuleType.CAMPO);
  const [sectorId, setSectorId] = useState("");
  const [checklistId, setChecklistId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [osNumberInput, setOsNumberInput] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_OS_SEARCH_LENGTH = 4;

  useEffect(() => {
    const trimmed = osNumberInput.trim();
    if (!trimmed || !sectorId?.trim() || trimmed.length < MIN_OS_SEARCH_LENGTH) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setServiceOrderId("");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setOsSearchLoading(true);
      try {
        const params: {
          sectorId: string;
          osNumber: string;
          page: number;
          limit: number;
          field?: boolean;
          remote?: boolean;
          postWork?: boolean;
        } = { sectorId, osNumber: trimmed, page: 1, limit: 20 };
        if (module === ModuleType.CAMPO) params.field = false;
        else if (module === ModuleType.REMOTO) params.remote = false;
        else if (module === ModuleType.POS_OBRA) params.postWork = false;

        const result = await appRepository.getServiceOrders(params);
        const so = result.data.find(
          (s) => s.osNumber.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (so) {
          setServiceOrderId(so.id);
          setLocationDescription(so.address ?? "");
        } else {
          setServiceOrderId("");
        }
      } catch {
        setServiceOrderId("");
      } finally {
        setOsSearchLoading(false);
      }
      debounceRef.current = null;
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [osNumberInput, sectorId, module]);

  const osNumberError = Boolean(
    sectorId &&
      osNumberInput.trim().length >= MIN_OS_SEARCH_LENGTH &&
      !osSearchLoading &&
      !serviceOrderId
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !checklistId || !teamId || !serviceOrderId || !serviceDescription.trim()) {
      return;
    }
    setSubmitLoading(true);
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
      setSubmitLoading(false);
    }
  };

  const handleChecklistLoadingChange = useCallback((value: boolean) => {
    setChecklistLoading(value);
  }, []);

  return (
    <Box>
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" gutterBottom>
        Nova Vistoria
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <ModuleSelect
            value={module}
            onChange={(value) => {
              setModule(value);
              setSectorId("");
              setChecklistId("");
              setTeamId("");
              setOsNumberInput("");
              setServiceOrderId("");
              setServiceDescription("");
              setLocationDescription("");
            }}
            required
          />
          <Box sx={{ mt: 2 }}>
            <SectorSelect
              value={sectorId}
              onChange={(value) => {
                setSectorId(value);
                setChecklistId("");
                setOsNumberInput("");
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
              onLoadingChange={handleChecklistLoadingChange}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TeamSelect value={teamId} onChange={setTeamId} required />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth required error={osNumberError} disabled={!sectorId}>
              <TextField
                label="Número da OS"
                value={osNumberInput}
                onChange={(event) => setOsNumberInput(event.target.value)}
                placeholder="Digite o número da Ordem de Serviço"
                error={osNumberError}
                helperText={
                  osNumberError
                    ? "OS não encontrada no setor selecionado. Verifique o número ou importe a OS na página Ordens de Serviço."
                    : osNumberInput.trim().length > 0 && osNumberInput.trim().length < MIN_OS_SEARCH_LENGTH
                      ? `Digite pelo menos ${MIN_OS_SEARCH_LENGTH} caracteres para buscar`
                      : undefined
                }
              />
            </FormControl>
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
            <Button variant="outlined" onClick={() => navigate("/inspections/mine")}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {submitLoading ? <CircularProgress size={20} /> : "Criar"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
