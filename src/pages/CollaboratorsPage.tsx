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
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Collaborator, PaginatedResponse, Sector } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { SectorSelect } from "@/components/SectorSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";

const DEFAULT_LIMIT = 10;

export const CollaboratorsPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaginatedResponse<Collaborator> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [deletingCollaborator, setDeletingCollaborator] = useState<Collaborator | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [sectorTab, setSectorTab] = useState("all");
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        throw new Error("Gestão de colaboradores está disponível apenas online.");
      }
      const [collaboratorsResponse, sectorsData] = await Promise.all([
        appRepository.getCollaborators({
          page,
          limit,
          sectorId: sectorTab === "all" ? undefined : sectorTab,
        }),
        appRepository.loadSectors(true),
      ]);
      setResult(collaboratorsResponse);
      setSectors(sectorsData);
      setError(null);
    } catch (e) {
      setResult(null);
      setSectors([]);
      setError(e instanceof Error ? e.message : "Não foi possível carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, sectorTab]);

  useEffect(() => {
    if (sectorTab === "all") return;
    const exists = sectors.some((sector) => sector.id === sectorTab);
    if (!exists) {
      setSectorTab("all");
    }
  }, [sectors, sectorTab]);

  const collaborators = result?.data ?? [];
  const meta = result?.meta;

  if (loading && !result && !meta) {
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
        title="Colaboradores"
        subtitle="Gerencie colaboradores por setor para manter a operação organizada."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditing(null);
              setName("");
              setSectorId(sectors.find((sector) => sector.active)?.id ?? "");
              setActive(true);
              setDialogOpen(true);
            }}
          >
            Novo colaborador
          </Button>
        }
      />
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={sectorTab}
          onChange={(_, value: string) => {
            setSectorTab(value);
            setPage(1);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="all" label="Todos" />
          {sectors.map((sector) => (
            <Tab key={sector.id} value={sector.id} label={sector.name} />
          ))}
        </Tabs>
      </Box>

      <SectionTable title="Lista de colaboradores">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Setor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : collaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
            collaborators.map((collaborator) => (
              <TableRow key={collaborator.id}>
                <TableCell>{collaborator.name}</TableCell>
                <TableCell>{collaborator.sector?.name || "-"}</TableCell>
                <TableCell>{collaborator.active ? "Ativo" : "Inativo"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditing(collaborator);
                      setName(collaborator.name);
                      setSectorId(collaborator.sectorId);
                      setActive(collaborator.active);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setDeletingCollaborator(collaborator)}
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
        <DialogTitle>{editing ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Box mt={2}>
            <SectorSelect value={sectorId} onChange={setSectorId} options={sectors} required />
          </Box>
          <FormControlLabel
            control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />}
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !sectorId}
            onClick={async () => {
              if (editing) {
                await appRepository.updateCollaborator(editing.id, { name, sectorId, active });
              } else {
                await appRepository.createCollaborator({ name, sectorId, active });
              }
              setDialogOpen(false);
              await load();
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deletingCollaborator}
        title="Excluir colaborador"
        description={`Deseja excluir o colaborador "${deletingCollaborator?.name ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingCollaborator(null);
        }}
        onConfirm={async () => {
          if (!deletingCollaborator || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteCollaborator(deletingCollaborator.id);
            setDeletingCollaborator(null);
            await load();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
