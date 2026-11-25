import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { SectionTable, TableActionsCell, TableActionsGroup, TableActionsHeaderCell, TableDeleteButton, TableEditButton, TableViewButton } from "@/components/ui";
import { useListQueryState } from "@/hooks/useListQueryState";
import { AccessAction, Contract, InvestmentWork, InvestmentWorkOrigin, InvestmentWorkSummary } from "@/domain";
import { canAct } from "@/domain/rules/access-area";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { InvestmentWorkFormDialog } from "./InvestmentWorkFormDialog";
import { InvestmentWorkMonitorDialog } from "./InvestmentWorkMonitorDialog";
import { InvestmentWorkSummaryCards } from "./InvestmentWorkSummaryCards";

function saoPauloMonth(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}

function monthRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const padded = String(monthNumber).padStart(2, "0");
  return {
    from: `${year}-${padded}-01`,
    to: `${year}-${padded}-${String(last).padStart(2, "0")}`,
  };
}

function monthOptions(current: string): string[] {
  const [year, month] = current.split("-").map(Number);
  const options: string[] = [];
  for (let cursor = 2024 * 12; cursor <= year * 12 + month - 1; cursor += 1) {
    const cursorYear = Math.floor(cursor / 12);
    const cursorMonth = String((cursor % 12) + 1).padStart(2, "0");
    options.push(`${cursorYear}-${cursorMonth}`);
  }
  return options.reverse();
}

function searchable(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length >= 3 ? trimmed : undefined;
}

function appliedSearch(value: string): string {
  return searchable(value) ?? "";
}

function quantity(count: number | undefined, hidden: boolean): string {
  if (hidden) return "";
  return (count ?? 0) > 0 ? String(count) : "Não";
}

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 400);
    return () => window.clearTimeout(timer);
  }, [value]);
  return debounced;
}

export function InvestmentWorksTab({
  contracts,
}: {
  contracts: Array<Pick<Contract, "id" | "name">>;
}): JSX.Element {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const canCreate = canAct(user, AccessAction.PAINEL_OBRAS_CRIAR);
  const canEdit = canAct(user, AccessAction.PAINEL_OBRAS_EDITAR);
  const canDelete = canAct(user, AccessAction.PAINEL_OBRAS_EXCLUIR);
  const currentMonth = saoPauloMonth();
  const defaultContract = contracts.length === 1 ? contracts[0].id : "";
  const defaults = useMemo(
    () => ({
      page: "1",
      limit: "10",
      obrasContract: defaultContract,
      obrasMonth: currentMonth,
      obrasAddress: "",
      obrasDistrict: "",
      obrasTeam: "",
      obrasPostWork: "",
    }),
    [currentMonth, defaultContract]
  );
  const { values, setFilter, reset, page, limit, setPage, setLimit } = useListQueryState(defaults);
  const [address, setAddress] = useState(values.obrasAddress);
  const [district, setDistrict] = useState(values.obrasDistrict);
  const [pdaTeam, setPdaTeam] = useState(values.obrasTeam);
  const debouncedAddress = useDebounced(address);
  const debouncedDistrict = useDebounced(district);
  const debouncedTeam = useDebounced(pdaTeam);
  const [rows, setRows] = useState<InvestmentWork[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<InvestmentWorkSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<InvestmentWork | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [monitoringId, setMonitoringId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<InvestmentWork | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const range = monthRange(values.obrasMonth || currentMonth);

  useEffect(() => {
    if (appliedSearch(debouncedAddress) !== appliedSearch(values.obrasAddress)) {
      setFilter("obrasAddress", appliedSearch(debouncedAddress));
    }
  }, [debouncedAddress, setFilter, values.obrasAddress]);
  useEffect(() => {
    if (appliedSearch(debouncedDistrict) !== appliedSearch(values.obrasDistrict)) {
      setFilter("obrasDistrict", appliedSearch(debouncedDistrict));
    }
  }, [debouncedDistrict, setFilter, values.obrasDistrict]);
  useEffect(() => {
    if (appliedSearch(debouncedTeam) !== appliedSearch(values.obrasTeam)) {
      setFilter("obrasTeam", appliedSearch(debouncedTeam));
    }
  }, [debouncedTeam, setFilter, values.obrasTeam]);

  useEffect(() => {
    let cancelled = false;
    const filters = {
      contractId: values.obrasContract || undefined,
      from: range.from,
      to: range.to,
      address: searchable(values.obrasAddress),
      district: searchable(values.obrasDistrict),
      pdaTeam: searchable(values.obrasTeam),
      postWork: values.obrasPostWork === "" ? undefined : values.obrasPostWork === "true",
    };
    setLoading(true);
    void Promise.all([
      appRepository.getInvestmentWorks({ ...filters, page, limit }),
      appRepository.getInvestmentWorkSummary(filters),
    ])
      .then(([list, cards]) => {
        if (cancelled) return;
        setRows(list.data);
        setTotal(list.meta.total);
        setSummary(cards);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit, page, range.from, range.to, reloadKey, values]);

  return (
    <Box>
      <InvestmentWorkSummaryCards summary={summary} />
      <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Contrato</InputLabel>
          <Select value={values.obrasContract} label="Contrato" onChange={(event) => setFilter("obrasContract", event.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>{contract.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Mês</InputLabel>
          <Select value={values.obrasMonth} label="Mês" onChange={(event) => setFilter("obrasMonth", event.target.value)}>
            {monthOptions(currentMonth).map((month) => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" label="Endereço" value={address} onChange={(event) => setAddress(event.target.value)} />
        <TextField size="small" label="Bairro" value={district} onChange={(event) => setDistrict(event.target.value)} />
        <TextField size="small" label="Equipe PDA" value={pdaTeam} onChange={(event) => setPdaTeam(event.target.value)} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Pós Obra</InputLabel>
          <Select value={values.obrasPostWork} label="Pós Obra" onChange={(event) => setFilter("obrasPostWork", event.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Com pós-obra</MenuItem>
            <MenuItem value="false">Sem pós-obra</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={() => { setAddress(""); setDistrict(""); setPdaTeam(""); reset(); }}>Limpar filtros</Button>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Nova Obra
          </Button>
        )}
      </Box>
      <SectionTable>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número de O.S/Obra</TableCell>
              <TableCell>Contrato</TableCell>
              <TableCell>Endereço</TableCell>
              <TableCell>Bairro</TableCell>
              <TableCell>Equipe PDA</TableCell>
              <TableCell>Data de Execução</TableCell>
              <TableCell>Campo</TableCell>
              <TableCell>Pós Obra</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ativa</TableCell>
              <TableActionsHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const excel = row.origin === InvestmentWorkOrigin.IMPORT;
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.workName}</TableCell>
                  <TableCell>{row.contract?.name ?? "—"}</TableCell>
                  <TableCell>{row.address}</TableCell>
                  <TableCell>{row.district}</TableCell>
                  <TableCell>{excel ? row.pdaTeamName || "—" : row.team?.name || "—"}</TableCell>
                  <TableCell>{row.expectedEndDate?.slice(0, 10)}</TableCell>
                  <TableCell>{quantity(row.fieldInspectionCount, excel)}</TableCell>
                  <TableCell>{quantity(row.postWorkInspectionCount, false)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.active ? "Sim" : "Não"}</TableCell>
                  <TableActionsCell>
                    <TableActionsGroup>
                      <TableViewButton label="Acompanhar" onClick={() => setMonitoringId(row.id)} />
                      {canEdit && <TableEditButton label="Editar" onClick={() => { setEditing(row); setFormOpen(true); }} />}
                      {canDelete && <TableDeleteButton label="Excluir" onClick={() => setDeleting(row)} />}
                    </TableActionsGroup>
                  </TableActionsCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">Nenhuma obra encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ListPagination
          meta={{ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total, hasPrev: page > 1 }}
          onPageChange={setPage}
          onRowsPerPageChange={setLimit}
          rowsPerPageOptions={[10, 20, 50]}
          disabled={loading}
        />
      </SectionTable>
      <InvestmentWorkFormDialog
        open={formOpen}
        work={editing}
        contracts={contracts}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); setReloadKey((current) => current + 1); }}
      />
      <InvestmentWorkMonitorDialog workId={monitoringId} from={`${location.pathname}${location.search}`} onClose={() => setMonitoringId(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir obra"
        description={
          deleting?.origin === InvestmentWorkOrigin.IMPORT
            ? `Excluir a O.S ${deleting.workName}? A mesma planilha não recria este cadastro.`
            : `Deseja excluir a obra "${deleting?.workName ?? ""}"?`
        }
        confirmLabel="Excluir"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          void appRepository.deleteInvestmentWork(deleting.id).then(() => {
            setDeleting(null);
            setReloadKey((current) => current + 1);
          });
        }}
      />
    </Box>
  );
}
