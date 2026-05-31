import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Compass, Shield, User, Wallet, Briefcase } from 'lucide-react';
import './Navbar.css';

import { api } from '../services/api';
import { translate } from '../utils/translations';

const Navbar = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = React.useState(localStorage.getItem('language') || 'English');
  React.useEffect(() => {
    const handleStorageChange = () => {
      setLanguage(localStorage.getItem('language') || 'English');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBecomeHost = async () => {
    const confirm = window.confirm("Would you like to register your account as a Host? This will connect you to our Host operational console where you can manage properties and track sales.");
    if (confirm) {
      try {
        const res = await api.auth.updateProfile({ role: 'owner' });
        setUser(res.user);
        window.location.href = 'http://localhost:5174?token=' + (localStorage.getItem('token') || '');
      } catch (err) {
        alert(err.message || "Failed to switch role");
      }
    }
  };



  return (
    <header className="navbar-header">
      <div className="container flex-between navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="Nowhere Nest Logo" className="navbar-logo" />
          <span className="navbar-title">nowhere nest</span>
        </Link>

        <nav className="navbar-menu">
          <Link to="/" className="menu-item">
            <Home size={18} />
            <span>{translate('nav_stays', language)}</span>
          </Link>
          <Link to="/rentals" className="menu-item">
            <Compass size={18} />
            <span>{translate('nav_rentals', language)}</span>
          </Link>

          {user && user.role === 'customer' && (
            <button onClick={handleBecomeHost} className="menu-item become-host-badge" style={{ border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', background: 'transparent' }}>
              <Compass size={18} />
              <span>{translate('nav_become_host', language)}</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" className="menu-item admin-badge">
              <Shield size={18} />
              <span>{translate('nav_admin', language)}</span>
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              
              <Link to="/profile" className="user-avatar-pill" style={{ display: 'inline-flex', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '9999px', padding: '6px 12px', background: '#F8FAFC', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                <User size={16} style={{ marginRight: '6px' }} />
                <span className="user-name-label" style={{ fontWeight: '700' }}>{user.name.split(' ')[0]}</span>
                <span className="user-role-label" style={{ fontSize: '11px', color: 'var(--text-medium)', marginLeft: '4px' }}>({user.role})</span>
              </Link>

              <button onClick={handleLogout} className="btn-logout" title={translate('nav_logout', language)}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="btn btn-outline btn-small">{translate('nav_signin', language)}</Link>
              <Link to="/login?signup=true" className="btn btn-primary btn-small">{translate('nav_register', language)}</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
