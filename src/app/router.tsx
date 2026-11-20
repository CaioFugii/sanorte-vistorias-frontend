import { Navigate, createBrowserRouter } from "react-router-dom";
import {
  ProtectedLayout,
  RequireAdmin,
  RequireAnyArea,
  RequireArea,
  RequireObrasInvTab,
  RequireRoles,
  RoleAwareHomeRedirect,
} from "./route-guards";
import {
  ChecklistsPage,
  ChecklistEditorPage,
  CollaboratorsPage,
  ContractsPage,
  DashboardPage,
  FillInspectionPage,
  InspectionDetailPage,
  InspectionsPage,
  LoginPage,
  ManageInspectionPage,
  NewInspectionPage,
  PendingsPage,
  QualityAnalyticsPage,
  ReportFormPage,
  ReportTypesPage,
  SafetyAnalyticsPage,
  SectorsPage,
  ServiceOrdersPage,
  TeamsPage,
  FieldHierarchyPage,
  UsersPage,
} from "@/pages";
import { AccessArea, UserRole } from "@/domain/enums";
import { AccessProfilesPage } from "@/pages/AccessProfilesPage";

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
          <RequireArea area={AccessArea.GESTAO}>
            <DashboardPage />
          </RequireArea>
        ),
      },
      {
        path: "/quality/analytics",
        element: (
          <RequireArea area={AccessArea.QUALIDADE_DADOS}>
            <QualityAnalyticsPage />
          </RequireArea>
        ),
      },
      {
        path: "/safety/analytics",
        element: (
          <RequireArea area={AccessArea.SEGURANCA_DADOS}>
            <SafetyAnalyticsPage />
          </RequireArea>
        ),
      },
      {
        path: "/teams",
        element: (
          <RequireAdmin>
            <TeamsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/field-hierarchy",
        element: (
          <RequireAdmin>
            <FieldHierarchyPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/foremen",
        element: <Navigate to="/field-hierarchy?tab=encarregados" replace />,
      },
      {
        path: "/coordinators",
        element: <Navigate to="/field-hierarchy?tab=coordenadores" replace />,
      },
      {
        path: "/field-supervisors",
        element: <Navigate to="/field-hierarchy?tab=supervisores" replace />,
      },
      {
        path: "/contracts",
        element: (
          <RequireAdmin>
            <ContractsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/sectors",
        element: (
          <RequireAdmin>
            <SectorsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/access-profiles",
        element: (
          <RequireAdmin>
            <AccessProfilesPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/users",
        element: (
          <RequireAdmin>
            <UsersPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/collaborators",
        element: (
          <RequireAdmin>
            <CollaboratorsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/checklists",
        element: (
          <RequireAdmin>
            <ChecklistsPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/checklists/:id/edit",
        element: (
          <RequireAdmin>
            <ChecklistEditorPage />
          </RequireAdmin>
        ),
      },
      {
        path: "/service-orders",
        element: (
          <RequireArea area={AccessArea.QUALIDADE_PAINEL}>
            <ServiceOrdersPage />
          </RequireArea>
        ),
      },
      {
        path: "/investment-works",
        element: (
          <RequireArea area={AccessArea.QUALIDADE_PAINEL}>
            <RequireObrasInvTab>
              <Navigate to="/service-orders?tab=obras" replace />
            </RequireObrasInvTab>
          </RequireArea>
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
          <RequireArea area={AccessArea.QUALIDADE_PAINEL}>
            <Navigate to="/service-orders?tab=vistorias" replace />
          </RequireArea>
        ),
      },
      {
        path: "/safety/inspections",
        element: (
          <RequireArea area={AccessArea.SEGURANCA_DADOS}>
            <Navigate to="/safety/analytics?tab=vistorias" replace />
          </RequireArea>
        ),
      },
      {
        path: "/inspections/mine",
        element: (
          <RequireArea area={AccessArea.CAMPO_MINHAS}>
            <InspectionsPage />
          </RequireArea>
        ),
      },
      {
        path: "/inspections/new",
        element: (
          <RequireArea area={AccessArea.CAMPO_NOVA}>
            <NewInspectionPage />
          </RequireArea>
        ),
      },
      {
        path: "/inspections/:externalId",
        element: (
          <RequireAnyArea
            areas={[
              AccessArea.QUALIDADE_PAINEL,
              AccessArea.QUALIDADE_PENDENCIAS,
              AccessArea.SEGURANCA_DADOS,
              AccessArea.CAMPO_MINHAS,
            ]}
          >
            <InspectionDetailPage />
          </RequireAnyArea>
        ),
      },
      {
        path: "/inspections/:externalId/fill",
        element: (
          <RequireArea area={AccessArea.CAMPO_MINHAS}>
            <FillInspectionPage />
          </RequireArea>
        ),
      },
      {
        path: "/inspections/:externalId/manage",
        element: (
          <RequireAnyArea
            areas={[
              AccessArea.QUALIDADE_PAINEL,
              AccessArea.QUALIDADE_PENDENCIAS,
              AccessArea.SEGURANCA_DADOS,
              AccessArea.CAMPO_MINHAS,
            ]}
          >
            <ManageInspectionPage />
          </RequireAnyArea>
        ),
      },
      {
        path: "/pendings",
        element: (
          <RequireArea area={AccessArea.QUALIDADE_PENDENCIAS}>
            <PendingsPage />
          </RequireArea>
        ),
      },
      {
        path: "/reports/new",
        element: (
          <RequireArea area={AccessArea.ENGENHARIA_RELATORIOS}>
            <ReportTypesPage />
          </RequireArea>
        ),
      },
      {
        path: "/reports/new/:code",
        element: (
          <RequireArea area={AccessArea.ENGENHARIA_RELATORIOS}>
            <ReportFormPage />
          </RequireArea>
        ),
      },
    ],
  },
]);
