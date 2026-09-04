import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMe, loginUser } from "../services/authService";
import { createPermissionChecker, isSuperAdminRole } from "../permissions/permissionMatch";
import { AuthContext } from "./useAuth";

const readStoredUser = () => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    localStorage.removeItem("userInfo");
    return null;
  }
};

const persist = (session) => {
  if (session) localStorage.setItem("userInfo", JSON.stringify(session));
  else localStorage.removeItem("userInfo");
  return session;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [permissionsReady, setPermissionsReady] = useState(() => !readStoredUser()?.token);
  const loadSeq = useRef(0);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const applyProfile = (profile) => {
    setUser((current) => persist({ ...current, ...profile, token: current?.token }));
  };

  const logout = useCallback(() => {
    loadSeq.current += 1;
    setUser(null);
    persist(null);
    setPermissionsReady(true);
  }, []);

  const loadSessionProfile = useCallback(async ({ quiet = false } = {}) => {
    const seq = ++loadSeq.current;
    if (!quiet) setPermissionsReady(false);

    try {
      const profile = await getMe();
      if (seq !== loadSeq.current) return null;
      setUser((current) => {
        if (!current) return current;
        return persist({
          ...current,
          ...profile,
          token: current.token,
        });
      });
      return profile;
    } catch (err) {
      if (seq !== loadSeq.current) return null;
      if (err?.response?.status === 401 || err?.status === 401) {
        logout();
        return null;
      }
      // Fail closed for page access if /me succeeds without permissions, or keep empty on soft failure.
      setUser((current) => (current ? persist({ ...current, permissions: [] }) : current));
      return null;
    } finally {
      if (seq === loadSeq.current && !quiet) setPermissionsReady(true);
    }
  }, [logout]);

  const refreshPermissions = useCallback(
    async ({ quiet = true } = {}) => {
      if (!userRef.current?.token) return;
      await loadSessionProfile({ quiet });
    },
    [loadSessionProfile],
  );

  useEffect(() => {
    const hydrate = async () => {
      if (!readStoredUser()?.token) {
        setPermissionsReady(true);
        return;
      }
      await loadSessionProfile({ quiet: false });
    };

    hydrate();

    const onExpired = () => logout();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!userRef.current?.token) return;
      refreshPermissions({ quiet: true });
    };

    window.addEventListener("auth-expired", onExpired);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("auth-expired", onExpired);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadSessionProfile, logout, refreshPermissions]);

  const login = async (email, password) => {
    setPermissionsReady(false);
    const session = persist({ ...(await loginUser(email, password)), permissions: [] });
    setUser(session);
    await loadSessionProfile({ quiet: false });
    return readStoredUser() || session;
  };

  const isSuperAdmin = isSuperAdminRole(user?.roleName || user?.role);
  const { can, canAny } = useMemo(
    () => createPermissionChecker(user?.permissions, isSuperAdmin),
    [user?.permissions, isSuperAdmin],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        applyProfile,
        can,
        canAny,
        isSuperAdmin,
        permissionsReady,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
