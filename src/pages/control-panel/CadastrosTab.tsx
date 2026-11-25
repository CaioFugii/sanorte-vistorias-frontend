import { CloudUpload } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
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
  canUpload,
  left,
}: {
  contracts: Array<Pick<Contract, "id" | "name">>;
  obrasContracts?: Array<Pick<Contract, "id" | "name">>;
  showObras: boolean;
  canUpload: boolean;
  left: ReactNode;
}): JSX.Element {
  const [contractId, setContractId] = useState(obrasContracts.length === 1 ? obrasContracts[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InvestmentWorkImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<InvestmentWorkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Cadastro Global
        </Typography>
        {left}
      </Box>
      {showObras && (
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            Cadastro Obras Inv
          </Typography>
          {canUpload && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
                Envie a planilha de Obras Inv (.xlsx ou .xls). Escolha o contrato antes. Na tela seguinte, marque as
                Descrições que devem entrar.
              </Typography>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                <FormControl size="small" sx={{ minWidth: 280, flex: "1 1 280px", maxWidth: 420 }}>
                  <InputLabel>Contrato</InputLabel>
                  <Select value={contractId} label="Contrato" onChange={(event) => setContractId(event.target.value)}>
                    {obrasContracts.map((contract) => (
                      <MenuItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={previewing ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  disabled={!contractId || previewing || saving}
                >
                  {previewing ? "Lendo planilha..." : "Enviar planilha"}
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
                      setPreviewing(true);
                      void appRepository
                        .previewInvestmentWorkImport(next)
                        .then(setPreview)
                        .catch((cause: unknown) => {
                          setFile(null);
                          setError(errorText(cause, "Não foi possível ler a planilha."));
                        })
                        .finally(() => setPreviewing(false));
                    }}
                  />
                </Button>
              </Box>
              {obrasContracts.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Nenhum contrato disponível no seu perfil. Solicite o vínculo de contrato para cadastrar obras.
                </Alert>
              )}
            </>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {result && (
            <Alert severity={result.errors.length > 0 || result.notRegistered > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
              Criados: {result.created}. Ignoradas: {result.ignored}. Não selecionadas: {result.notSelected}. Não
              registradas: {result.notRegistered}.
              {result.errors.length > 0 && (
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {result.errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
          <InvestmentWorkImportHistory refreshKey={refreshKey} />
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
    </Stack>
  );
}
