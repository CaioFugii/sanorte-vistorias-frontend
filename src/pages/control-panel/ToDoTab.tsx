import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { FilterAltOff, Search } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { ListPagination } from "@/components/ListPagination";
import { MonthFilter } from "@/components/MonthFilter";
import { DataCard, PageHeader, SectionTable, TableActionsCell, TableActionsHeaderCell } from "@/components/ui";
import {
  AccessTab,
  Contract,
  ModuleType,
  PaginatedResponse,
  ToDoLine,
  ToDoSummary,
  UserRole,
} from "@/domain";
import { currentMonthKey } from "@/domain/rules/monthPeriod";
import { canSeeTab, onlyToDoPanel } from "@/domain/rules/access-area";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useReferenceStore } from "@/stores/referenceStore";
import { downloadBlob } from "@/utils/downloadBlob";

const DEFAULT_LIMIT = 10;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;

type TriState = "" | "true" | "false";

function toSearchParam(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDay(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDay(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stageLabel(stage: ToDoLine["stage"]): string {
  return stage === "REMOTO" ? "Remoto" : "Pós-obra";
}

function vistoriarPath(line: ToDoLine): string {
  const params = new URLSearchParams({
    from: "a-realizar",
    osNumber: line.osNumber,
  });
  if (line.contractId) params.set("contractId", line.contractId);
  if (line.address) params.set("address", line.address);
  if (line.sectorName) params.set("sectorName", line.sectorName);
  if (line.source === "INVESTMENT_WORK" && line.investmentWorkId) {
    params.set("module", ModuleType.OBRAS_INVESTIMENTO);
    params.set("evaluationModule", "POS_OBRA");
    params.set("investmentWorkId", line.investmentWorkId);
  } else if (line.serviceOrderId) {
    params.set("module", line.stage);
    params.set("serviceOrderId", line.serviceOrderId);
  }
  return `/inspections/new?${params.toString()}`;
}

function StageMark({
  present,
  externalId,
  hideWhenAbsent,
  onOpen,
}: {
  present: boolean | null;
  externalId?: string | null;
  hideWhenAbsent?: boolean;
  onOpen: (externalId: string) => void;
}): JSX.Element | null {
  if (present === null) return null;
  if (!present && hideWhenAbsent) return null;
  const clickable = Boolean(present && externalId);
  return (
    <Chip
      size="small"
      color={present ? "success" : "error"}
      label={present ? "Sim" : "Não"}
      clickable={clickable}
      onClick={clickable ? () => onOpen(externalId as string) : undefined}
    />
  );
}

export function ToDoTab({
  contracts,
}: {
  contracts: Array<Pick<Contract, "id" | "name">>;
}): JSX.Element {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canInspect = canSeeTab(user, AccessTab.CAMPO_NOVA);
  const sectors = useReferenceStore((state) => state.sectors);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const initialContractId = contracts.length === 1 ? contracts[0].id : "";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [osNumber, setOsNumber] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [contractId, setContractId] = useState(initialContractId);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [field, setField] = useState<TriState>("");
  const [remote, setRemote] = useState<TriState>("");
  const [postWork, setPostWork] = useState<TriState>("");
  const [equipe, setEquipe] = useState("");
  const [resultado, setResultado] = useState("");
  const [result, setResult] = useState<PaginatedResponse<ToDoLine> | null>(null);
  const [summary, setSummary] = useState<ToDoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedOsNumber = useDebouncedValue(osNumber, SEARCH_DEBOUNCE_MS);
  const debouncedEquipe = useDebouncedValue(equipe, SEARCH_DEBOUNCE_MS);
  const debouncedResultado = useDebouncedValue(resultado, SEARCH_DEBOUNCE_MS);
  const osNumberFilter = toSearchParam(debouncedOsNumber);
  const equipeFilter = toSearchParam(debouncedEquipe);
  const resultadoFilter = toSearchParam(debouncedResultado);
  const columnCount = 13 + (canInspect ? 1 : 0);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  useEffect(() => {
    if (contracts.length === 1) {
      setContractId((current) => current || contracts[0].id);
    }
  }, [contracts]);

  const filters = useMemo(
    () => ({
      month: monthKey,
      osNumber: osNumberFilter,
      sectorId: sectorId.trim() || undefined,
      contractId: contractId.trim() || undefined,
      field: field === "" ? undefined : field === "true",
      remote: remote === "" ? undefined : remote === "true",
      postWork: postWork === "" ? undefined : postWork === "true",
      equipe: equipeFilter,
      resultado: resultadoFilter,
    }),
    [monthKey, osNumberFilter, sectorId, contractId, field, remote, postWork, equipeFilter, resultadoFilter]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    appRepository
      .getToDo({ ...filters, page, limit })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page, limit]);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    appRepository
      .getToDoSummary(filters)
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const clearFilters = () => {
    setOsNumber("");
    setSectorId("");
    setContractId(initialContractId);
    setMonthKey(currentMonthKey());
    setField("");
    setRemote("");
    setPostWork("");
    setEquipe("");
    setResultado("");
    setPage(1);
  };

  const exportExcel = async () => {
    const file = await appRepository.exportToDoExcel(filters);
    downloadBlob(file.blob, file.filename);
  };

  const meta = result?.meta;
  const data = result?.data ?? [];
  const remoteTitle = summary
    ? `Remoto · ${formatDay(summary.remote.from)} a ${formatDay(summary.remote.to)}`
    : "Remoto";
  const postTitle = summary
    ? `Pós-obra · ${formatDay(summary.postWork.from)} a ${formatDay(summary.postWork.to)}`
    : "Pós-obra";

  return (
    <Box>
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2} mb={2}>
        <DataCard title={remoteTitle}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h4">
              {summary ? formatNumber(summary.remote.count) : "—"}
            </Typography>
          </Box>
        </DataCard>
        <DataCard title={postTitle}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h4">
              {summary ? formatNumber(summary.postWork.count) : "—"}
            </Typography>
          </Box>
        </DataCard>
      </Box>
      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Filtrar por número da OS"
          value={osNumber}
          onChange={(event) => {
            setOsNumber(event.target.value);
            setPage(1);
          }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} /> }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Setor</InputLabel>
          <Select value={sectorId} label="Setor" onChange={(event) => { setSectorId(event.target.value); setPage(1); }}>
            <MenuItem value=""><em>Todos os setores</em></MenuItem>
            {(sectors ?? []).filter((sector) => sector.active).map((sector) => (
              <MenuItem key={sector.id} value={sector.id}>{sector.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Contrato</InputLabel>
          <Select value={contractId} label="Contrato" onChange={(event) => { setContractId(event.target.value); setPage(1); }}>
            <MenuItem value=""><em>Todos os contratos</em></MenuItem>
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>{contract.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <MonthFilter
          value={monthKey}
          onChange={(value) => {
            setMonthKey(value && value <= currentMonthKey() ? value : currentMonthKey());
            setPage(1);
          }}
        />
        <TriFilter label="Campo" value={field} onChange={(value) => { setField(value); setPage(1); }} />
        <TriFilter label="Remoto" value={remote} onChange={(value) => { setRemote(value); setPage(1); }} />
        <TriFilter label="Pós-obra" value={postWork} onChange={(value) => { setPostWork(value); setPage(1); }} />
        <TextField
          size="small"
          label="Equipe PDA"
          placeholder="Buscar equipe"
          value={equipe}
          onChange={(event) => { setEquipe(event.target.value); setPage(1); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          size="small"
          label="Resultado"
          placeholder="Buscar resultado"
          value={resultado}
          onChange={(event) => { setResultado(event.target.value); setPage(1); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />
        <Button variant="outlined" startIcon={<FilterAltOff />} onClick={clearFilters} disabled={loading || !navigator.onLine}>
          Limpar filtros
        </Button>
        <ExportExcelButton onExport={exportExcel} disabled={loading || !navigator.onLine} />
        {meta && <Chip color="primary" label={`Total de itens: ${formatNumber(meta.total)}`} />}
      </Box>
      <SectionTable title="Serviços a realizar">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Número da OS</TableCell>
                <TableCell>Etapa</TableCell>
                <TableCell>Setor</TableCell>
                <TableCell>Endereço</TableCell>
                <TableCell>Campo</TableCell>
                <TableCell>Remota</TableCell>
                <TableCell>Pós-obra</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Equipe PDA</TableCell>
                <TableCell>Fim execução</TableCell>
                <TableCell>Tempo execução efetivo</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Atualizada/Inserida em</TableCell>
                {canInspect && <TableActionsHeaderCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center" sx={{ py: 4 }}>
                    Nenhum serviço a realizar.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((line) => (
                  <TableRow key={`${line.source}-${line.stage}-${line.serviceOrderId ?? line.investmentWorkId}`}>
                    <TableCell>{line.osNumber}</TableCell>
                    <TableCell>{stageLabel(line.stage)}</TableCell>
                    <TableCell>{line.sectorName ?? "—"}</TableCell>
                    <TableCell>{line.address ?? "—"}</TableCell>
                    <TableCell>
                      <StageMark present={line.field} externalId={line.fieldInspectionId} hideWhenAbsent onOpen={(id) => navigate(`/inspections/${id}`)} />
                    </TableCell>
                    <TableCell>
                      <StageMark present={line.remote} externalId={line.remoteInspectionId} onOpen={(id) => navigate(`/inspections/${id}`)} />
                    </TableCell>
                    <TableCell>
                      {line.postWorkRequired ? (
                        <StageMark present={line.postWork} externalId={line.postWorkInspectionId} onOpen={(id) => navigate(`/inspections/${id}`)} />
                      ) : null}
                    </TableCell>
                    <TableCell>{line.status ?? "—"}</TableCell>
                    <TableCell>{line.equipe ?? "—"}</TableCell>
                    <TableCell>{formatWhen(line.fimExecucao)}</TableCell>
                    <TableCell>{line.tempoExecucaoEfetivo ?? "—"}</TableCell>
                    <TableCell>{line.resultado ?? "—"}</TableCell>
                    <TableCell>{formatWhen(line.updatedAt)}</TableCell>
                    {canInspect && (
                      <TableActionsCell>
                        <Button size="small" variant="contained" onClick={() => navigate(vistoriarPath(line))}>
                          Vistoriar
                        </Button>
                      </TableActionsCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {meta && (
          <ListPagination
            meta={meta}
            onPageChange={setPage}
            onRowsPerPageChange={(next) => { setLimit(next); setPage(1); }}
            rowsPerPageOptions={[10, 25, 50]}
            disabled={loading}
          />
        )}
      </SectionTable>
    </Box>
  );
}

function TriFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
}): JSX.Element {
  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(event) => onChange(event.target.value as TriState)}>
        <MenuItem value=""><em>Todos</em></MenuItem>
        <MenuItem value="true">Sim</MenuItem>
        <MenuItem value="false">Não</MenuItem>
      </Select>
    </FormControl>
  );
}

export function ToDoPage(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const contracts = isAdmin ? allContracts : user?.contracts ?? [];

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    appRepository.getContracts({ page: 1, limit: 100 }).then((result) => {
      if (!cancelled) setAllContracts(result.data);
    }).catch(() => {
      if (!cancelled) setAllContracts([]);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (user && !onlyToDoPanel(user)) {
    return <Navigate to="/service-orders?tab=a-realizar" replace />;
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Operação"
        title="À Realizar"
        subtitle="Serviços de Remoto e Pós-obra que ainda não têm vistoria."
      />
      <ToDoTab contracts={contracts} />
    </Box>
  );
}
