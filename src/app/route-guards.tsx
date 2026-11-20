import { Navigate, Outlet } from "react-router-dom";
import { AppShell } from "./AppShell";
import { useAuthStore } from "@/stores/authStore";
import { AccessArea, UserRole } from "@/domain/enums";
import { User } from "@/domain/types";
import { canSeeArea, firstVisibleRoute } from "@/domain/rules/access-area";

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

export function RequireArea({
  children,
  area,
}: {
  children: JSX.Element;
  area: AccessArea;
}): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  return guard(user, (current) => canSeeArea(current, area), children);
}

export function RequireAnyArea({
  children,
  areas,
}: {
  children: JSX.Element;
  areas: AccessArea[];
}): JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  return guard(user, (current) => areas.some((area) => canSeeArea(current, area)), children);
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
