import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuth } from "./state/AuthContext";

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  );
}

export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to={isLoggedIn ? "/home" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isLoggedIn ? "/home" : "/login"} replace />} />
    </Routes>
  );
}
