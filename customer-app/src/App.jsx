import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Rentals from './pages/Rentals';
import DetailView from './pages/DetailView';
import CabBooking from './pages/CabBooking';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Vibes from './pages/Vibes';
import Trips from './pages/Trips';
import SplashScreen from './components/SplashScreen';
import BottomNavbar from './components/BottomNavbar';

// Protected Route for Guest Customers (forces login)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-light)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-medium)' }}>Connecting to Nest Secure Portal...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Redirect Owners to the external Host Console App
const OwnerRedirect = () => {
  const { user, loading } = useAuth();
  React.useEffect(() => {
    if (user && user.role === 'owner') {
      window.location.href = 'http://localhost:5174?token=' + (localStorage.getItem('token') || '');
    }
  }, [user]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying Host Credentials...</div>;
  if (!user || user.role !== 'owner') {
    return <Navigate to="/login?owner=true" replace />;
  }
  return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary-color)', fontWeight: '700' }}>Redirecting to Nowhere Nest Host Console...</div>;
};

// Protected Route for Admins
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying Admin Credentials...</div>;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main App Layout Wrapper
const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Geolocation API fetch
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('user_lat', position.coords.latitude.toString());
          localStorage.setItem('user_lng', position.coords.longitude.toString());
          localStorage.setItem('gps_enabled', 'true');
          window.dispatchEvent(new Event('storage'));
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error);
          localStorage.setItem('gps_enabled', 'false');
          window.dispatchEvent(new Event('storage'));
        }
      );
    } else {
      localStorage.setItem('gps_enabled', 'false');
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  // Only trigger splash for logged in users and once per session
  const isLoginPage = location.pathname === '/login';
  const [splashActive, setSplashActive] = useState(user && !sessionStorage.getItem('splash_shown'));

  // Sync splash screen state if user changes (logs in)
  React.useEffect(() => {
    if (user && !sessionStorage.getItem('splash_shown')) {
      setSplashActive(true);
    }
  }, [user]);

  const handleSplashFinish = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setSplashActive(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      {user && splashActive && <SplashScreen onFinish={handleSplashFinish} />}
      
      {/* Hide navbar on profile and vibes pages to match mobile view screenshots */}
      {user && !['/profile', '/vibes', '/trips'].includes(location.pathname) && <Navbar />}
      
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Guest routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
          <Route path="/listing/:id" element={<ProtectedRoute><DetailView /></ProtectedRoute>} />
          <Route path="/ride" element={<ProtectedRoute><CabBooking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/vibes" element={<ProtectedRoute><Vibes /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
          
          {/* Protected Admin/Owner dashboards */}
          <Route 
            path="/owner" 
            element={<OwnerRedirect />} 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
        </Routes>
      </div>

      {/* Hide footer on profile and vibes pages to match mobile view screenshots */}
      {user && !['/profile', '/vibes', '/trips'].includes(location.pathname) && <Footer />}
      
      {/* Floating Bottom Nav bar for mobile concept */}
      {user && ['/', '/rentals', '/ride', '/profile', '/vibes', '/trips'].includes(location.pathname) && <BottomNavbar />}
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
