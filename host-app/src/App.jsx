import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Housekeeping from './pages/Housekeeping';
import Staff from './pages/Staff';
import Promotions from './pages/Promotions';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Vibes from './pages/Vibes';

// Protected Route Guard for Host Owner / Staff
const HostRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-light)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-medium)' }}>Securing Console Connection...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow owners, staff, and system admins
  if (user.role !== 'owner' && user.role !== 'staff' && user.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '80px auto' }} className="card">
        <h4 style={{ color: '#EF4444', marginBottom: '12px' }}>Access Denied</h4>
        <p style={{ color: 'var(--text-medium)', fontSize: '14px', marginBottom: '24px' }}>
          This console is reserved for property owners, managers, and authorized host staff.
        </p>
        <button onClick={() => window.location.href = 'http://localhost:5173?token=' + (localStorage.getItem('token') || '')} className="btn btn-primary btn-block">
          Go to Customer App
        </button>
      </div>
    );
  }

  return children;
};

// Main App Layout Wrapper
const AppLayout = () => {
  const { user } = useAuth();

  return (
    <div className={`app-container ${user ? 'has-sidebar' : ''}`}>
      <Navbar />
      <div className="main-content-wrapper">
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected operational routes */}
            <Route path="/" element={<HostRoute><Dashboard /></HostRoute>} />
            <Route path="/properties" element={<HostRoute><Properties /></HostRoute>} />
            <Route path="/rooms" element={<HostRoute><Rooms /></HostRoute>} />
            <Route path="/bookings" element={<HostRoute><Bookings /></HostRoute>} />
            <Route path="/housekeeping" element={<HostRoute><Housekeeping /></HostRoute>} />
            <Route path="/staff" element={<HostRoute><Staff /></HostRoute>} />
            <Route path="/promotions" element={<HostRoute><Promotions /></HostRoute>} />
            <Route path="/vibes" element={<HostRoute><Vibes /></HostRoute>} />
            <Route path="/finance" element={<HostRoute><Finance /></HostRoute>} />
            <Route path="/settings" element={<HostRoute><Settings /></HostRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {user && <Footer />}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
