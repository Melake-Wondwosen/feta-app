import { Routes, Route } from "react-router-dom";

import StartPage from "../pages/StartPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import AddOutletPage from "../pages/AddOutletPage";
import OutletPage from "../pages/OutletPage";
import SpinWheelPage from "../pages/SpinWheelPage";
import WinnerRegistrationPage from "../pages/WinnerRegistrationPage";
import CampaignSetupPage from "../pages/CampaignSetupPage";
import ProtectedRoute from "../components/ProtectedRoute";

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

    </Routes>
  );
}