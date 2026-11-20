import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useEffect, useState } from "react";
import { InvestmentWorkImportPreview } from "@/domain";

export function InvestmentWorkImportSelectionDialog({
  preview,
  saving,
  onCancel,
  onSave,
}: {
  preview: InvestmentWorkImportPreview | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (keys: string[]) => void;
}): JSX.Element {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelected({});
  }, [preview]);

  const keys = Object.entries(selected).filter(([, marked]) => marked).map(([key]) => key);

  return (
    <Dialog open={Boolean(preview)} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Descrições da planilha</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Quantidade</TableCell>
              <TableCell>Cadastrar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(preview?.descriptions ?? []).map((item) => (
              <TableRow key={item.key}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.count}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={Boolean(selected[item.key])}
                    onChange={(event) =>
                      setSelected((current) => ({ ...current, [item.key]: event.target.checked }))
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button variant="contained" disabled={saving || keys.length === 0} onClick={() => onSave(keys)}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
