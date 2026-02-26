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
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Sector } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const SectorsPage = (): JSX.Element => {
  const [sectors, setSectors] = useState<Sector[]>([]);
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
      const data = await appRepository.loadSectors(true);
      setSectors(data);
      setError(null);
    } catch (e) {
      setSectors([]);
      setError(e instanceof Error ? e.message : "Não foi possível carregar setores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <Typography variant="h4">Setores</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>
            Atualizar catalogo
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
      </Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sectors.map((sector) => (
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
