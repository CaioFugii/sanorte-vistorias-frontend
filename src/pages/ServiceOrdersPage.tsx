import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CloudUpload, Refresh } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import { appRepository } from "@/repositories/AppRepository";
import { useReferenceStore } from "@/stores/referenceStore";

export const ServiceOrdersPage = (): JSX.Element => {
  const serviceOrders = useReferenceStore((state) => state.serviceOrders);
  const loadServiceOrders = useReferenceStore((state) => state.loadServiceOrders);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      await loadServiceOrders();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      const result = await appRepository.importServiceOrders(file);
      setImportResult(result);
      await loadServiceOrders();
    } catch (err) {
      setImportResult({
        inserted: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : "Erro ao importar"],
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Ordens de Serviço (OS)</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={load}
            disabled={loading || !navigator.onLine}
          >
            Atualizar
          </Button>
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
      </Box>

      {!navigator.onLine && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ordens de Serviço só podem ser carregadas e importadas quando online.
        </Alert>
      )}

      {importResult && (
        <Alert
          severity={importResult.errors.length > 0 ? "warning" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setImportResult(null)}
        >
          Inseridas: {importResult.inserted}. Ignoradas (duplicadas): {importResult.skipped}.
          {importResult.errors.length > 0 && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {importResult.errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 5 && (
                <li>... e mais {importResult.errors.length - 5} erro(s)</li>
              )}
            </Box>
          )}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número da OS</TableCell>
                <TableCell>Endereço</TableCell>
                <TableCell>Campo</TableCell>
                <TableCell>Remota</TableCell>
                <TableCell>Pós-obra</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    Nenhuma ordem de serviço cadastrada. Importe um arquivo Excel (.xlsx ou .xls)
                    com as colunas "Numero da OS" e "Endereço".
                  </TableCell>
                </TableRow>
              ) : (
                serviceOrders.map((so) => (
                  <TableRow key={so.id}>
                    <TableCell>{so.osNumber}</TableCell>
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
      </Paper>
    </Box>
  );
};
