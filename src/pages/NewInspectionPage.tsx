import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistSelect } from "@/components/ChecklistSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { ModuleType, ServiceOrder, Team } from "@/domain";
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearchInput, setTeamSearchInput] = useState("");
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [teamSearchLoading, setTeamSearchLoading] = useState(false);
  const [osNumberInput, setOsNumberInput] = useState("");
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [serviceOrderOptions, setServiceOrderOptions] = useState<ServiceOrder[]>([]);
  const [serviceDescription, setServiceDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const osSearchRequestRef = useRef(0);
  const teamSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamSearchRequestRef = useRef(0);

  const MIN_OS_SEARCH_LENGTH = 4;
  const MIN_TEAM_SEARCH_LENGTH = 4;

  useEffect(() => {
    const trimmed = osNumberInput.trim();
    if (trimmed.length < MIN_OS_SEARCH_LENGTH) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setOsSearchLoading(false);
      setServiceOrderOptions(selectedServiceOrder ? [selectedServiceOrder] : []);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++osSearchRequestRef.current;
      setOsSearchLoading(true);
      try {
        const params: {
          osNumber: string;
          page: number;
          limit: number;
          field?: boolean;
          remote?: boolean;
          postWork?: boolean;
        } = { osNumber: trimmed, page: 1, limit: 20 };
        if (module === ModuleType.CAMPO) params.field = false;
        else if (module === ModuleType.REMOTO) params.remote = false;
        else if (module === ModuleType.POS_OBRA) params.postWork = false;

        const result = await appRepository.getServiceOrders(params);
        if (requestId !== osSearchRequestRef.current) return;
        const selectedOptions = selectedServiceOrder ? [selectedServiceOrder] : [];
        setServiceOrderOptions(
          [...selectedOptions, ...result.data].filter(
            (serviceOrder, index, all) =>
              all.findIndex((existing) => existing.id === serviceOrder.id) === index
          )
        );
      } catch {
        if (requestId !== osSearchRequestRef.current) return;
        setServiceOrderOptions(selectedServiceOrder ? [selectedServiceOrder] : []);
      } finally {
        if (requestId === osSearchRequestRef.current) {
          setOsSearchLoading(false);
        }
      }
      debounceRef.current = null;
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [osNumberInput, module, selectedServiceOrder]);

  useEffect(() => {
    const trimmed = teamSearchInput.trim();
    if (trimmed.length < MIN_TEAM_SEARCH_LENGTH) {
      if (teamSearchDebounceRef.current) {
        clearTimeout(teamSearchDebounceRef.current);
        teamSearchDebounceRef.current = null;
      }
      setTeamSearchLoading(false);
      setTeamOptions(selectedTeam && selectedTeam.active ? [selectedTeam] : []);
      return;
    }

    if (teamSearchDebounceRef.current) clearTimeout(teamSearchDebounceRef.current);
    teamSearchDebounceRef.current = setTimeout(async () => {
      const requestId = ++teamSearchRequestRef.current;
      setTeamSearchLoading(true);
      try {
        const result = await appRepository.getTeams({ page: 1, limit: 20, name: trimmed });
        if (requestId !== teamSearchRequestRef.current) return;
        const activeTeams = result.data.filter((team) => team.active);
        const selectedOptions = selectedTeam && selectedTeam.active ? [selectedTeam] : [];
        setTeamOptions(
          [...selectedOptions, ...activeTeams].filter(
            (team, index, all) => all.findIndex((existing) => existing.id === team.id) === index
          )
        );
      } catch {
        if (requestId !== teamSearchRequestRef.current) return;
        setTeamOptions(selectedTeam && selectedTeam.active ? [selectedTeam] : []);
      } finally {
        if (requestId === teamSearchRequestRef.current) {
          setTeamSearchLoading(false);
        }
      }
      teamSearchDebounceRef.current = null;
    }, 400);

    return () => {
      if (teamSearchDebounceRef.current) clearTimeout(teamSearchDebounceRef.current);
    };
  }, [teamSearchInput, selectedTeam]);

  const osNumberError = Boolean(
    osNumberInput.trim().length >= MIN_OS_SEARCH_LENGTH && !osSearchLoading && !selectedServiceOrder
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !checklistId || !teamId || !selectedServiceOrder?.id || !serviceDescription.trim()) {
      return;
    }
    setSubmitLoading(true);
    try {
      const inspection = await appRepository.createInspection({
        module,
        checklistId,
        teamId,
        serviceOrderId: selectedServiceOrder.id,
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
              setSelectedTeam(null);
              setTeamSearchInput("");
              setTeamOptions([]);
              setOsNumberInput("");
              setSelectedServiceOrder(null);
              setServiceOrderOptions([]);
              setServiceDescription("");
              setLocationDescription("");
            }}
            required
          />
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={serviceOrderOptions}
              value={selectedServiceOrder}
              inputValue={osNumberInput}
              onChange={(_, value) => {
                setSelectedServiceOrder(value);
                const nextSectorId = value?.sectorId ?? value?.sector?.id ?? "";
                setSectorId(nextSectorId);
                setChecklistId("");
                setLocationDescription(value?.address ?? "");
                if (value) {
                  setOsNumberInput(value.osNumber);
                }
              }}
              onInputChange={(_, value, reason) => {
                setOsNumberInput(value);
                if (reason === "clear") {
                  setSelectedServiceOrder(null);
                  setServiceOrderOptions([]);
                  setSectorId("");
                  setChecklistId("");
                  setLocationDescription("");
                  return;
                }

                if (reason === "input" && selectedServiceOrder && value !== selectedServiceOrder.osNumber) {
                  setSelectedServiceOrder(null);
                  setSectorId("");
                  setChecklistId("");
                  setLocationDescription("");
                }
              }}
              loading={osSearchLoading}
              filterOptions={(options) => options}
              getOptionLabel={(option) => option.osNumber}
              renderOption={(props, option) => (
                <li {...props}>
                  {option.osNumber} - {option.sector?.name ?? "Setor não informado"}
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={
                osNumberInput.trim().length < MIN_OS_SEARCH_LENGTH
                  ? `Digite pelo menos ${MIN_OS_SEARCH_LENGTH} caracteres`
                  : "Nenhuma OS encontrada"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Número da OS"
                  required
                  placeholder="Digite o número da Ordem de Serviço"
                  error={osNumberError}
                  helperText={
                    osNumberError
                      ? "OS não encontrada. Verifique o número ou importe a OS na página Ordens de Serviço."
                      : osNumberInput.trim().length > 0 && osNumberInput.trim().length < MIN_OS_SEARCH_LENGTH
                        ? `Digite pelo menos ${MIN_OS_SEARCH_LENGTH} caracteres para buscar`
                        : "Selecione uma OS para preencher o setor automaticamente"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {osSearchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <SectorSelect
              value={sectorId}
              onChange={() => undefined}
              label="Setor (definido pela OS)"
              required
              disabled
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <ChecklistSelect
              value={checklistId}
              onChange={setChecklistId}
              module={module}
              sectorId={sectorId}
              disabled={!selectedServiceOrder || !sectorId}
              required
              onLoadingChange={handleChecklistLoadingChange}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={teamOptions}
              value={selectedTeam}
              inputValue={teamSearchInput}
              onChange={(_, value) => {
                setSelectedTeam(value);
                setTeamId(value?.id ?? "");
                if (value) {
                  setTeamSearchInput(value.name);
                }
              }}
              onInputChange={(_, value, reason) => {
                setTeamSearchInput(value);
                if (reason === "clear") {
                  setSelectedTeam(null);
                  setTeamId("");
                  setTeamOptions([]);
                }
              }}
              loading={teamSearchLoading}
              filterOptions={(options) => options}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={
                teamSearchInput.trim().length < MIN_TEAM_SEARCH_LENGTH
                  ? `Digite pelo menos ${MIN_TEAM_SEARCH_LENGTH} caracteres`
                  : "Nenhuma equipe encontrada"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipe"
                  required
                  placeholder="Digite o nome da equipe"
                  helperText="Busque equipes pelo nome"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {teamSearchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
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
