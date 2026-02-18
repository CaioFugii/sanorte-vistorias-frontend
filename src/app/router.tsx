import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import {
  ChecklistsPage,
  CollaboratorsPage,
  DashboardPage,
  FillInspectionPage,
  InspectionDetailPage,
  InspectionsPage,
  LoginPage,
  NewInspectionPage,
  PendingsPage,
  TeamsPage,
  UsersPage,
} from "@/pages";
import { useAuthStore } from "@/stores/authStore";

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

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/teams", element: <TeamsPage /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/collaborators", element: <CollaboratorsPage /> },
      { path: "/checklists", element: <ChecklistsPage /> },
      { path: "/inspections", element: <InspectionsPage /> },
      { path: "/inspections/mine", element: <InspectionsPage /> },
      { path: "/inspections/new", element: <NewInspectionPage /> },
      { path: "/inspections/:externalId", element: <InspectionDetailPage /> },
      { path: "/inspections/:externalId/fill", element: <FillInspectionPage /> },
      { path: "/pendings", element: <PendingsPage /> },
    ],
  },
]);
