import React from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { MobileTabBar } from "./components/MobileTabBar";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProfessionalsPage } from "./pages/ProfessionalsPage";
import { ProfessionalDetailPage } from "./pages/ProfessionalDetailPage";
import { PublicationsPage } from "./pages/PublicationsPage";
import { PublicationDetailPage } from "./pages/PublicationDetailPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ConversationsPage } from "./pages/ConversationsPage";
import { ConversationDetailPage } from "./pages/ConversationDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminAuditLogsPage } from "./pages/admin/AdminAuditLogsPage";
import { AdminVerificationsPage } from "./pages/admin/AdminVerificationsPage";
import { AdminPublicationsPage } from "./pages/admin/AdminPublicationsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";


export const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/professionals" element={<ProfessionalsPage />} />
          <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/publications/:id" element={<PublicationDetailPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <ConversationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:id"
            element={
              <ProtectedRoute>
                <ConversationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <AdminRoute>
                <AdminVerificationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/publications"
            element={
              <AdminRoute>
                <AdminPublicationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminRoute>
                <AdminAuditLogsPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <MobileTabBar />
    </>
  );
};

export default App;
