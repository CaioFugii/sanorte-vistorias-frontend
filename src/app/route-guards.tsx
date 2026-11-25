import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "./AppShell";
import { useAuthStore } from "@/stores/authStore";
import { AccessTab, UserRole } from "@/domain/enums";
import { User } from "@/domain/types";
import { canSeeAnyTab, firstVisibleRoute } from "@/domain/rules/access-area";

function homeForCurrentUser(): string {
  return firstVisibleRoute(useAuthStore.getState().user) ?? "/dashboard";
}

function guard(
  user: User | null,
  allowed: (user: User) => boolean,
  children: JSX.Element
): JSX.Element | null {
  if (!user?.role) return null;
  if (!allowed(user)) {
    return <Navigate to={homeForCurrentUser()} replace />;
  }
  return children;
}

export function ProtectedLayout(): JSX.Element {
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

export function RequireAnyTab({
  children,
  tabs,
}: {
  children: JSX.Element;
  tabs: readonly AccessTab[];
}): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  return guard(user, (current) => canSeeAnyTab(current, tabs), children);
}

export function RequireAdmin({ children }: { children: JSX.Element }): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  return guard(user, (current) => current.role === UserRole.ADMIN, children);
}

export function RequireRoles({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: UserRole[];
}): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  return guard(user, (current) => allowedRoles.includes(current.role), children);
}

export function RoleAwareHomeRedirect(): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  const target = firstVisibleRoute(user);
  if (!user?.role || !target) return null;
  return <Navigate to={target} replace />;
}

export function PendingsRedirect(): JSX.Element {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.delete("sub");
  params.set("tab", "pendencias");
  return <Navigate to={`/service-orders?${params.toString()}`} replace />;
}
