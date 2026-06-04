import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Home, 
  Building2, 
  Bed, 
  CalendarCheck, 
  Brush, 
  Users, 
  Tag, 
  IndianRupee, 
  Settings, 
  User, 
  Menu,
  X,
  Video,
  MessageSquare
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  if (!user) return null; // Don't show Navbar if not logged in

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Header (only visible on mobile/tablet via CSS) */}
      <div className="mobile-header">
        <button onClick={toggleSidebar} className="menu-toggle-btn" aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
        <Link to="/" className="brand-panel">
          <img src="/logo.png" alt="Nowhere Nest Logo" className="brand-logo" />
          <span className="brand-title">nowhere nest</span>
        </Link>
        <div className="mobile-user-icon flex-center">
          <User size={16} />
        </div>
      </div>

      {/* Backdrop overlay for mobile/tablet */}
      {isOpen && <div className="sidebar-overlay-backdrop" onClick={closeSidebar}></div>}

      {/* Sidebar Navigation */}
      <aside className={`host-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-area flex-between">
          <Link to="/" className="brand-panel" onClick={closeSidebar}>
            <img src="/logo.png" alt="Nowhere Nest Logo" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-title">nowhere nest</span>
              <span className="brand-subtitle">Host Console</span>
            </div>
          </Link>
          <button onClick={closeSidebar} className="sidebar-close-btn" aria-label="Close Menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} onClick={closeSidebar}>
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/properties" className={`nav-item ${isActive('/properties') ? 'active' : ''}`} onClick={closeSidebar}>
            <Building2 size={18} />
            <span>Properties</span>
          </Link>
          <Link to="/rooms" className={`nav-item ${isActive('/rooms') ? 'active' : ''}`} onClick={closeSidebar}>
            <Bed size={18} />
            <span>Rooms</span>
          </Link>
          <Link to="/bookings" className={`nav-item ${isActive('/bookings') ? 'active' : ''}`} onClick={closeSidebar}>
            <CalendarCheck size={18} />
            <span>Reservations</span>
          </Link>
          <Link to="/housekeeping" className={`nav-item ${isActive('/housekeeping') ? 'active' : ''}`} onClick={closeSidebar}>
            <Brush size={18} />
            <span>Housekeeping</span>
          </Link>
          <Link to="/staff" className={`nav-item ${isActive('/staff') ? 'active' : ''}`} onClick={closeSidebar}>
            <Users size={18} />
            <span>Staff</span>
          </Link>
          <Link to="/promotions" className={`nav-item ${isActive('/promotions') ? 'active' : ''}`} onClick={closeSidebar}>
            <Tag size={18} />
            <span>Promotions</span>
          </Link>
          <Link to="/vibes" className={`nav-item ${isActive('/vibes') ? 'active' : ''}`} onClick={closeSidebar}>
            <Video size={18} />
            <span>NWN Vibes</span>
          </Link>
          <Link to="/finance" className={`nav-item ${isActive('/finance') ? 'active' : ''}`} onClick={closeSidebar}>
            <IndianRupee size={18} />
            <span>Finance</span>
          </Link>
          <Link to="/messages" className={`nav-item ${isActive('/messages') ? 'active' : ''}`} onClick={closeSidebar}>
            <MessageSquare size={18} />
            <span>Messages</span>
          </Link>
          <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} onClick={closeSidebar}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* User profile section docked at bottom */}
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-icon-wrapper flex-center" style={{ position: 'relative' }}>
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <User size={16} />
              )}
              {user.isLicensed && (
                <span title="Verified Host" style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '14px', height: '14px', background: '#22C55E',
                  borderRadius: '50%', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', color: 'white', fontWeight: '900'
                }}>✓</span>
              )}
            </div>
            <div className="user-meta">
              <span className="user-name">
                {user.name.split(' ')[0]}
                {user.isLicensed && <span style={{ color: '#22C55E', fontSize: '10px', marginLeft: '4px' }}>✔ Verified</span>}
              </span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
            <span className="logout-text">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
