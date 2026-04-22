import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Paper,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistSelect } from "@/components/ChecklistSelect";
import { SectorSelect } from "@/components/SectorSelect";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useReferenceStore } from "@/stores/referenceStore";
import { Collaborator, InspectionScope, ModuleType, ServiceOrder, Team } from "@/domain";
import { ModuleSelect } from "@/components/ModuleSelect";

export const NewInspectionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const sectors = useReferenceStore((state) => state.sectors);
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
  const [inspectionScope, setInspectionScope] = useState<InspectionScope>(InspectionScope.TEAM);
  const [collaboratorOptions, setCollaboratorOptions] = useState<Collaborator[]>([]);
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [collaboratorSearchInput, setCollaboratorSearchInput] = useState("");
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");
  const [osNumberInput, setOsNumberInput] = useState("");
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [serviceOrderOptions, setServiceOrderOptions] = useState<ServiceOrder[]>([]);
  const [serviceDescription, setServiceDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const osSearchRequestRef = useRef(0);
  const teamSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamSearchRequestRef = useRef(0);
  const collaboratorSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collaboratorSearchRequestRef = useRef(0);

  const MIN_OS_SEARCH_LENGTH = 4;
  const INITIAL_OS_OPTIONS_LIMIT = 4;
  const MIN_TEAM_SEARCH_LENGTH = 4;
  const MIN_COLLABORATOR_SEARCH_LENGTH = 4;
  const WORK_SAFETY_SECTOR_NAME = "SEGURANCA DO TRABALHO";
  const isWorkSafetyModule = module === ModuleType.SEGURANCA_TRABALHO;
  const serviceOrderRequired = !isWorkSafetyModule;
  const isCollaboratorScope = inspectionScope === InspectionScope.COLLABORATOR;
  const teamRequired = inspectionScope === InspectionScope.TEAM;
  const workSafetySectorId = useMemo(
    () =>
      sectors.find(
        (sector) =>
          sector.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase() === WORK_SAFETY_SECTOR_NAME
      )?.id ?? "",
    [sectors]
  );

  const getInspectionFormFriendlyError = (error: unknown): string | null => {
    if (!error || typeof error !== "object") return null;
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    const normalized = Array.isArray(message) ? message[0] : message;
    if (typeof normalized !== "string") return null;
    const lower = normalized.toLowerCase();
    if (
      lower.includes("equipe empreiteira não pode ter colaboradores vinculados") ||
      lower.includes("equipe empreiteira não permite vínculo de colaboradores")
    ) {
      return "A equipe selecionada é empreiteira e não permite vínculo de colaboradores.";
    }
    return null;
  };

  useEffect(() => {
    if (!isWorkSafetyModule || !workSafetySectorId) return;
    setSectorId((current) => (current === workSafetySectorId ? current : workSafetySectorId));
  }, [isWorkSafetyModule, workSafetySectorId]);

  useEffect(() => {
    if (isWorkSafetyModule) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setOsSearchLoading(false);
      setServiceOrderOptions([]);
      return;
    }

    const trimmed = osNumberInput.trim();
    if (trimmed.length > 0 && trimmed.length < MIN_OS_SEARCH_LENGTH) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setOsSearchLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++osSearchRequestRef.current;
      setOsSearchLoading(true);
      try {
        const params: {
          osNumber?: string;
          page: number;
          limit: number;
          field?: boolean;
          remote?: boolean;
          postWork?: boolean;
        } = {
          page: 1,
          limit: trimmed.length >= MIN_OS_SEARCH_LENGTH ? 20 : INITIAL_OS_OPTIONS_LIMIT,
        };
        if (trimmed.length >= MIN_OS_SEARCH_LENGTH) {
          params.osNumber = trimmed;
        }
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
  }, [isWorkSafetyModule, osNumberInput, module, selectedServiceOrder]);

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

  useEffect(() => {
    if (!isWorkSafetyModule || !isCollaboratorScope) {
      if (collaboratorSearchDebounceRef.current) {
        clearTimeout(collaboratorSearchDebounceRef.current);
        collaboratorSearchDebounceRef.current = null;
      }
      setCollaboratorLoading(false);
      setCollaboratorOptions(selectedCollaborator && selectedCollaborator.active ? [selectedCollaborator] : []);
      return;
    }

    const trimmed = collaboratorSearchInput.trim();
    if (trimmed.length < MIN_COLLABORATOR_SEARCH_LENGTH) {
      if (collaboratorSearchDebounceRef.current) {
        clearTimeout(collaboratorSearchDebounceRef.current);
        collaboratorSearchDebounceRef.current = null;
      }
      setCollaboratorLoading(false);
      setCollaboratorOptions(selectedCollaborator && selectedCollaborator.active ? [selectedCollaborator] : []);
      return;
    }

    if (collaboratorSearchDebounceRef.current) clearTimeout(collaboratorSearchDebounceRef.current);
    collaboratorSearchDebounceRef.current = setTimeout(async () => {
      const requestId = ++collaboratorSearchRequestRef.current;
      setCollaboratorLoading(true);
      try {
        const result = await appRepository.getCollaborators({ page: 1, limit: 20, name: trimmed });
        if (requestId !== collaboratorSearchRequestRef.current) return;
        const activeCollaborators = result.data.filter((collaborator) => collaborator.active);
        const selectedOptions = selectedCollaborator && selectedCollaborator.active ? [selectedCollaborator] : [];
        setCollaboratorOptions(
          [...selectedOptions, ...activeCollaborators].filter(
            (collaborator, index, all) =>
              all.findIndex((existing) => existing.id === collaborator.id) === index
          )
        );
      } catch {
        if (requestId !== collaboratorSearchRequestRef.current) return;
        setCollaboratorOptions(selectedCollaborator && selectedCollaborator.active ? [selectedCollaborator] : []);
      } finally {
        if (requestId === collaboratorSearchRequestRef.current) {
          setCollaboratorLoading(false);
        }
      }
      collaboratorSearchDebounceRef.current = null;
    }, 400);

    return () => {
      if (collaboratorSearchDebounceRef.current) clearTimeout(collaboratorSearchDebounceRef.current);
    };
  }, [isWorkSafetyModule, isCollaboratorScope, collaboratorSearchInput, selectedCollaborator]);

  const osNumberError = Boolean(
    serviceOrderRequired && osNumberInput.trim().length >= MIN_OS_SEARCH_LENGTH && !osSearchLoading && !selectedServiceOrder
  );
  const isRemoteModule = module === ModuleType.REMOTO;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedServiceDescription = isRemoteModule
      ? "Vistoria remota"
      : serviceDescription.trim();
    if (!user || !checklistId || !normalizedServiceDescription) {
      return;
    }
    if (teamRequired && !teamId) {
      setFormError("Selecione uma equipe para vistoria com escopo por equipe.");
      return;
    }
    if (serviceOrderRequired && !selectedServiceOrder?.id) {
      setFormError("Selecione uma OS para criar a vistoria neste módulo.");
      return;
    }
    if (isCollaboratorScope && !selectedCollaboratorId) {
      setFormError("Vistoria por colaborador exige selecionar exatamente 1 colaborador.");
      return;
    }
    setSubmitLoading(true);
    setFormError(null);
    let createdInspectionExternalId: string | null = null;
    try {
      const inspection = await appRepository.createInspection({
        module,
        inspectionScope,
        checklistId,
        ...(teamId ? { teamId } : {}),
        serviceOrderId: selectedServiceOrder?.id,
        collaboratorIds: isCollaboratorScope
          ? [selectedCollaboratorId]
          : selectedTeam?.isContractor
            ? []
            : undefined,
        serviceDescription: normalizedServiceDescription,
        locationDescription,
        createdByUserId: user.id,
      });
      createdInspectionExternalId = inspection.externalId;
    } catch (error) {
      const friendlyError = getInspectionFormFriendlyError(error);
      if (friendlyError) {
        setFormError(friendlyError);
        return;
      }
      throw error;
    } finally {
      setSubmitLoading(false);
    }
    if (createdInspectionExternalId) {
      navigate(`/inspections/${createdInspectionExternalId}/fill`);
    }
  };

  const handleChecklistLoadingChange = useCallback((value: boolean) => {
    setChecklistLoading(value);
  }, []);

  const formatOsValue = (value?: string | number | null): string => {
    if (value === null || value === undefined) return "Não informado";
    const normalized = String(value).trim();
    return normalized ? normalized : "Não informado";
  };

  const formatOsDateTime = (value?: string | null): string => {
    if (!value) return "Não informado";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("pt-BR");
  };

  return (
    <Box>
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" gutterBottom>
        Nova Vistoria
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "flex-start",
          gap: 3,
        }}
      >
        <Paper sx={{ p: 3, width: "100%", flex: 1, maxWidth: { lg: 800 } }}>
          <form onSubmit={handleSubmit}>
            <ModuleSelect
              value={module}
              onChange={(value) => {
                setModule(value);
                setInspectionScope(InspectionScope.TEAM);
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
                setSelectedCollaborator(null);
                setSelectedCollaboratorId("");
                setCollaboratorSearchInput("");
                setCollaboratorOptions([]);
                setFormError(null);
              }}
              required
            />
            {!isWorkSafetyModule && (
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
                    osNumberInput.trim().length === 0
                      ? "Nenhuma OS disponível para este módulo"
                      : osNumberInput.trim().length < MIN_OS_SEARCH_LENGTH
                        ? `Digite pelo menos ${MIN_OS_SEARCH_LENGTH} caracteres`
                        : "Nenhuma OS encontrada"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Número da OS"
                      required={serviceOrderRequired}
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
            )}
            {!isWorkSafetyModule && (
              <Box sx={{ mt: 2 }}>
                <SectorSelect
                  value={sectorId}
                  onChange={(value) => {
                    setSectorId(value);
                    setChecklistId("");
                  }}
                  label={selectedServiceOrder ? "Setor (definido pela OS)" : "Setor"}
                  required
                  disabled={Boolean(selectedServiceOrder) || !isWorkSafetyModule}
                />
              </Box>
            )}
            {isWorkSafetyModule && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth required>
                  <FormLabel id="inspection-scope-label">Escopo da vistoria</FormLabel>
                  <RadioGroup
                    aria-labelledby="inspection-scope-label"
                    value={inspectionScope}
                    onChange={(event) => {
                      const nextScope = event.target.value as InspectionScope;
                      setInspectionScope(nextScope);
                      setChecklistId("");
                      setFormError(null);
                      if (nextScope !== InspectionScope.COLLABORATOR) {
                        setSelectedCollaborator(null);
                        setSelectedCollaboratorId("");
                        setCollaboratorSearchInput("");
                        setCollaboratorOptions([]);
                      }
                    }}
                    row
                  >
                    <FormControlLabel value={InspectionScope.TEAM} control={<Radio />} label="Equipe" />
                    <FormControlLabel
                      value={InspectionScope.COLLABORATOR}
                      control={<Radio />}
                      label="Colaborador"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <ChecklistSelect
                value={checklistId}
                onChange={setChecklistId}
                module={module}
                inspectionScope={inspectionScope}
                sectorId={sectorId}
                disabled={!sectorId && module !== ModuleType.SEGURANCA_TRABALHO}
                required
                onLoadingChange={handleChecklistLoadingChange}
              />
            </Box>
            {!(isWorkSafetyModule && isCollaboratorScope) && (
              <Box sx={{ mt: 2 }}>
                <Autocomplete
                  options={teamOptions}
                  value={selectedTeam}
                  inputValue={teamSearchInput}
                  onChange={(_, value) => {
                    setFormError(null);
                    setSelectedTeam(value);
                    setTeamId(value?.id ?? "");
                    if (value) {
                      setTeamSearchInput(value.name);
                    }
                  }}
                  onInputChange={(_, value, reason) => {
                    setTeamSearchInput(value);
                    setFormError(null);
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
                      required={teamRequired}
                      placeholder="Digite o nome da equipe"
                      helperText={
                        selectedTeam?.isContractor
                          ? "Equipe empreiteira selecionada: colaboradores não serão vinculados."
                          : "Busque equipes pelo nome"
                      }
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
            )}
            {isWorkSafetyModule && isCollaboratorScope && (
              <Box sx={{ mt: 2 }}>
                <Autocomplete
                  options={collaboratorOptions}
                  value={selectedCollaborator}
                  inputValue={collaboratorSearchInput}
                  onChange={(_, value) => {
                    setSelectedCollaborator(value);
                    setSelectedCollaboratorId(value?.id ?? "");
                    setFormError(null);
                    if (value) {
                      setCollaboratorSearchInput(value.name);
                    }
                  }}
                  onInputChange={(_, value, reason) => {
                    setCollaboratorSearchInput(value);
                    setFormError(null);
                    if (reason === "clear") {
                      setSelectedCollaborator(null);
                      setSelectedCollaboratorId("");
                      setCollaboratorOptions([]);
                    }
                  }}
                  loading={collaboratorLoading}
                  filterOptions={(options) => options}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={
                    collaboratorSearchInput.trim().length < MIN_COLLABORATOR_SEARCH_LENGTH
                      ? `Digite pelo menos ${MIN_COLLABORATOR_SEARCH_LENGTH} caracteres`
                      : "Nenhum colaborador encontrado"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Colaborador"
                      required
                      placeholder="Digite o nome do colaborador"
                      helperText="Busque colaboradores pelo nome"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {collaboratorLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            )}
            {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formError}
              </Alert>
            )}
            {!isRemoteModule && (
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
            )}
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

        {!isWorkSafetyModule && selectedServiceOrder ? (
          <Paper
            sx={{
              p: 3,
              width: "100%",
              maxWidth: { xs: "100%", lg: 360 },
            }}
          >
            <Typography variant="h6" gutterBottom>
              Dados da OS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Número:</strong> {formatOsValue(selectedServiceOrder.osNumber)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Setor:</strong> {formatOsValue(selectedServiceOrder.sector?.name)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Endereço:</strong> {formatOsValue(selectedServiceOrder.address)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Status:</strong> {formatOsValue(selectedServiceOrder.status)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Equipe PDA:</strong> {formatOsValue(selectedServiceOrder.equipe)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Tempo de execução:</strong> {formatOsValue(selectedServiceOrder.tempoExecucaoEfetivo)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Resultado:</strong> {formatOsValue(selectedServiceOrder.resultado)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Fim da execução:</strong> {formatOsDateTime(selectedServiceOrder.fimExecucao)}
            </Typography>
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
};
