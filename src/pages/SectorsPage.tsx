import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { PaginatedResponse, Sector } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";

const DEFAULT_LIMIT = 10;

export const SectorsPage = (): JSX.Element => {
  const [result, setResult] = useState<PaginatedResponse<Sector> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error("Gestão de setores está disponível apenas online.");
      }
      const res = await appRepository.getSectors({ page, limit });
      setResult(res);
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Não foi possível carregar setores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit]);

  const sectors = result?.data ?? [];
  const meta = result?.meta;

  if (loading && !result) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Administração"
        title="Setores"
        subtitle="Mantenha a estrutura setorial utilizada nas ordens de serviço e checklists."
        actions={
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => load()}>
              Atualizar catálogo
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingSector(null);
                setName("");
                setActive(true);
                setDialogOpen(true);
              }}
            >
              Novo setor
            </Button>
          </Box>
        }
      />
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SectionTable title="Lista de setores">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : sectors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  Nenhum setor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
            sectors.map((sector) => (
              <TableRow key={sector.id}>
                <TableCell>{sector.name}</TableCell>
                <TableCell>{sector.active ? "Ativo" : "Inativo"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditingSector(sector);
                      setName(sector.name);
                      setActive(sector.active);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setDeletingSector(sector)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
        {meta && meta.total > 0 && (
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
      </SectionTable>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingSector ? "Editar setor" : "Novo setor"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              try {
                if (editingSector) {
                  await appRepository.updateSector(editingSector.id, { name, active });
                } else {
                  await appRepository.createSector({ name, active });
                }
                setDialogOpen(false);
                await load();
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deletingSector}
        title="Remover setor"
        description={`Deseja remover o setor "${deletingSector?.name ?? ""}"?`}
        confirmLabel="Remover"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingSector(null);
        }}
        onConfirm={async () => {
          if (!deletingSector || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteSector(deletingSector.id);
            setDeletingSector(null);
            await load();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
