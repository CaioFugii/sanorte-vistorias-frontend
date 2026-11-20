import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ListPagination } from "@/components/ListPagination";
import { DataCard } from "@/components/ui";
import { InvestmentWorkImportDetail, InvestmentWorkImportSummary } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { downloadBlob } from "@/utils/downloadBlob";

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Metric({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }): JSX.Element {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={700}
        color={emphasize && value > 0 ? "error.main" : "text.primary"}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ImportRecord({
  row,
  onOpen,
  onDownload,
}: {
  row: InvestmentWorkImportSummary;
  onOpen: () => void;
  onDownload: () => void;
}): JSX.Element {
  const descriptions = row.selectedDescriptions ?? [];
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
        gap: 1.5,
        alignItems: "start",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
          {row.originalFileName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {[row.contract?.name, row.user?.name, formatWhen(row.createdAt)].filter(Boolean).join(" · ")}
        </Typography>
        {descriptions.length > 0 && (
          <Typography variant="body2" sx={{ mt: 0.75, wordBreak: "break-word" }}>
            Descrições: {descriptions.join(", ")}
          </Typography>
        )}
        <Box
          sx={{
            mt: 1.25,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 1,
            maxWidth: 560,
          }}
        >
          <Metric label="Criados" value={row.createdCount} />
          <Metric label="Ignoradas" value={row.ignoredCount} />
          <Metric label="Não selecionadas" value={row.notSelectedCount} />
          <Metric label="Não registradas" value={row.notRegisteredCount} emphasize />
        </Box>
      </Box>
      <Stack direction="row" spacing={0.5} sx={{ justifySelf: { sm: "end" } }}>
        <Button size="small" onClick={onOpen}>
          Detalhe
        </Button>
        <Button size="small" onClick={onDownload}>
          Baixar
        </Button>
      </Stack>
    </Box>
  );
}

export function InvestmentWorkImportHistory({ refreshKey }: { refreshKey: number }): JSX.Element {
  const [rows, setRows] = useState<InvestmentWorkImportSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<InvestmentWorkImportDetail | null>(null);
  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void appRepository
      .getInvestmentWorkImports({ page, limit })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setTotal(result.meta.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  const lines = detail?.lines ?? [];

  return (
    <DataCard title="Lançamentos">
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ px: 2, py: 3 }}>
          Nenhum cadastro por Excel ainda.
        </Typography>
      ) : (
        <Stack divider={<Divider />}>
          {rows.map((row) => (
            <ImportRecord
              key={row.id}
              row={row}
              onOpen={() => void appRepository.getInvestmentWorkImport(row.id).then(setDetail)}
              onDownload={() =>
                void appRepository.downloadInvestmentWorkImport(row.id).then((file) => downloadBlob(file.blob, file.filename))
              }
            />
          ))}
        </Stack>
      )}
      {total > 0 && (
        <ListPagination
          meta={{
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          }}
          onPageChange={setPage}
          onRowsPerPageChange={() => undefined}
          rowsPerPageOptions={[10]}
        />
      )}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle>Linhas não registradas</DialogTitle>
        <DialogContent>
          {detail && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: "break-word" }}>
              {detail.originalFileName}
              {detail.contract?.name ? ` · ${detail.contract.name}` : ""}
            </Typography>
          )}
          {lines.length === 0 ? (
            <Typography color="text.secondary">Nenhuma linha ficou sem registro.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Linha</TableCell>
                  <TableCell>O.S</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.lineNumber}>
                    <TableCell>{line.lineNumber}</TableCell>
                    <TableCell>{line.osNumber ?? "—"}</TableCell>
                    <TableCell sx={{ wordBreak: "break-word" }}>{line.description ?? "—"}</TableCell>
                    <TableCell sx={{ wordBreak: "break-word" }}>{line.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </DataCard>
  );
}
