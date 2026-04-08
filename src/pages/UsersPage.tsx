import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Contract, PaginatedResponse, User } from "@/domain";
import { UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListPagination } from "@/components/ListPagination";
import { PageHeader, SectionTable } from "@/components/ui";

const DEFAULT_LIMIT = 10;

export const UsersPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResponse<User> | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.FISCAL);
  const [contractOptions, setContractOptions] = useState<Contract[]>([]);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await appRepository.getUsers({ page, limit });
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [page, limit]);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const result = await appRepository.getContracts({ page: 1, limit: 100 });
        setContractOptions(result.data);
      } catch {
        setContractOptions([]);
      }
    };
    void loadContracts();
  }, []);

  const users = result?.data ?? [];
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
        title="Usuários"
        subtitle="Gerencie acessos e perfis do sistema corporativo."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditing(null);
              setName("");
              setEmail("");
              setPassword("");
              setRole(UserRole.FISCAL);
              setSelectedContractIds([]);
              setDialogOpen(true);
            }}
          >
            Novo usuário
          </Button>
        }
      />

      <SectionTable title="Lista de usuários">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setEditing(user);
                      setName(user.name);
                      setEmail(user.email);
                      setPassword("");
                      setRole(user.role);
                      setSelectedContractIds(user.contractIds ?? user.contracts?.map((contract) => contract.id) ?? []);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setDeletingUser(user)}
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
        <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            type="password"
            label={editing ? "Nova senha (opcional)" : "Senha"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            select
            label="Perfil"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            {/* <MenuItem value={UserRole.ADMIN}>ADMIN</MenuItem> */}
            <MenuItem value={UserRole.GESTOR}>GESTOR</MenuItem>
            <MenuItem value={UserRole.FISCAL}>FISCAL</MenuItem>
          </TextField>
          <Autocomplete
            multiple
            options={contractOptions}
            value={contractOptions.filter((contract) => selectedContractIds.includes(contract.id))}
            onChange={(_, selectedContracts) => setSelectedContractIds(selectedContracts.map((contract) => contract.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                fullWidth
                label="Contratos"
                placeholder="Selecione os contratos"
                helperText="Selecione ao menos um contrato"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !email.trim() || (!editing && !password.trim()) || selectedContractIds.length === 0}
            onClick={async () => {
              if (editing) {
                await appRepository.updateUser(editing.id, {
                  name,
                  email,
                  role,
                  password: password.trim() ? password : undefined,
                  contractIds: selectedContractIds,
                });
              } else {
                await appRepository.createUser({
                  name,
                  email,
                  password,
                  role,
                  contractIds: selectedContractIds,
                });
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
        open={!!deletingUser}
        title="Excluir usuário"
        description={`Deseja excluir o usuário "${deletingUser?.name ?? ""}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeletingUser(null);
        }}
        onConfirm={async () => {
          if (!deletingUser || deleting) return;
          setDeleting(true);
          try {
            await appRepository.deleteUser(deletingUser.id);
            setDeletingUser(null);
            await load();
          } finally {
            setDeleting(false);
          }
        }}
      />
    </Box>
  );
};
