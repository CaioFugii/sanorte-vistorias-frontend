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
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu as MenuIcon, Sync as SyncIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UserRole } from "@/domain/enums";
import { useAutoSync } from "@/app/useAutoSync";
import { appRepository } from "@/repositories/AppRepository";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

interface AppShellProps {
  children: React.ReactNode;
}

const drawerWidth = 260;

const menuByRole: Record<UserRole, Array<{ path: string; label: string }>> = {
  ADMIN: [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/users", label: "Usuários" },
    { path: "/teams", label: "Equipes" },
    { path: "/collaborators", label: "Colaboradores" },
    { path: "/checklists", label: "Checklists" },
    { path: "/inspections", label: "Vistorias" },
    { path: "/pendings", label: "Pendências" },
  ],
  GESTOR: [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/inspections", label: "Vistorias" },
    { path: "/pendings", label: "Pendências" },
  ],
  FISCAL: [
    { path: "/inspections/mine", label: "Minhas vistorias" },
    { path: "/inspections/new", label: "Nova vistoria" },
  ],
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuthStore();
  const { pendingSyncCount, setPendingSyncCount } = useUiStore();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useAutoSync();

  useEffect(() => {
    const refreshPending = async () => {
      const count = await appRepository.countPendingSync();
      setPendingSyncCount(count);
    };
    refreshPending();
  }, [location.pathname, setPendingSyncCount]);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      navigate("/login");
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout, navigate]);

  const handleSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      await appRepository.syncAll();
      const count = await appRepository.countPendingSync();
      setPendingSyncCount(count);
    } catch {
      // Mantém contador atual; usuário vê que ainda há pendentes
    } finally {
      setSyncing(false);
    }
  };

  const menuItems = user ? menuByRole[user.role] : [];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6">Sanorte</Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((value) => !value)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {user?.name ?? "Usuário"}
          </Typography>
          <Chip
            label={online ? "Online" : "Offline"}
            size="small"
            sx={{
              mr: 1.5,
              bgcolor: online ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)",
              color: "inherit",
              fontWeight: 500,
              "& .MuiChip-icon": { color: online ? "#81c784" : "#e57373" },
            }}
            icon={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: online ? "#81c784" : "#e57373",
                  ml: 0.5,
                }}
              />
            }
          />
          {online && (
            <Button
              color="inherit"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              disabled={syncing || pendingSyncCount === 0}
              sx={{ mr: 1 }}
            >
              {syncing ? "Sincronizando..." : pendingSyncCount > 0 ? `Sincronizar (${pendingSyncCount})` : "Sincronizar"}
            </Button>
          )}
          <Button color="inherit" onClick={logout}>
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

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <OfflineBanner />
        <Box sx={{ mt: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
}
