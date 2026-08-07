import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import {
  ChecklistsPage,
  ChecklistEditorPage,
  CollaboratorsPage,
  ContractsPage,
  DashboardPage,
  FillInspectionPage,
  InvestmentWorksPage,
  InspectionDetailPage,
  InspectionsPage,
  LoginPage,
  ManageInspectionPage,
  NewInspectionPage,
  PendingsPage,
  QualityAnalyticsPage,
  QualityInspectionsPage,
  ReportFormPage,
  ReportTypesPage,
  SafetyAnalyticsPage,
  SafetyInspectionsPage,
  SectorsPage,
  ServiceOrdersPage,
  TeamsPage,
  UsersPage,
} from "@/pages";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/domain/enums";

function ProtectedLayout(): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function getDefaultRouteForRole(role?: UserRole): string {
  if (role === UserRole.FISCAL) {
    return "/inspections/mine";
  }
  return "/dashboard";
}

function RequireRoles({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: UserRole[];
}): JSX.Element {
  const role = useAuthStore((state) => state.user?.role);
  // During bootstrap, allow rendering until /auth/me resolves role.
  if (!role) {
    return children;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }
  return children;
}

function RoleAwareHomeRedirect(): JSX.Element {
  const role = useAuthStore((state) => state.user?.role);
  if (role === UserRole.FISCAL) {
    return <Navigate to="/inspections/mine" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: (
          <RoleAwareHomeRedirect />
        ),
      },
      {
        path: "/dashboard",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR]}
          >
            <DashboardPage />
          </RequireRoles>
        ),
      },
      {
        path: "/quality/analytics",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR]}
          >
            <QualityAnalyticsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/safety/analytics",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR]}
          >
            <SafetyAnalyticsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/teams",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <TeamsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/contracts",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <ContractsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/sectors",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <SectorsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/users",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <UsersPage />
          </RequireRoles>
        ),
      },
      {
        path: "/collaborators",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <CollaboratorsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/checklists",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <ChecklistsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/checklists/:id/edit",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN]}>
            <ChecklistEditorPage />
          </RequireRoles>
        ),
      },
      {
        path: "/service-orders",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.FISCAL]}
          >
            <ServiceOrdersPage />
          </RequireRoles>
        ),
      },
      {
        path: "/investment-works",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN, UserRole.GESTOR]}>
            <InvestmentWorksPage />
          </RequireRoles>
        ),
      },
      {
        path: "/inspections",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR]}
          >
            <InspectionsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/quality/inspections",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN, UserRole.GESTOR]}>
            <QualityInspectionsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/safety/inspections",
        element: (
          <RequireRoles allowedRoles={[UserRole.ADMIN, UserRole.GESTOR]}>
            <SafetyInspectionsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/inspections/mine",
        element: (
          <RequireRoles allowedRoles={[UserRole.FISCAL]}>
            <InspectionsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/inspections/new",
        element: (
          <RequireRoles allowedRoles={[UserRole.FISCAL]}>
            <NewInspectionPage />
          </RequireRoles>
        ),
      },
      { path: "/inspections/:externalId", element: <InspectionDetailPage /> },
      { path: "/inspections/:externalId/fill", element: <FillInspectionPage /> },
      { path: "/inspections/:externalId/manage", element: <ManageInspectionPage /> },
      {
        path: "/pendings",
        element: (
          <RequireRoles
            allowedRoles={[UserRole.ADMIN, UserRole.GESTOR, UserRole.SUPERVISOR]}
          >
            <PendingsPage />
          </RequireRoles>
        ),
      },
      {
        path: "/reports/new",
        element: (
          <RequireRoles
            allowedRoles={[
              UserRole.ADMIN,
              UserRole.GESTOR,
              UserRole.SUPERVISOR,
              UserRole.FISCAL,
            ]}
          >
            <ReportTypesPage />
          </RequireRoles>
        ),
      },
      {
        path: "/reports/new/:code",
        element: (
          <RequireRoles
            allowedRoles={[
              UserRole.ADMIN,
              UserRole.GESTOR,
              UserRole.SUPERVISOR,
              UserRole.FISCAL,
            ]}
          >
            <ReportFormPage />
          </RequireRoles>
        ),
      },
    ],
  },
]);
