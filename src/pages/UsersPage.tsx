import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { User } from "@/domain";
import { UserRole } from "@/domain/enums";
import { appRepository } from "@/repositories/AppRepository";

export const UsersPage = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.FISCAL);

  const load = async () => {
    setLoading(true);
    const result = await appRepository.getUsers({ page: 1, limit: 100 });
    setUsers(result.data);
    setLoading(false);
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
        <Typography variant="h4">Usuários</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditing(null);
            setName("");
            setEmail("");
            setPassword("");
            setRole(UserRole.FISCAL);
            setDialogOpen(true);
          }}
        >
          Novo usuário
        </Button>
      </Box>

      <TableContainer component={Paper}>
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
            {users.map((user) => (
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
                      setDialogOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={async () => {
                      if (!window.confirm("Deseja excluir este usuário?")) return;
                      await appRepository.deleteUser(user.id);
                      await load();
                    }}
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
            <MenuItem value={UserRole.ADMIN}>ADMIN</MenuItem>
            <MenuItem value={UserRole.GESTOR}>GESTOR</MenuItem>
            <MenuItem value={UserRole.FISCAL}>FISCAL</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!name.trim() || !email.trim() || (!editing && !password.trim())}
            onClick={async () => {
              if (editing) {
                await appRepository.updateUser(editing.id, {
                  name,
                  email,
                  role,
                  password: password.trim() ? password : undefined,
                });
              } else {
                await appRepository.createUser({ name, email, password, role });
              }
              setDialogOpen(false);
              await load();
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
