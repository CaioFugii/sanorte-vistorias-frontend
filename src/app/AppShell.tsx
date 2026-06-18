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
  Collapse,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Assignment,
  BarChart,
  BusinessCenter,
  Checklist,
  Dashboard,
  Description,
  Engineering,
  ExpandLess,
  ExpandMore,
  Groups,
  HomeWork,
  Logout,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
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

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 76;

interface MenuLeaf {
  path: string;
  label: string;
  icon: JSX.Element;
}

interface MenuGroup {
  label: string;
  icon: JSX.Element;
  items?: MenuLeaf[];
  path?: string;
}

const menuGroupsByRole: Record<UserRole, MenuGroup[]> = {
  ADMIN: [
    { label: "Gestão", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
    {
      label: "Qualidade",
      icon: <Checklist fontSize="small" />,
      items: [
        { path: "/quality/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
        { path: "/service-orders", label: "Ordens de Serviço", icon: <Assignment fontSize="small" /> },
        { path: "/quality/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
        { path: "/pendings", label: "Pendências", icon: <Warning fontSize="small" /> },
      ],
    },
    {
      label: "Segurança do Trabalho",
      icon: <Warning fontSize="small" />,
      items: [
        { path: "/safety/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
        { path: "/safety/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
      ],
    },
    {
      label: "Engenharia",
      icon: <Engineering fontSize="small" />,
      items: [
        { path: "/investment-works", label: "Obras de Investimento", icon: <HomeWork fontSize="small" /> },
        { path: "/reports/new", label: "Relatórios", icon: <Description fontSize="small" /> } ],
    },
    {
      label: "Administração",
      icon: <Groups fontSize="small" />,
      items: [
        { path: "/users", label: "Usuários", icon: <Groups fontSize="small" /> },
        { path: "/teams", label: "Equipes", icon: <Groups fontSize="small" /> },
        { path: "/contracts", label: "Contratos", icon: <BusinessCenter fontSize="small" /> },
        { path: "/sectors", label: "Setores", icon: <Engineering fontSize="small" /> },
        { path: "/collaborators", label: "Colaboradores", icon: <Groups fontSize="small" /> },
        { path: "/checklists", label: "Checklists", icon: <Checklist fontSize="small" /> },
      ],
    },
  ],
  GESTOR: [
    { label: "Gestão", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
    {
      label: "Qualidade",
      icon: <Checklist fontSize="small" />,
      items: [
        { path: "/quality/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
        { path: "/service-orders", label: "Ordens de Serviço", icon: <Assignment fontSize="small" /> },
        { path: "/quality/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
        { path: "/pendings", label: "Pendências", icon: <Warning fontSize="small" /> },
      ],
    },
    {
      label: "Segurança do Trabalho",
      icon: <Warning fontSize="small" />,
      items: [
        { path: "/safety/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
        { path: "/safety/inspections", label: "Vistorias", icon: <Assignment fontSize="small" /> },
      ],
    },
    {
      label: "Engenharia",
      icon: <Engineering fontSize="small" />,
      items: [
        { path: "/investment-works", label: "Obras de Investimento", icon: <HomeWork fontSize="small" /> },
        { path: "/reports/new", label: "Relatórios", icon: <Description fontSize="small" /> },
      
      ],
    },
  ],
  SUPERVISOR: [
    { label: "Gestão", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
    {
      label: "Qualidade",
      icon: <Checklist fontSize="small" />,
      items: [
        { path: "/quality/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
        { path: "/pendings", label: "Pendências", icon: <Warning fontSize="small" /> },
      ],
    },
    {
      label: "Segurança do Trabalho",
      icon: <Warning fontSize="small" />,
      items: [
        { path: "/safety/analytics", label: "Dados", icon: <BarChart fontSize="small" /> },
      ],
    },
    {
      label: "Engenharia",
      icon: <Engineering fontSize="small" />,
      items: [{ path: "/reports/new", label: "Relatórios", icon: <Description fontSize="small" /> }],
    },
  ],
  FISCAL: [
    {
      label: "Minhas Vistorias",
      icon: <Assignment fontSize="small" />,
      path: "/inspections/mine",
    },
    {
      label: "Nova Vistoria",
      icon: <Assignment fontSize="small" />,
      path: "/inspections/new",
    },
    {
      label: "Ordens de Serviço",
      icon: <Assignment fontSize="small" />,
      path: "/service-orders",
    },
    {
      label: "Relatórios",
      icon: <Description fontSize="small" />,
      path: "/reports/new",
    },
  ],
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    const saved = window.localStorage.getItem("app:sidebar:collapsed");
    return saved === "true";
  });
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Qualidade: false,
    "Segurança do Trabalho": false,
    Engenharia: false,
    Administração: false,
  });
  const desktopDrawerWidth = desktopCollapsed
    ? DRAWER_WIDTH_COLLAPSED
    : DRAWER_WIDTH_EXPANDED;

  useEffect(() => {
    window.localStorage.setItem(
      "app:sidebar:collapsed",
      String(desktopCollapsed)
    );
  }, [desktopCollapsed]);
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

  const menuGroups = user ? menuGroupsByRole[user.role] : [];

  useEffect(() => {
    if (!user) return;
    const routeGroup = menuGroupsByRole[user.role].find((group) =>
      group.items?.some((item) =>
        item.path === "/reports/new"
          ? location.pathname.startsWith("/reports/")
          : location.pathname === item.path
      )
    );
    if (routeGroup) {
      setOpenGroups((current) => ({ ...current, [routeGroup.label]: true }));
    }
  }, [location.pathname, user]);

  const isItemSelected = (path: string): boolean => {
    if (path === "/reports/new") {
      return location.pathname.startsWith("/reports/");
    }
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          px: desktopCollapsed ? 1.5 : 2.5,
          py: 2,
          alignItems: desktopCollapsed ? "center" : "flex-start",
          justifyContent: desktopCollapsed ? "center" : "flex-start",
          minHeight: "auto !important",
        }}
      >
        <Box>
          <Box
            component="img"
            src="https://sanorte.com.br/wp-content/uploads/2025/05/Layer-2.svg"
            alt="Sanorte"
            sx={{
              height: 34,
              width: "auto",
              mb: desktopCollapsed ? 0 : 1,
              display: "block",
            }}
          />
          {!desktopCollapsed && (
            <>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                Vistorias Operacionais
              </Typography>
              <Chip
                label="Ambiente corporativo"
                size="small"
                color="success"
                sx={{ mt: 1, fontWeight: 700 }}
              />
            </>
          )}
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
        {menuGroups.map((group) => {
          const groupHasChildren = Boolean(group.items?.length);
          const isGroupOpen = openGroups[group.label] ?? false;
          const groupSelected = group.path
            ? isItemSelected(group.path)
            : Boolean(group.items?.some((item) => isItemSelected(item.path)));

          return (
            <Box key={group.label}>
              <ListItem disablePadding>
                <Tooltip
                  title={desktopCollapsed && !isMobile ? group.label : ""}
                  placement="right"
                >
                  <ListItemButton
                    selected={groupSelected}
                    sx={{
                      borderRadius: 2,
                      mb: 0.25,
                      minHeight: 42,
                      justifyContent: desktopCollapsed ? "center" : "initial",
                      color: "rgba(255,255,255,0.92)",
                      "& .MuiListItemIcon-root": {
                        color: "inherit",
                        minWidth: desktopCollapsed ? 0 : 34,
                        mr: desktopCollapsed ? 0 : 0.5,
                        justifyContent: "center",
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
                      if (group.path) {
                        navigate(group.path);
                        if (isMobile) setMobileOpen(false);
                        return;
                      }
                      setOpenGroups((current) => ({
                        ...current,
                        [group.label]: !isGroupOpen,
                      }));
                    }}
                  >
                    <ListItemIcon>{group.icon}</ListItemIcon>
                    {!desktopCollapsed && (
                      <>
                        <ListItemText primary={group.label} />
                        {groupHasChildren ? isGroupOpen ? <ExpandLess /> : <ExpandMore /> : null}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
              {groupHasChildren && !desktopCollapsed && (
                <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.items?.map((item) => (
                      <ListItem key={item.path + group.label} disablePadding>
                        <ListItemButton
                          selected={isItemSelected(item.path)}
                          onClick={() => {
                            navigate(item.path);
                            if (isMobile) setMobileOpen(false);
                          }}
                          sx={{
                            borderRadius: 2,
                            ml: 1,
                            mb: 0.25,
                            minHeight: 38,
                            color: "rgba(255,255,255,0.88)",
                            "& .MuiListItemIcon-root": {
                              color: "inherit",
                              minWidth: 30,
                              mr: 0.5,
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
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ variant: "body2" }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
        {desktopCollapsed && !isMobile ? (
          <Tooltip title="Sair do sistema" placement="right">
            <IconButton color="inherit" onClick={handleLogout}>
              <Logout />
            </IconButton>
          </Tooltip>
        ) : (
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
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
          ml: { md: `${desktopDrawerWidth}px` },
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
          <Tooltip
            title={desktopCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            <IconButton
              color="inherit"
              onClick={() => setDesktopCollapsed((current) => !current)}
              sx={{ mr: 1, display: { xs: "none", md: "inline-flex" } }}
            >
              {desktopCollapsed ? (
                <KeyboardDoubleArrowRight />
              ) : (
                <KeyboardDoubleArrowLeft />
              )}
            </IconButton>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.72)" }}>
              Painel de operações
            </Typography>
            <Typography variant="h6">{user?.name ?? "Usuário"}</Typography>
          </Box>
          {user?.role === UserRole.ADMIN && (
            <Chip
              label={user.role}
              size="small"
              sx={{ mr: 1, bgcolor: "rgba(255,255,255,0.1)", color: "#fff" }}
            />
          )}
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: desktopDrawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH_EXPANDED,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: desktopDrawerWidth,
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
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
          width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
          mt: { xs: 8, md: 9 },
        }}
      >
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
