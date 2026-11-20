import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { CloudUpload, FilterAltOff, Search } from "@mui/icons-material";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { downloadBlob } from "@/utils/downloadBlob";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QualityInspectionsTab } from "@/pages/analytics/components/QualityInspectionsTab";
import { appRepository } from "@/repositories/AppRepository";
import { useReferenceStore } from "@/stores/referenceStore";
import { AccessArea, Contract, PaginatedResponse, ServiceOrder, ServiceOrderImportResult, ServiceOrderStageSummary, UserRole } from "@/domain";
import { canAreaAction } from "@/domain/rules/access-area";
import { ServiceOrderImportHistory } from "@/pages/ServiceOrderImportHistory";
import { ListPagination } from "@/components/ListPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  DataCard,
  PageHeader,
  SectionTable,
  TableActionsCell,
  TableActionsGroup,
  TableActionsHeaderCell,
  TableDeleteButton,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { MonthFilter } from "@/components/MonthFilter";
import { currentMonthKey, formatMonthKeyLabel, monthKeyToRange, shiftMonthKey } from "@/domain/rules/monthPeriod";

const DEFAULT_LIMIT = 10;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;

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

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function deleteConfirmation(orderCount: number, inspectionCount: number): string {
  const orders = orderCount === 1 ? "1 ordem de serviço" : `${orderCount} ordens de serviço`;
  const inspections = inspectionCount === 1 ? "1 vistoria" : `${inspectionCount} vistorias`;
  const verb = orderCount === 1 ? "Será excluída" : "Serão excluídas";
  return `${verb} ${orders} e ${inspections}. Esta ação não pode ser desfeita.`;
}

function errorText(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

type SelectedServiceOrder = { id: string; inspectionCount: number };

function monthCardLabel(monthKey: string): string {
  const label = formatMonthKeyLabel(monthKey);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const TABLE_COLUMN_COUNT = 12;

function ServiceOrderTableHead({
  showActions,
  allSelected,
  someSelected,
  onTogglePage,
}: {
  showActions: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onTogglePage: (checked: boolean) => void;
}): JSX.Element {
  return (
    <TableRow>
      {showActions && (
        <TableCell padding="checkbox">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={(event) => onTogglePage(event.target.checked)}
            inputProps={{ "aria-label": "Selecionar as OS desta página" }}
          />
        </TableCell>
      )}
      <TableCell>Número da OS</TableCell>
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
      {showActions && <TableActionsHeaderCell />}
    </TableRow>
  );
}

interface ListagemTabProps {
  contracts: Array<Pick<Contract, "id" | "name">>;
  isAdmin: boolean;
}

function StageMark({
  present,
  externalId,
  hideWhenAbsent,
  onOpen,
}: {
  present?: boolean;
  externalId?: string | null;
  hideWhenAbsent?: boolean;
  onOpen: (externalId: string) => void;
}): JSX.Element | null {
  if (!present && hideWhenAbsent) return null;
  const clickable = Boolean(present && externalId);
  return (
    <Chip
      size="small"
      color={present ? "success" : "error"}
      label={present ? "Sim" : "Não"}
      clickable={clickable}
      onClick={clickable ? () => onOpen(externalId as string) : undefined}
      sx={clickable ? { cursor: "pointer" } : undefined}
    />
  );
}

function ListagemTab({ contracts, isAdmin }: ListagemTabProps): JSX.Element {
  const navigate = useNavigate();
  const openInspection = (externalId: string) => {
    navigate(`/inspections/${externalId}`, { state: { from: "/service-orders" } });
  };
  const initialContractId = contracts.length === 1 ? contracts[0].id : "";
  const sectors = useReferenceStore((state) => state.sectors);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [osNumber, setOsNumber] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [contractId, setContractId] = useState(initialContractId);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const { from, to } = useMemo(() => monthKeyToRange(monthKey), [monthKey]);
  const [field, setField] = useState<"" | "true" | "false">("");
  const [remote, setRemote] = useState<"" | "true" | "false">("");
  const [postWork, setPostWork] = useState<"" | "true" | "false">("");
  const [equipe, setEquipe] = useState("");
  const [resultado, setResultado] = useState("");
  const [result, setResult] = useState<PaginatedResponse<ServiceOrder> | null>(null);
  const [summary, setSummary] = useState<ServiceOrderStageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Record<string, SelectedServiceOrder>>({});
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; inspectionCount: number } | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const tableColumnCount = TABLE_COLUMN_COUNT + (isAdmin ? 2 : 0);
  const debouncedOsNumber = useDebouncedValue(osNumber, SEARCH_DEBOUNCE_MS);
  const debouncedEquipe = useDebouncedValue(equipe, SEARCH_DEBOUNCE_MS);
  const debouncedResultado = useDebouncedValue(resultado, SEARCH_DEBOUNCE_MS);
  const osNumberFilter = toSearchParam(debouncedOsNumber);
  const equipeFilter = toSearchParam(debouncedEquipe);
  const resultadoFilter = toSearchParam(debouncedResultado);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  useEffect(() => {
    if (contracts.length === 1) {
      setContractId((current) => current || contracts[0].id);
    }
  }, [contracts]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    appRepository
      .getServiceOrders({
        page,
        limit,
        osNumber: osNumberFilter,
        sectorId: sectorId.trim() || undefined,
        contractId: contractId.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        field: field === "" ? undefined : field === "true",
        remote: remote === "" ? undefined : remote === "true",
        postWork: postWork === "" ? undefined : postWork === "true",
        equipe: equipeFilter,
        resultado: resultadoFilter,
      })
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
  }, [page, limit, osNumberFilter, sectorId, contractId, from, to, field, remote, postWork, equipeFilter, resultadoFilter, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    appRepository
      .getServiceOrderSummary({
        osNumber: osNumberFilter,
        sectorId: sectorId.trim() || undefined,
        contractId: contractId.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        field: field === "" ? undefined : field === "true",
        remote: remote === "" ? undefined : remote === "true",
        postWork: postWork === "" ? undefined : postWork === "true",
        equipe: equipeFilter,
        resultado: resultadoFilter,
      })
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [osNumberFilter, sectorId, contractId, from, to, field, remote, postWork, equipeFilter, resultadoFilter, refreshKey]);

  const handleSearch = (value: string) => {
    setOsNumber(value);
    setPage(1);
  };

  const handleSectorChange = (value: string) => {
    setSectorId(value);
    setPage(1);
  };

  const handleContractChange = (value: string) => {
    setContractId(value);
    setPage(1);
  };

  const handleMonthChange = (value: string | null) => {
    setMonthKey(value && value <= currentMonthKey() ? value : currentMonthKey());
    setPage(1);
  };

  const handleModuleFilter = (
    key: "field" | "remote" | "postWork",
    value: "" | "true" | "false"
  ) => {
    if (key === "field") setField(value);
    if (key === "remote") setRemote(value);
    if (key === "postWork") setPostWork(value);
    setPage(1);
  };

  const handleClearFilters = () => {
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

  const handleExportServiceOrders = async () => {
    const { blob, filename } = await appRepository.exportServiceOrdersExcel({
      osNumber: osNumberFilter,
      sectorId: sectorId.trim() || undefined,
      contractId: contractId.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      field: field === "" ? undefined : field === "true",
      remote: remote === "" ? undefined : remote === "true",
      postWork: postWork === "" ? undefined : postWork === "true",
      equipe: equipeFilter,
      resultado: resultadoFilter,
    });
    downloadBlob(blob, filename);
  };

  const meta = result?.meta;
  const data = result?.data ?? [];
  const selectedCount = Object.keys(selected).length;
  const selectedOnPage = data.filter((row) => selected[row.id]).length;
  const allPageSelected = data.length > 0 && selectedOnPage === data.length;
  const somePageSelected = selectedOnPage > 0 && !allPageSelected;

  const toggleRow = (row: ServiceOrder) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = { id: row.id, inspectionCount: row.inspectionCount ?? 0 };
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelected((current) => {
      const next = { ...current };
      for (const row of data) {
        if (checked) next[row.id] = { id: row.id, inspectionCount: row.inspectionCount ?? 0 };
        else delete next[row.id];
      }
      return next;
    });
  };

  const openBulkDelete = () => {
    const rows = Object.values(selected);
    if (!rows.length) return;
    setPendingDelete({
      ids: rows.map((row) => row.id),
      inspectionCount: rows.reduce((sum, row) => sum + row.inspectionCount, 0),
    });
  };

  const remotePeriodLabel = monthCardLabel(monthKey);
  const postWorkPeriodLabel = monthCardLabel(shiftMonthKey(monthKey, -1));
  const remoteTitle =
    monthKey === currentMonthKey()
      ? `Remoto · mês vigente (${remotePeriodLabel})`
      : `Remoto · ${remotePeriodLabel}`;

  return (
    <Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gap={2}
        mb={2}
      >
        <DataCard title={remoteTitle}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography>Total: {summary ? formatNumber(summary.remote.total) : "—"}</Typography>
            <Typography>Feitas: {summary ? formatNumber(summary.remote.done) : "—"}</Typography>
          </Box>
        </DataCard>
        <DataCard title={`Pós-obra · mês anterior (${postWorkPeriodLabel})`}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography>Total: {summary ? formatNumber(summary.postWork.total) : "—"}</Typography>
            <Typography>Feitas: {summary ? formatNumber(summary.postWork.done) : "—"}</Typography>
          </Box>
        </DataCard>
      </Box>
      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Filtrar por número da OS"
          value={osNumber}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Setor</InputLabel>
          <Select
            value={sectorId}
            onChange={(e) => handleSectorChange(e.target.value)}
            label="Setor"
          >
            <MenuItem value="">
              <em>Todos os setores</em>
            </MenuItem>
            {(sectors ?? []).filter((s) => s.active).map((sector) => (
              <MenuItem key={sector.id} value={sector.id}>
                {sector.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Contrato</InputLabel>
          <Select
            value={contractId}
            onChange={(e) => handleContractChange(e.target.value)}
            label="Contrato"
          >
            <MenuItem value="">
              <em>Todos os contratos</em>
            </MenuItem>
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>
                {contract.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <MonthFilter value={monthKey} onChange={handleMonthChange} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Campo</InputLabel>
          <Select
            value={field}
            onChange={(e) => handleModuleFilter("field", e.target.value as "" | "true" | "false")}
            label="Campo"
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Remoto</InputLabel>
          <Select
            value={remote}
            onChange={(e) => handleModuleFilter("remote", e.target.value as "" | "true" | "false")}
            label="Remoto"
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Pós-obra</InputLabel>
          <Select
            value={postWork}
            onChange={(e) => handleModuleFilter("postWork", e.target.value as "" | "true" | "false")}
            label="Pós-obra"
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Equipe PDA"
          placeholder="Buscar equipe"
          value={equipe}
          onChange={(e) => {
            setEquipe(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          size="small"
          label="Resultado"
          placeholder="Buscar resultado"
          value={resultado}
          onChange={(e) => {
            setResultado(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "action.disabled" }} />,
          }}
          sx={{ minWidth: 200 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterAltOff />}
          onClick={handleClearFilters}
          disabled={loading || !navigator.onLine}
        >
          Limpar filtros
        </Button>
        <ExportExcelButton
          onExport={handleExportServiceOrders}
          disabled={loading || !navigator.onLine}
        />
        {isAdmin && selectedCount > 0 && (
          <Button
            color="error"
            variant="contained"
            onClick={openBulkDelete}
            disabled={loading || deletingLoading || !navigator.onLine}
          >
            Excluir selecionadas ({selectedCount})
          </Button>
        )}
        {meta && (
          <Chip
            color="primary"
            variant="filled"
            label={`Total de itens: ${formatNumber(meta.total)}`}
          />
        )}
      </Box>

      <SectionTable title="Ordens de serviço cadastradas">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1500 }}>
            <TableHead>
              <ServiceOrderTableHead
                showActions={isAdmin}
                allSelected={allPageSelected}
                someSelected={somePageSelected}
                onTogglePage={togglePage}
              />
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center" sx={{ py: 4 }}>
                    {osNumberFilter || sectorId || contractId || from || to || field || remote || postWork || equipeFilter || resultadoFilter
                      ? "Nenhuma ordem de serviço encontrada com esse filtro."
                      : "Nenhuma ordem de serviço cadastrada."}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((so) => (
                  <TableRow key={so.id} selected={Boolean(selected[so.id])}>
                    {isAdmin && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={Boolean(selected[so.id])}
                          onChange={() => toggleRow(so)}
                          inputProps={{ "aria-label": `Selecionar OS ${so.osNumber}` }}
                        />
                      </TableCell>
                    )}
                    <TableCell>{so.osNumber}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ mr: 1 }}
                        label={so.sector?.name ?? "Sem setor"}
                      />
                    </TableCell>
                    <TableCell>{so.address}</TableCell>
                    <TableCell>
                      <StageMark
                        present={so.field}
                        externalId={so.fieldInspectionId}
                        hideWhenAbsent
                        onOpen={openInspection}
                      />
                    </TableCell>
                    <TableCell>
                      <StageMark
                        present={so.remote}
                        externalId={so.remoteInspectionId}
                        onOpen={openInspection}
                      />
                    </TableCell>
                    <TableCell>
                      {so.postWorkRequired ? (
                        <StageMark
                          present={so.postWork}
                          externalId={so.postWorkInspectionId}
                          onOpen={openInspection}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>{so.status ?? "—"}</TableCell>
                    <TableCell>{so.equipe ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(so.fimExecucao)}</TableCell>
                    <TableCell>{so.tempoExecucaoEfetivo ?? "—"}</TableCell>
                    <TableCell>{so.resultado ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(so.updatedAt)}</TableCell>
                    {isAdmin && (
                      <TableActionsCell>
                        <TableActionsGroup>
                          <TableDeleteButton
                            onClick={() =>
                              setPendingDelete({
                                ids: [so.id],
                                inspectionCount: so.inspectionCount ?? 0,
                              })
                            }
                          />
                        </TableActionsGroup>
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
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            disabled={loading}
          />
        )}
      </SectionTable>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete && pendingDelete.ids.length > 1 ? "Excluir ordens de serviço" : "Excluir ordem de serviço"}
        description={
          pendingDelete
            ? deleteConfirmation(pendingDelete.ids.length, pendingDelete.inspectionCount)
            : ""
        }
        confirmLabel="Excluir"
        loading={deletingLoading}
        onClose={() => {
          if (deletingLoading) return;
          setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete || deletingLoading) return;
          const ids = pendingDelete.ids;
          setDeletingLoading(true);
          setDeleteError(null);
          try {
            if (ids.length === 1) await appRepository.deleteServiceOrder(ids[0]);
            else await appRepository.deleteServiceOrders(ids);
            setSelected((current) => {
              const next = { ...current };
              for (const id of ids) delete next[id];
              return next;
            });
            setPendingDelete(null);
            setRefreshKey((current) => current + 1);
          } catch (error) {
            setDeleteError(errorText(error, "Não foi possível excluir a ordem de serviço."));
          } finally {
            setDeletingLoading(false);
          }
        }}
      />

      {deleteError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {deleteError}
        </Alert>
      )}
    </Box>
  );
}

interface ImportacaoTabProps {
  contracts: Array<{ id: string; name: string }>;
  canUpload: boolean;
  canDelete: boolean;
}

function ImportacaoTab({ contracts, canUpload, canDelete }: ImportacaoTabProps): JSX.Element {
  const [importing, setImporting] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [importResult, setImportResult] = useState<ServiceOrderImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contracts.length) {
      setSelectedContractId("");
      return;
    }
    setSelectedContractId((current) => (contracts.some((contract) => contract.id === current) ? current : contracts[0].id));
  }, [contracts]);

  const handleImportClick = () => {
    if (!selectedContractId) return;
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setImportResult(null);
    try {
      const res = await appRepository.importServiceOrders(file, selectedContractId);
      setImportResult(res);
      setHistoryRefresh((current) => current + 1);
    } catch (err) {
      setImportResult({
        inserted: 0,
        skipped: 0,
        deleted: 0,
        notRegistered: 0,
        errors: [err instanceof Error ? err.message : "Erro ao importar"],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      {canUpload && (
      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Contrato da importação</InputLabel>
          <Select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            label="Contrato da importação"
          >
            <MenuItem value="">
              <em>Selecione um contrato</em>
            </MenuItem>
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>
                {contract.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          onClick={handleImportClick}
          disabled={importing || !navigator.onLine || !selectedContractId}
        >
          {importing ? "Importando..." : "Importar Excel"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </Box>
      )}
      {canUpload && contracts.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nenhum contrato disponível no seu perfil. Solicite o vínculo de contrato para importar ordens de serviço.
        </Alert>
      )}

      {canUpload && !importResult && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Envie um arquivo Excel (.xlsx ou .xls) com as colunas necessárias para importar ordens de
          serviço. Selecione o contrato da importação antes de enviar o arquivo.
        </Typography>
      )}
      {importResult && (
        <Alert
          severity={(importResult.errors ?? []).length > 0 ? "warning" : "success"}
          sx={{ mt: 2 }}
          onClose={() => setImportResult(null)}
        >
          Inseridas: {importResult.inserted}. Ignoradas: {importResult.skipped}. Deletadas: {importResult.deleted}. Não registradas: {importResult.notRegistered}.
          {(importResult.errors ?? []).length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {(importResult.errors ?? []).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </Box>
          )}
        </Alert>
      )}
      <ServiceOrderImportHistory refreshKey={historyRefresh} canDelete={canDelete} />
    </Box>
  );
}

type PanelTab = "todos" | "vistorias" | "historico";

function panelTabFromSearch(
  requested: string | null,
  canSeeInspections: boolean,
  canViewHistory: boolean
): PanelTab {
  if (requested === "vistorias" && canSeeInspections) return "vistorias";
  if (requested === "historico" && canViewHistory) return "historico";
  return "todos";
}

export const ServiceOrdersPage = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const canImport = canAreaAction(user, AccessArea.QUALIDADE_PAINEL, [
    UserRole.ADMIN,
    UserRole.GESTOR,
    UserRole.SUPERVISOR,
  ]);
  const canDeleteOrders = canAreaAction(user, AccessArea.QUALIDADE_PAINEL, [UserRole.ADMIN]);
  const canViewHistory = isAdmin || canImport;
  const canSeeInspections = isAdmin || canImport;
  const tab = panelTabFromSearch(searchParams.get("tab"), canSeeInspections, canViewHistory);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const availableContracts = user?.contracts ?? [];
  const contractsForFilters = isAdmin ? allContracts : availableContracts;

  const selectTab = (next: PanelTab) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === "todos") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (!isAdmin) {
      setAllContracts([]);
      return;
    }
    let cancelled = false;
    const loadContracts = async () => {
      try {
        const result = await appRepository.getContracts({ page: 1, limit: 100 });
        if (!cancelled) setAllContracts(result.data);
      } catch {
        if (!cancelled) setAllContracts([]);
      }
    };
    void loadContracts();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    const allowed =
      requested === "vistorias" ? canSeeInspections : requested === "historico" ? canViewHistory : true;
    if (!requested || allowed) return;
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        params.delete("tab");
        return params;
      },
      { replace: true }
    );
  }, [canSeeInspections, canViewHistory, searchParams, setSearchParams]);

  return (
    <Box>
      <PageHeader
        eyebrow="Operação"
        title="Painel de Controle"
        subtitle="Consulte e importe ordens de serviço para suportar a execução das vistorias."
      />

      {!navigator.onLine && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ordens de Serviço só podem ser carregadas e importadas quando online.
        </Alert>
      )}

      <DataCard>
        <Tabs value={tab} onChange={(_, value: PanelTab) => selectTab(value)} sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}>
          <Tab label="Todos" value="todos" id="service-orders-tab-todos" aria-controls="service-orders-panel-todos" />
          {canSeeInspections && (
            <Tab
              label="Vistorias"
              value="vistorias"
              id="service-orders-tab-vistorias"
              aria-controls="service-orders-panel-vistorias"
            />
          )}
          {canViewHistory && (
            <Tab
              label={canImport ? "Importação" : "Histórico"}
              value="historico"
              id="service-orders-tab-historico"
              aria-controls="service-orders-panel-historico"
            />
          )}
        </Tabs>

        <Box sx={{ p: 2 }}>
          <div role="tabpanel" hidden={tab !== "todos"} id="service-orders-panel-todos" aria-labelledby="service-orders-tab-todos">
            {tab === "todos" && (
              <ListagemTab contracts={contractsForFilters} isAdmin={canDeleteOrders} />
            )}
          </div>
          {canSeeInspections && (
            <div
              role="tabpanel"
              hidden={tab !== "vistorias"}
              id="service-orders-panel-vistorias"
              aria-labelledby="service-orders-tab-vistorias"
            >
              {tab === "vistorias" && <QualityInspectionsTab />}
            </div>
          )}
          {canViewHistory && (
            <div
              role="tabpanel"
              hidden={tab !== "historico"}
              id="service-orders-panel-historico"
              aria-labelledby="service-orders-tab-historico"
            >
              {tab === "historico" && (
                <ImportacaoTab
                  contracts={availableContracts}
                  canUpload={canImport}
                  canDelete={canDeleteOrders}
                />
              )}
            </div>
          )}
        </Box>
      </DataCard>
    </Box>
  );
};
