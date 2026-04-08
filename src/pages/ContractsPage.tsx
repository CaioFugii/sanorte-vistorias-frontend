import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";
import { Contract, PaginatedResponse, UserRole } from "@/domain";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_LIMIT = 10;

export const ContractsPage = (): JSX.Element => {
  const { hasRole } = useAuthStore();
  const canAccess = hasRole(UserRole.ADMIN);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResponse<Contract> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const loadContracts = async () => {
    setLoading(true);
    const res = await appRepository.getContracts({ page, limit });
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    if (!canAccess) return;
    void loadContracts();
  }, [canAccess, page, limit]);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const contracts = result?.data ?? [];
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
        title="Contratos"
        subtitle="Gerencie os contratos utilizados nas permissões e relacionamentos do sistema."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingContract(null);
              setName("");
              setDialogOpen(true);
            }}
          >
            Novo contrato
          </Button>
        }
      />

      <SectionTable title="Lista de contratos">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  Nenhum contrato cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.name}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditingContract(contract);
                        setName(contract.name);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => setDeletingContract(contract)}>
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
        <DialogTitle>{editingContract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome do contrato"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
                if (editingContract) {
                  await appRepository.updateContract(editingContract.id, { name });
                } else {
                  await appRepository.createContract({ name });
                }
                setDialogOpen(false);
                await loadContracts();
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
        open={!!deletingContract}
        title="Excluir contrato"
        description={`Deseja excluir o contrato "${deletingContract?.name ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingContract(null);
        }}
        onConfirm={async () => {
          if (!deletingContract || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteContract(deletingContract.id);
            setDeletingContract(null);
            await loadContracts();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
