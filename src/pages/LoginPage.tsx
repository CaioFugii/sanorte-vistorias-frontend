import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/domain";
import { useAuthStore } from "@/stores/authStore";

function getPostLoginPath(role: UserRole | undefined): string {
  return role === UserRole.FISCAL ? "/inspections/mine" : "/dashboard";
}

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loadMe, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      await loadMe();
      const { user: currentUser } = useAuthStore.getState();
      navigate(getPostLoginPath(currentUser?.role), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background:
          "radial-gradient(circle at 15% 15%, rgba(47,111,214,0.32), transparent 38%), radial-gradient(circle at 85% 80%, rgba(154,214,31,0.2), transparent 36%), linear-gradient(130deg, #091744 0%, #0B1F5B 50%, #102A77 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 520,
            mx: "auto",
            bgcolor: "#EEF2F7",
            borderColor: "#C9D8F8",
            boxShadow: "0 24px 50px rgba(4, 13, 41, 0.4)",
            backdropFilter: "blur(4px)",
            color: "#1A2750",
            "& .MuiOutlinedInput-root": {
              bgcolor: "#F4F7FF",
            },
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.,
              py: 1,
              mb: 1.5,
              borderRadius: 1.5,
              bgcolor: "#0B1F5B",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 6px 16px rgba(11, 31, 91, 0.28)",
            }}
          >
            <Box
              component="img"
              src="https://sanorte.com.br/wp-content/uploads/2025/05/Layer-2.svg"
              alt="Sanorte"
              sx={{
                height: 35,
                width: "auto",
                display: "block",
              }}
            />
          </Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ color: "#1A2750" }}>
            Vistorias Operacionais
          </Typography>
          <Typography sx={{ mb: 3, color: "#33456F" }}>
            Acesse o sistema corporativo para acompanhamento técnico das inspeções.
          </Typography>

          <form onSubmit={handleLogin}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading || !email || !password}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Entrar"}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};
