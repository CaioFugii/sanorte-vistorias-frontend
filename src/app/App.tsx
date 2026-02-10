import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { RepositoryProvider } from './RepositoryProvider';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { CollaboratorsPage } from '@/pages/CollaboratorsPage';
import { ChecklistsPage } from '@/pages/ChecklistsPage';
import { InspectionsPage } from '@/pages/InspectionsPage';
import { NewInspectionPage } from '@/pages/NewInspectionPage';
import { InspectionDetailPage } from '@/pages/InspectionDetailPage';
import { FillInspectionPage } from '@/pages/FillInspectionPage';
import { PendingsPage } from '@/pages/PendingsPage';
import { useSnackbar } from '@/utils/useSnackbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { SnackbarComponent } = useSnackbar();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RepositoryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Navigate to="/dashboard" replace />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <TeamsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaborators"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <CollaboratorsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checklists"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ChecklistsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections/mine"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections/new"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <NewInspectionPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections/:id"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionDetailPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections/:id/fill"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <FillInspectionPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pendings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <PendingsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <SnackbarComponent />
      </RepositoryProvider>
    </ThemeProvider>
  );
}

export default App;
