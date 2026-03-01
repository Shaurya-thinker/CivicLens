import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    setIsLoggedIn(!!token);
    setRole(userRole);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setRole(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🏛️</span>
          CivicLens
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>Home</Link>
          {!isLoggedIn ? (
            <>
              <Link to="/login" className={isActive('/login') ? 'nav-link active' : 'nav-link'}>Citizen Login</Link>
              <Link to="/register" className={isActive('/register') ? 'nav-link active' : 'nav-link'}>Register</Link>
              <Link to="/admin/login" className={isActive('/admin/login') ? 'nav-link admin-link' : 'nav-link admin-link'}>
                Admin
              </Link>
            </>
          ) : (
            <>
              {role === 'citizen' && (
                <>
                  <Link to="/raise" className={isActive('/raise') ? 'nav-link active' : 'nav-link'}>Raise Complaint</Link>
                  <Link to="/my-complaints" className={isActive('/my-complaints') ? 'nav-link active' : 'nav-link'}>My Complaints</Link>
                </>
              )}
              {role === 'admin' && (
                <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'nav-link active' : 'nav-link'}>Dashboard</Link>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}