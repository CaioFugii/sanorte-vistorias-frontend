import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ListPagination } from "@/components/ListPagination";
import { InvestmentWorkImportDetail, InvestmentWorkImportSummary } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { downloadBlob } from "@/utils/downloadBlob";

export function InvestmentWorkImportHistory({ refreshKey }: { refreshKey: number }): JSX.Element {
  const [rows, setRows] = useState<InvestmentWorkImportSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<InvestmentWorkImportDetail | null>(null);
  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    void appRepository.getInvestmentWorkImports({ page, limit }).then((result) => {
      if (cancelled) return;
      setRows(result.data);
      setTotal(result.meta.total);
    });
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Histórico Obras Inv</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Arquivo</TableCell>
            <TableCell>Contrato</TableCell>
            <TableCell>Usuário</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Descrições</TableCell>
            <TableCell>Criados</TableCell>
            <TableCell>Ignoradas</TableCell>
            <TableCell>Não selecionadas</TableCell>
            <TableCell>Não registradas</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.originalFileName}</TableCell>
              <TableCell>{row.contract?.name}</TableCell>
              <TableCell>{row.user?.name}</TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleString("pt-BR")}</TableCell>
              <TableCell>{(row.selectedDescriptions ?? []).join(", ")}</TableCell>
              <TableCell>{row.createdCount}</TableCell>
              <TableCell>{row.ignoredCount}</TableCell>
              <TableCell>{row.notSelectedCount}</TableCell>
              <TableCell>{row.notRegisteredCount}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => void appRepository.getInvestmentWorkImport(row.id).then(setDetail)}>
                  Detalhe
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    void appRepository.downloadInvestmentWorkImport(row.id).then((file) => downloadBlob(file.blob, file.filename))
                  }
                >
                  Baixar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ListPagination
        meta={{ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total, hasPrev: page > 1 }}
        onPageChange={setPage}
        onRowsPerPageChange={() => undefined}
        rowsPerPageOptions={[10]}
      />
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle>Linhas não registradas</DialogTitle>
        <DialogContent>
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
              {(detail?.lines ?? []).map((line) => (
                <TableRow key={line.lineNumber}>
                  <TableCell>{line.lineNumber}</TableCell>
                  <TableCell>{line.osNumber ?? "—"}</TableCell>
                  <TableCell>{line.description ?? "—"}</TableCell>
                  <TableCell>{line.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
