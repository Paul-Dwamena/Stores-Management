import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  login: async () => null,
  logout: () => {},
  applyProfile: () => {},
  can: () => false,
  canAny: () => false,
  isSuperAdmin: false,
  permissionsReady: true,
  refreshPermissions: async () => {},
});

export const useAuth = () => useContext(AuthContext);
