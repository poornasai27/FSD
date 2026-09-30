import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark" />
        <span className="brand-text">MockMate AI</span>
      </Link>
      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/setup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Start Interview
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          History
        </NavLink>
      </nav>
      <div className="nav-user">
        {isAuthenticated ? (
          <>
            <span className="user-chip">{user?.name}</span>
            <button type="button" className="secondary-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className="secondary-button">
            Login
          </NavLink>
        )}
      </div>
    </header>
  );
}

export default Navbar;
