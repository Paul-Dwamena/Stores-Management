import { useAuth } from "../context/useAuth";

export function usePermission() {
  const { can, canAny, isSuperAdmin, permissionsReady } = useAuth();
  return { can, canAny, isSuperAdmin, permissionsReady };
}
