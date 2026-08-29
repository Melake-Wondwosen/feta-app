import { Routes, Route } from "react-router-dom";

import StartPage from "../pages/StartPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import AddOutletPage from "../pages/AddOutletPage";
import OutletPage from "../pages/OutletPage";
import SpinWheelPage from "../pages/SpinWheelPage";
import WinnerRegistrationPage from "../pages/WinnerRegistrationPage";
import CampaignSetupPage from "../pages/CampaignSetupPage";
import AdminPrizesPage from "../pages/AdminPrizesPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";
import ManagerRoute from "../components/ManagerRoute";
import ManagerDashboardPage from "../pages/ManagerDashboardPage";
import AdminHubPage from "../pages/AdminHubPage";
import AdminCitiesPage from "../pages/AdminCitiesPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminThemePage from "../pages/AdminThemePage";
import AdminPreviewPage from "../pages/AdminPreviewPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<StartPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes (BA must be logged in) */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-outlet"
        element={
          <ProtectedRoute>
            <AddOutletPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campaign/:id"
        element={
          <ProtectedRoute>
            <CampaignSetupPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/outlet/:id"
        element={
          <ProtectedRoute>
            <OutletPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/spin/:id"
        element={
          <ProtectedRoute>
            <SpinWheelPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/winner-register"
        element={
          <ProtectedRoute>
            <WinnerRegistrationPage />
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/manager"
        element={
          <ManagerRoute>
            <ManagerDashboardPage />
          </ManagerRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminHubPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/cities"
        element={
          <AdminRoute>
            <AdminCitiesPage />
          </AdminRoute>
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
        path="/admin/analytics"
        element={
          <AdminRoute>
            <ManagerDashboardPage national />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/theme"
        element={
          <AdminRoute>
            <AdminThemePage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/preview"
        element={
          <AdminRoute>
            <AdminPreviewPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/prizes"
        element={
          <AdminRoute>
            <AdminPrizesPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
