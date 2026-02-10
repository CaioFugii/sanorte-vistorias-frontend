import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { useRepository } from '@/app/RepositoryProvider';
import { User } from '@/domain';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const repository = useRepository();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      const allUsers = await repository.getUsers();
      setUsers(allUsers);
    };
    loadUsers();
  }, [repository]);

  const handleLogin = () => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        login(user);
        navigate('/');
      }
    } else if (email) {
      // Login por email (mock - aceita qualquer senha)
      const user = users.find((u) => u.email === email);
      if (user) {
        login(user);
        navigate('/');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Vistorias em Campo
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Sistema de Gestão de Vistorias
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Selecionar Usuário (Mock)</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Selecionar Usuário (Mock)"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" align="center" sx={{ my: 2 }}>
              OU
            </Typography>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={!selectedUserId && !email}
            size="large"
          >
            Entrar
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};
