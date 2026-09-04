import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { GlobalToastProvider } from "./components/common/ToastNotification";
import LoadingSpinner from "./components/common/LoadingSpinner";
import AccessDenied from "./components/common/AccessDenied";
import Layout from "./layouts/Layout";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Overview from "./pages/overview/Overview";
import StoresHub from "./pages/stores/StoresHub";
import { RequestsList } from "./pages/requests";
import { ApprovalsList } from "./pages/approvals";
import { SetupsHub } from "./pages/setups";
import { DropdownOptionPlaceholder } from "./pages/setups/dropdownOptions";
import { AuditTrailList } from "./pages/auditTrail";
import { AccountSettings } from "./pages/settings";
import {
  DROPDOWN_VIEW_ANY,
  findRouteAccess,
  getFirstAllowedPath,
  isAccessAllowed,
} from "./permissions/accessMap";

const ProtectedRoute = ({ children }) => {
  const { user, permissionsReady } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!permissionsReady) {
    return <LoadingSpinner variant="full" label="Loading permissions…" />;
  }
  return children;
};

const PermissionRoute = ({ children, permission, permissionAny, always = false }) => {
  const { can, canAny } = useAuth();
  const location = useLocation();
  const access = always
    ? { always: true }
    : permissionAny
      ? { permissionAny }
      : permission
        ? { permission }
        : findRouteAccess(location.pathname);

  if (isAccessAllowed(access, can, canAny)) {
    return children;
  }

  const fallback = getFirstAllowedPath(can, canAny);
  if (fallback && fallback !== location.pathname) {
    return <Navigate to={fallback} replace />;
  }
  return <AccessDenied />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalToastProvider />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <PermissionRoute always>
                  <Overview />
                </PermissionRoute>
              }
            />
            <Route
              path="stores"
              element={
                <PermissionRoute>
                  <StoresHub />
                </PermissionRoute>
              }
            />
            <Route
              path="requests"
              element={
                <PermissionRoute>
                  <RequestsList />
                </PermissionRoute>
              }
            />
            <Route
              path="approvals"
              element={
                <PermissionRoute>
                  <ApprovalsList />
                </PermissionRoute>
              }
            />
            <Route
              path="setups"
              element={
                <PermissionRoute>
                  <SetupsHub />
                </PermissionRoute>
              }
            />
            <Route path="setups/dropdown-options" element={<Navigate to="/setups?tab=dropdown" replace />} />
            <Route
              path="setups/dropdown-options/:optionSlug"
              element={
                <PermissionRoute permissionAny={DROPDOWN_VIEW_ANY}>
                  <DropdownOptionPlaceholder />
                </PermissionRoute>
              }
            />
            <Route
              path="audit-trail"
              element={
                <PermissionRoute>
                  <AuditTrailList />
                </PermissionRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PermissionRoute always>
                  <AccountSettings />
                </PermissionRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
