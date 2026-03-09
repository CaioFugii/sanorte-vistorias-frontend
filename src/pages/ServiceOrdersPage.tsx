import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
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
import { CloudUpload, Refresh, Search } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import { appRepository } from "@/repositories/AppRepository";
import { useReferenceStore } from "@/stores/referenceStore";
import { PaginatedResponse, ServiceOrder } from "@/domain";
import { ListPagination } from "@/components/ListPagination";

const DEFAULT_LIMIT = 10;

const TABLE_HEAD = (
  <TableRow>
    <TableCell>Número da OS</TableCell>
    <TableCell>Setor</TableCell>
    <TableCell>Endereço</TableCell>
    <TableCell>Campo</TableCell>
    <TableCell>Remota</TableCell>
    <TableCell>Pós-obra</TableCell>
  </TableRow>
);

function ListagemTab(): JSX.Element {
  const sectors = useReferenceStore((state) => state.sectors);
  const loadCache = useReferenceStore((state) => state.loadCache);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [osNumber, setOsNumber] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [field, setField] = useState<"" | "true" | "false">("");
  const [remote, setRemote] = useState<"" | "true" | "false">("");
  const [postWork, setPostWork] = useState<"" | "true" | "false">("");
  const [result, setResult] = useState<PaginatedResponse<ServiceOrder> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    appRepository
      .getServiceOrders({
        page,
        limit,
        osNumber: osNumber.trim() || undefined,
        sectorId: sectorId.trim() || undefined,
        field: field === "" ? undefined : field === "true",
        remote: remote === "" ? undefined : remote === "true",
        postWork: postWork === "" ? undefined : postWork === "true",
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
  }, [page, limit, osNumber, sectorId, field, remote, postWork]);

  const handleSearch = (value: string) => {
    setOsNumber(value);
    setPage(1);
  };

  const handleSectorChange = (value: string) => {
    setSectorId(value);
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

  const meta = result?.meta;
  const data = result?.data ?? [];

  if (loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => setPage(1)}
          disabled={loading || !navigator.onLine}
        >
          Atualizar
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>{TABLE_HEAD}</TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    {osNumber.trim() || sectorId || field || remote || postWork
                      ? "Nenhuma ordem de serviço encontrada com esse filtro."
                      : "Nenhuma ordem de serviço cadastrada."}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((so) => (
                  <TableRow key={so.id}>
                    <TableCell>{so.osNumber}</TableCell>
                    <TableCell>{so.sector?.name ?? "—"}</TableCell>
                    <TableCell>{so.address}</TableCell>
                    <TableCell>{so.field ? "Sim" : "Não"}</TableCell>
                    <TableCell>{so.remote ? "Sim" : "Não"}</TableCell>
                    <TableCell>{so.postWork ? "Sim" : "Não"}</TableCell>
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            disabled={loading}
          />
        )}
      </Paper>
    </Box>
  );
}

function ImportacaoTab(): JSX.Element {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    deleted: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
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
      const res = await appRepository.importServiceOrders(file);
      setImportResult(res);
    } catch (err) {
      setImportResult({
        inserted: 0,
        skipped: 0,
        deleted: 0,
        errors: [err instanceof Error ? err.message : "Erro ao importar"],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          onClick={handleImportClick}
          disabled={importing || !navigator.onLine}
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

      {!importResult ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Envie um arquivo Excel (.xlsx ou .xls) com as colunas necessárias para importar ordens de
          serviço. O resultado da importação será exibido abaixo.
        </Typography>
      ) : (
        <Alert
          severity={(importResult.errors ?? []).length > 0 ? "warning" : "success"}
          sx={{ mt: 2 }}
          onClose={() => setImportResult(null)}
        >
          Inseridas: {importResult.inserted}. Ignoradas (duplicadas): {importResult.skipped}. Deletadas (canceladas): {importResult.deleted}.
          {(importResult.errors ?? []).length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {(importResult.errors ?? []).slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {(importResult.errors ?? []).length > 5 && (
                <li>... e mais {(importResult.errors ?? []).length - 5} erro(s)</li>
              )}
            </Box>
          )}
        </Alert>
      )}
    </Box>
  );
}

export const ServiceOrdersPage = (): JSX.Element => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Ordens de Serviço (OS)</Typography>
      </Box>

      {!navigator.onLine && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ordens de Serviço só podem ser carregadas e importadas quando online.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tab label="TODOS" id="service-orders-tab-0" aria-controls="service-orders-panel-0" />
        <Tab label="Importação" id="service-orders-tab-1" aria-controls="service-orders-panel-1" />
      </Tabs>

      <div role="tabpanel" hidden={tab !== 0} id="service-orders-panel-0" aria-labelledby="service-orders-tab-0">
        {tab === 0 && <ListagemTab />}
      </div>
      <div role="tabpanel" hidden={tab !== 1} id="service-orders-panel-1" aria-labelledby="service-orders-tab-1">
        {tab === 1 && <ImportacaoTab />}
      </div>
    </Box>
  );
};
