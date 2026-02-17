import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api";
import { useAuth } from "../state/AuthContext";

export default function Navbar() {
  const { username, token, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Ignore logout errors for demo mode and clear local session anyway.
    } finally {
      signOut();
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="brand">CityVision</div>
      <div className="nav-links">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </div>
      <div className="nav-user">
        <span>{username ?? "Operator"}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
