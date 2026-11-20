import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TableActionsCell, TableActionsGroup, TableActionsHeaderCell, TableViewButton } from "@/components/ui";
import { InvestmentWork, InvestmentWorkOrigin } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";

export function InvestmentWorkMonitorDialog({
  workId,
  from,
  onClose,
}: {
  workId: string | null;
  from: string;
  onClose: () => void;
}): JSX.Element {
  const navigate = useNavigate();
  const [work, setWork] = useState<InvestmentWork | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void appRepository
      .getInvestmentWork(workId)
      .then((result) => {
        if (!cancelled) setWork(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a obra.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workId]);

  const stats = work?.inspectionStats;
  return (
    <Dialog open={Boolean(workId)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Acompanhar</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !work ? (
          <Alert severity="info">Nenhum dado de acompanhamento disponível.</Alert>
        ) : (
          <Box>
            <Typography variant="h6">{work.workName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{work.address}</Typography>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(4, 1fr)" }} gap={1.5} mb={2}>
              <Metric label="Total de vistorias" value={stats?.total} />
              <Metric label="Pendentes" value={stats?.pendingTotal} />
              <Metric label="Média (%)" value={stats?.averagePercentual} percent />
              <Metric label="Média score (%)" value={stats?.averageScorePercent} percent />
            </Box>
            {work.origin === InvestmentWorkOrigin.IMPORT && (
              <>
                <Typography variant="subtitle1">Descrições</Typography>
                <List dense>
                  {(work.descriptions ?? []).length === 0 ? (
                    <ListItem><ListItemText primary="Nenhuma descrição registrada." /></ListItem>
                  ) : (
                    (work.descriptions ?? []).map((description) => (
                      <ListItem key={description}><ListItemText primary={description} /></ListItem>
                    ))
                  )}
                </List>
              </>
            )}
            <Typography variant="subtitle1" sx={{ mt: 1 }}>Últimas vistorias</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Serviço</TableCell>
                  <TableCell>Data</TableCell>
                  <TableActionsHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(stats?.lastInspections ?? []).map((inspection) => (
                  <TableRow key={inspection.externalId ?? inspection.id}>
                    <TableCell>{inspection.module ?? "—"}</TableCell>
                    <TableCell>{inspection.status ?? "—"}</TableCell>
                    <TableCell>{inspection.serviceDescription ?? "—"}</TableCell>
                    <TableCell>{inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableActionsCell>
                      <TableActionsGroup>
                        <TableViewButton
                          label="Ver vistoria"
                          onClick={() => {
                            const id = inspection.externalId ?? inspection.id;
                            if (!id) return;
                            onClose();
                            navigate(`/inspections/${id}`, { state: { from } });
                          }}
                        />
                      </TableActionsGroup>
                    </TableActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

function Metric({ label, value, percent }: { label: string; value?: number | null; percent?: boolean }): JSX.Element {
  const text = typeof value === "number" ? (percent ? `${value.toFixed(2)}%` : String(value)) : "—";
  return (
    <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">{text}</Typography>
    </Box>
  );
}
