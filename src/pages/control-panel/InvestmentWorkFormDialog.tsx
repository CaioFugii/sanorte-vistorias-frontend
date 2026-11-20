import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Contract, InvestmentWork, InvestmentWorkOrigin, InvestmentWorkStatus, Team } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

function errorText(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const statusLabel: Record<InvestmentWorkStatus, string> = {
  [InvestmentWorkStatus.EM_ANDAMENTO]: "Em andamento",
  [InvestmentWorkStatus.PARALISADA]: "Paralisada",
  [InvestmentWorkStatus.FINALIZADA]: "Finalizada",
  [InvestmentWorkStatus.CANCELADA]: "Cancelada",
};

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function InvestmentWorkFormDialog({
  open,
  work,
  contracts,
  onClose,
  onSaved,
}: {
  open: boolean;
  work: InvestmentWork | null;
  contracts: Array<Pick<Contract, "id" | "name">>;
  onClose: () => void;
  onSaved: () => void;
}): JSX.Element {
  const imported = work?.origin === InvestmentWorkOrigin.IMPORT;
  const [workName, setWorkName] = useState("");
  const [contractId, setContractId] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [expectedEndDate, setExpectedEndDate] = useState(today());
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [service, setService] = useState("");
  const [teamId, setTeamId] = useState("");
  const [pdaTeamName, setPdaTeamName] = useState("");
  const [status, setStatus] = useState<InvestmentWorkStatus>(InvestmentWorkStatus.EM_ANDAMENTO);
  const [active, setActive] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minEnd = useMemo(() => (startDate > today() ? startDate : today()), [startDate]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setWorkName(work?.workName ?? "");
    setContractId(work?.contractId ?? (contracts.length === 1 ? contracts[0].id : ""));
    setStartDate(work?.startDate?.slice(0, 10) ?? today());
    setExpectedEndDate(work?.expectedEndDate?.slice(0, 10) ?? today());
    setAddress(work?.address ?? "");
    setDistrict(work?.district ?? "");
    setService(work?.service ?? "");
    setTeamId(work?.teamId ?? "");
    setPdaTeamName(work?.pdaTeamName ?? "");
    setStatus(work?.status ?? InvestmentWorkStatus.EM_ANDAMENTO);
    setActive(work?.active ?? true);
  }, [contracts, open, work]);

  useEffect(() => {
    if (!open || imported || !contractId) {
      setTeams([]);
      return;
    }
    let cancelled = false;
    void appRepository.getTeams({ page: 1, limit: 100, contractId }).then((result) => {
      if (!cancelled) setTeams(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [contractId, imported, open]);

  const canSave = imported
    ? Boolean(address.trim() && district.trim() && expectedEndDate)
    : Boolean(
        workName.trim() &&
          contractId &&
          startDate &&
          expectedEndDate &&
          address.trim() &&
          district.trim() &&
          service.trim() &&
          teamId
      );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{work ? "Editar obra" : "Nova Obra"}</DialogTitle>
      <DialogContent>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2} mt={1}>
          <TextField label="Nome da Obra" value={workName} onChange={(event) => setWorkName(event.target.value)} disabled={imported} required={!imported} />
          <FormControl required={!imported} disabled={imported || Boolean(work)}>
            <InputLabel>Contrato</InputLabel>
            <Select value={contractId} label="Contrato" onChange={(event) => setContractId(event.target.value)}>
              {contracts.map((contract) => (
                <MenuItem key={contract.id} value={contract.id}>{contract.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {imported ? (
            <TextField label="Setor" value={work?.sector?.name ?? "REPOSICAO"} disabled />
          ) : (
            <TextField type="date" label="Data de início" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} required />
          )}
          <TextField
            type="date"
            label={imported ? "Data de Execução" : "Previsão de término"}
            value={expectedEndDate}
            onChange={(event) => setExpectedEndDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={imported ? undefined : { min: minEnd }}
            required
          />
          <TextField label="Endereço" value={address} onChange={(event) => setAddress(event.target.value)} required />
          <TextField label="Bairro" value={district} onChange={(event) => setDistrict(event.target.value)} required />
          {imported ? (
            <TextField label="Equipe PDA" value={pdaTeamName} onChange={(event) => setPdaTeamName(event.target.value)} />
          ) : (
            <>
              <TextField label="Serviço" value={service} onChange={(event) => setService(event.target.value)} required />
              <FormControl required>
                <InputLabel>Equipe</InputLabel>
                <Select value={teamId} label="Equipe" onChange={(event) => setTeamId(event.target.value)}>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as InvestmentWorkStatus)}>
              {Object.values(InvestmentWorkStatus).map((item) => (
                <MenuItem key={item} value={item}>{statusLabel[item]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Ativa</InputLabel>
            <Select value={active ? "true" : "false"} label="Ativa" onChange={(event) => setActive(event.target.value === "true")}>
              <MenuItem value="true">Sim</MenuItem>
              <MenuItem value="false">Não</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={saving || !canSave}
          onClick={() => {
            if (!imported && expectedEndDate < minEnd) {
              setError("A previsão de término não pode ser anterior à data de início nem à data de hoje.");
              return;
            }
            setSaving(true);
            setError(null);
            const request = imported && work
              ? appRepository.updateInvestmentWork(work.id, {
                  address: address.trim(),
                  district: district.trim(),
                  pdaTeamName: pdaTeamName.trim(),
                  expectedEndDate,
                  status,
                  active,
                })
              : work
                ? appRepository.updateInvestmentWork(work.id, {
                    contractId,
                    workName: workName.trim(),
                    startDate,
                    expectedEndDate,
                    address: address.trim(),
                    district: district.trim(),
                    service: service.trim(),
                    teamId,
                    status,
                    active,
                  })
                : appRepository.createInvestmentWork({
                    contractId,
                    workName: workName.trim(),
                    startDate,
                    expectedEndDate,
                    address: address.trim(),
                    district: district.trim(),
                    service: service.trim(),
                    teamId,
                    status,
                  });
            void request
              .then(() => onSaved())
              .catch((cause: unknown) => {
                setError(errorText(cause, "Não foi possível salvar a obra."));
              })
              .finally(() => setSaving(false));
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
