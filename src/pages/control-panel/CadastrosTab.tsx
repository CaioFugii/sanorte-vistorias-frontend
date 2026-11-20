import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { ReactNode, useState } from "react";
import { Contract, InvestmentWorkImportPreview, InvestmentWorkImportResult } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { InvestmentWorkImportHistory } from "./InvestmentWorkImportHistory";
import { InvestmentWorkImportSelectionDialog } from "./InvestmentWorkImportSelectionDialog";

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

export function CadastrosTab({
  contracts,
  obrasContracts = contracts,
  showObras,
  left,
}: {
  contracts: Array<Pick<Contract, "id" | "name">>;
  obrasContracts?: Array<Pick<Contract, "id" | "name">>;
  showObras: boolean;
  left: ReactNode;
}): JSX.Element {
  const [contractId, setContractId] = useState(obrasContracts.length === 1 ? obrasContracts[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InvestmentWorkImportPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<InvestmentWorkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: showObras ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr" }}
      gap={3}
    >
      <Box sx={{ minWidth: 0, overflowX: "auto" }}>{left}</Box>
      {showObras && (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>Cadastro Obras Inv</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Contrato</InputLabel>
            <Select value={contractId} label="Contrato" onChange={(event) => setContractId(event.target.value)}>
              {obrasContracts.map((contract) => (
                <MenuItem key={contract.id} value={contract.id}>{contract.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" component="label" disabled={!contractId}>
            Enviar planilha
            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (!next) return;
                setFile(next);
                setError(null);
                setResult(null);
                void appRepository.previewInvestmentWorkImport(next).then(setPreview).catch((cause: unknown) => {
                  setError(errorText(cause, "Não foi possível ler a planilha."));
                });
              }}
            />
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {result && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Criados: {result.created}. Ignoradas: {result.ignored}. Não selecionadas: {result.notSelected}. Não registradas: {result.notRegistered}.
              {result.errors.length > 0 && (
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {result.errors.map((item) => <li key={item}>{item}</li>)}
                </Box>
              )}
            </Alert>
          )}
          <Box sx={{ mt: 3 }}>
            <InvestmentWorkImportHistory refreshKey={refreshKey} />
          </Box>
          <InvestmentWorkImportSelectionDialog
            preview={preview}
            saving={saving}
            onCancel={() => {
              setPreview(null);
              setFile(null);
            }}
            onSave={(keys) => {
              if (!file || !contractId) return;
              setSaving(true);
              void appRepository
                .importInvestmentWorks(file, contractId, keys)
                .then((imported) => {
                  setResult(imported);
                  setPreview(null);
                  setFile(null);
                  setRefreshKey((current) => current + 1);
                })
                .catch((cause: unknown) => {
                  setError(errorText(cause, "Não foi possível gravar o cadastro."));
                })
                .finally(() => setSaving(false));
            }}
          />
        </Box>
      )}
    </Box>
  );
}
