import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Assignment,
  Checklist,
  Dashboard,
  Engineering,
  Groups,
  Logout,
  Menu as MenuIcon,
  Warning,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserRole } from "@/domain/enums";
import { useAuthStore } from "@/stores/authStore";

interface AppShellProps {
  children: React.ReactNode;
}

const drawerWidth = 260;

const menuByRole: Record<UserRole, Array<{ path: string; label: string; icon: JSX.Element }>> = {
  ADMIN: [
    { path: "/dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
    { path: "/users", label: "Usuários", icon: <Groups fontSize="small" /> },
    { path: "/teams", label: "Equipes", icon: <Groups fontSize="small" /> },
    { path: "/sectors", label: "Setores", icon: <Engineering fontSize="small" /> },
    { path: "/collaborators", label: "Colaboradores", icon: <Groups fontSize="small" /> },
    { path: "/checklists", label: "Checklists", icon: <Checklist fontSize="small" /> },
    { path: "/service-orders", label: "Ordens de Serviço", icon: <Assignment fontSize="small" /> },
    { path: "/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
    { path: "/pendings", label: "Pendências", icon: <Warning fontSize="small" /> },
  ],
  GESTOR: [
    { path: "/dashboard", label: "Dashboard", icon: <Dashboard fontSize="small" /> },
    { path: "/service-orders", label: "Ordens de Serviço", icon: <Assignment fontSize="small" /> },
    { path: "/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
    { path: "/pendings", label: "Pendências", icon: <Warning fontSize="small" /> },
  ],
  FISCAL: [
    { path: "/inspections/mine", label: "Minhas vistorias", icon: <Assignment fontSize="small" /> },
    { path: "/inspections/new", label: "Nova vistoria", icon: <Checklist fontSize="small" /> },
  ],
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuthStore();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      navigate("/login");
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout, navigate]);

  const menuItems = user ? menuByRole[user.role] : [];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2.5, py: 2, alignItems: "flex-start", minHeight: "auto !important" }}>
        <Box>
          <Box
            component="img"
            src="https://sanorte.com.br/wp-content/uploads/2025/05/Layer-2.svg"
            alt="Sanorte"
            sx={{
              height: 34,
              width: "auto",
              mb: 1,
              display: "block",
            }}
          />
          <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
            Vistorias Operacionais
          </Typography>
          <Chip
            label="Ambiente corporativo"
            size="small"
            color="success"
            sx={{ mt: 1, fontWeight: 700 }}
          />
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                color: "rgba(255,255,255,0.92)",
                "& .MuiListItemIcon-root": {
                  color: "inherit",
                  minWidth: 34,
                },
                "&.Mui-selected": {
                  color: "success.main",
                  bgcolor: "rgba(154, 214, 31, 0.14)",
                  "&:hover": {
                    bgcolor: "rgba(154, 214, 31, 0.2)",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.08)",
                },
              }}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{ justifyContent: "flex-start", fontWeight: 700 }}
        >
          Sair do sistema
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((value) => !value)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.72)" }}>
              Painel de operações
            </Typography>
            <Typography variant="h6">{user?.name ?? "Usuário"}</Typography>
          </Box>
          <Chip
            label={user?.role ?? "SEM PERFIL"}
            size="small"
            sx={{ mr: 1, bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }}
          />
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 9 },
        }}
      >
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
