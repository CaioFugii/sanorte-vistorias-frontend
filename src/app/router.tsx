import { Navigate, createBrowserRouter } from "react-router-dom";
import {
  PendingsRedirect,
  ProtectedLayout,
  RequireAdmin,
  RequireAnyTab,
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
import {
  AccessTab,
  PAINEL_TABS,
  PENDENCIAS_TABS,
  QUALIDADE_DADOS_TABS,
  SEGURANCA_DADOS_TABS,
  UserRole,
} from "@/domain/enums";
import { INSPECTION_DETAIL_TABS } from "@/domain/rules/access-area";
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
          <RequireAnyTab tabs={[AccessTab.GESTAO]}>
            <DashboardPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/quality/analytics",
        element: (
          <RequireAnyTab tabs={QUALIDADE_DADOS_TABS}>
            <QualityAnalyticsPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/safety/analytics",
        element: (
          <RequireAnyTab tabs={SEGURANCA_DADOS_TABS}>
            <SafetyAnalyticsPage />
          </RequireAnyTab>
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
          <RequireAnyTab tabs={PAINEL_TABS}>
            <ServiceOrdersPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/investment-works",
        element: (
          <RequireAnyTab tabs={[AccessTab.PAINEL_OBRAS]}>
            <Navigate to="/service-orders?tab=obras" replace />
          </RequireAnyTab>
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
          <RequireAnyTab tabs={[AccessTab.PAINEL_VISTORIAS]}>
            <Navigate to="/service-orders?tab=vistorias" replace />
          </RequireAnyTab>
        ),
      },
      {
        path: "/safety/inspections",
        element: (
          <RequireAnyTab tabs={[AccessTab.SEGURANCA_DADOS_VISTORIAS]}>
            <Navigate to="/safety/analytics?tab=vistorias" replace />
          </RequireAnyTab>
        ),
      },
      {
        path: "/inspections/mine",
        element: (
          <RequireAnyTab tabs={[AccessTab.CAMPO_MINHAS]}>
            <InspectionsPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/inspections/new",
        element: (
          <RequireAnyTab tabs={[AccessTab.CAMPO_NOVA]}>
            <NewInspectionPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/inspections/:externalId",
        element: (
          <RequireAnyTab tabs={INSPECTION_DETAIL_TABS}>
            <InspectionDetailPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/inspections/:externalId/fill",
        element: (
          <RequireAnyTab tabs={[AccessTab.CAMPO_MINHAS]}>
            <FillInspectionPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/inspections/:externalId/manage",
        element: (
          <RequireAnyTab tabs={INSPECTION_DETAIL_TABS}>
            <ManageInspectionPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/pendings",
        element: (
          <RequireAnyTab tabs={PENDENCIAS_TABS}>
            <PendingsRedirect />
          </RequireAnyTab>
        ),
      },
      {
        path: "/reports/new",
        element: (
          <RequireAnyTab tabs={[AccessTab.ENGENHARIA_RELATORIOS]}>
            <ReportTypesPage />
          </RequireAnyTab>
        ),
      },
      {
        path: "/reports/new/:code",
        element: (
          <RequireAnyTab tabs={[AccessTab.ENGENHARIA_RELATORIOS]}>
            <ReportFormPage />
          </RequireAnyTab>
        ),
      },
    ],
  },
]);
