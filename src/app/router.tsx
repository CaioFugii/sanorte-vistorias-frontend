import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import {
  ChecklistsPage,
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

function BlockFiscalRoute({ children }: { children: JSX.Element }): JSX.Element {
  const role = useAuthStore((state) => state.user?.role);
  if (role === UserRole.FISCAL) {
    return <Navigate to="/inspections/mine" replace />;
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
      { path: "/dashboard", element: <BlockFiscalRoute><DashboardPage /></BlockFiscalRoute> },
      { path: "/quality/analytics", element: <BlockFiscalRoute><QualityAnalyticsPage /></BlockFiscalRoute> },
      { path: "/safety/analytics", element: <BlockFiscalRoute><SafetyAnalyticsPage /></BlockFiscalRoute> },
      { path: "/teams", element: <TeamsPage /> },
      { path: "/contracts", element: <ContractsPage /> },
      { path: "/sectors", element: <SectorsPage /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/collaborators", element: <CollaboratorsPage /> },
      { path: "/checklists", element: <ChecklistsPage /> },
      { path: "/service-orders", element: <ServiceOrdersPage /> },
      { path: "/investment-works", element: <InvestmentWorksPage /> },
      { path: "/inspections", element: <InspectionsPage /> },
      { path: "/quality/inspections", element: <QualityInspectionsPage /> },
      { path: "/safety/inspections", element: <SafetyInspectionsPage /> },
      { path: "/inspections/mine", element: <InspectionsPage /> },
      { path: "/inspections/new", element: <NewInspectionPage /> },
      { path: "/inspections/:externalId", element: <InspectionDetailPage /> },
      { path: "/inspections/:externalId/fill", element: <FillInspectionPage /> },
      { path: "/inspections/:externalId/manage", element: <ManageInspectionPage /> },
      { path: "/pendings", element: <PendingsPage /> },
      { path: "/reports/new", element: <ReportTypesPage /> },
      { path: "/reports/new/:code", element: <ReportFormPage /> },
    ],
  },
]);
