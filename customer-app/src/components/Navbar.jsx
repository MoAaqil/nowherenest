import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Compass, User, Bell, X, CheckCheck } from 'lucide-react';
import './Navbar.css';

import { api } from '../services/api';
import { translate } from '../utils/translations';

// ─── Notification Utilities ───────────────────────────────────────────────────

export const pushNotification = ({ type = 'info', title, body }) => {
  try {
    const stored = JSON.parse(localStorage.getItem('nwn_notifications') || '[]');
    const newNotif = {
      id: Date.now().toString(),
      type,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString()
    };
    stored.unshift(newNotif);
    // Keep only last 30
    localStorage.setItem('nwn_notifications', JSON.stringify(stored.slice(0, 30)));
    window.dispatchEvent(new Event('nwn_notif_update'));
  } catch (e) {
    console.error('Failed to push notification', e);
  }
};

export const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('nwn_notifications') || '[]');
  } catch {
    return [];
  }
};

export const markAllRead = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('nwn_notifications') || '[]');
    const updated = stored.map(n => ({ ...n, read: true }));
    localStorage.setItem('nwn_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('nwn_notif_update'));
  } catch (e) {
    console.error('Failed to mark notifications read', e);
  }
};

// ─── Notification Panel ────────────────────────────────────────────────────────

const NotificationPanel = ({ notifications, onClose }) => {
  const getIcon = (type) => {
    if (type === 'booking') return '🎒';
    if (type === 'cancel') return '❌';
    if (type === 'review') return '⭐';
    return '🔔';
  };

  const timeAgo = (isoStr) => {
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span className="notif-panel-title">🔔 Notifications</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {notifications.some(n => !n.read) && (
            <button className="notif-mark-read-btn" onClick={markAllRead} title="Mark all as read">
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
          <button className="notif-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <span style={{ fontSize: '32px' }}>🔔</span>
            <p>No notifications yet</p>
            <small>Booking confirmations and updates will appear here</small>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <span className="notif-icon">{getIcon(n.type)}</span>
              <div className="notif-content">
                <p className="notif-item-title">{n.title}</p>
                <p className="notif-item-body">{n.body}</p>
                <span className="notif-time">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <span className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────

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

  // Notification state
  const [notifications, setNotifications] = useState(getNotifications());
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const refresh = () => setNotifications(getNotifications());
    window.addEventListener('nwn_notif_update', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('nwn_notif_update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!showNotifPanel) return;
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifPanel]);

  const handleToggleNotif = () => {
    if (!showNotifPanel) {
      setNotifications(getNotifications());
      markAllRead();
    }
    setShowNotifPanel(prev => !prev);
  };

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
          {/* PG Rentals — temporarily hidden, link preserved for future use */}
          {/* <Link to="/rentals" className="menu-item">
            <Compass size={18} />
            <span>{translate('nav_rentals', language)}</span>
          </Link> */}

          {user && user.role === 'customer' && (
            <button onClick={handleBecomeHost} className="menu-item become-host-badge" style={{ border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', background: 'transparent' }}>
              <Compass size={18} />
              <span>{translate('nav_become_host', language)}</span>
            </button>
          )}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">

              {/* Notification Bell */}
              <div className="notif-bell-wrapper" ref={notifRef}>
                <button
                  className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={handleToggleNotif}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {showNotifPanel && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifPanel(false)}
                  />
                )}
              </div>

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
