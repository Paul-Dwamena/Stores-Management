import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { GlobalToastProvider } from "./components/common/ToastNotification";
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

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
            <Route index element={<Overview />} />
            <Route path="stores" element={<StoresHub />} />
            <Route path="requests" element={<RequestsList />} />
            <Route path="approvals" element={<ApprovalsList />} />
            <Route path="setups" element={<SetupsHub />} />
            <Route path="setups/dropdown-options" element={<Navigate to="/setups?tab=dropdown" replace />} />
            <Route path="setups/dropdown-options/:optionSlug" element={<DropdownOptionPlaceholder />} />
            <Route path="audit-trail" element={<AuditTrailList />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
