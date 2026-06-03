import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  TrendingUp, 
  Bed, 
  Percent, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification states
  const [licenseInput, setLicenseInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Verification dialog
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchDashboardStats(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleSelfVerify = async (e) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    setIsVerifying(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      const res = await api.auth.updateProfile({ licenseId: licenseInput.trim() });
      setUser(prev => ({ ...prev, ...res.user }));
      setVerifySuccess('Account successfully verified! You are now fully licensed.');
      // Refresh properties & stats
      fetchProperties();
    } catch (err) {
      setVerifyError(err.message || 'Verification failed. Please check your unique ID.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanStatus = async () => {
    setIsScanning(true);
    setScanMessage('');
    try {
      // 1. Refetch user profile details
      const res = await api.auth.getMe();
      setUser(res.user);
      
      // 2. Refetch dashboard properties & stats
      const propsRes = await api.properties.getOwnerProperties();
      setProperties(propsRes.properties);
      if (propsRes.properties.length > 0) {
        const nextPropId = selectedPropertyId || propsRes.properties[0]._id;
        setSelectedPropertyId(nextPropId);
        await fetchDashboardStats(nextPropId);
      }
      
      setScanMessage(res.user.isLicensed ? 'Verification scan successful! Your account is active.' : 'Scan complete. Account is still pending verification.');
    } catch (err) {
      setScanMessage('Scan failed: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.properties.getOwnerProperties();
      setProperties(res.properties);
      if (res.properties.length > 0) {
        setSelectedPropertyId(res.properties[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load properties');
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (propertyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.properties.getStats(propertyId);
      setStats(res.stats);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOtpModal = (booking) => {
    setSelectedBooking(booking);
    setOtpCode('');
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setOtpError('');
    setOtpLoading(true);
    try {
      await api.bookings.verifyOTP(selectedBooking._id, otpCode);
      setShowOtpModal(false);
      // Refresh stats
      fetchDashboardStats(selectedPropertyId);
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckout = async (bookingId) => {
    if (!window.confirm('Confirm checking out this guest?')) return;
    try {
      await api.bookings.checkOut(bookingId);
      // Refresh stats
      fetchDashboardStats(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Checkout failed');
    }
  };

  if (loading && properties.length === 0) {
    return <div className="flex-center" style={{ padding: '80px', fontSize: '15px' }}>Loading Host Console...</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="container dashboard-empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)' }}>
        <div className="card text-center card-premium-border" style={{ padding: '54px 40px', maxWidth: '540px', borderRadius: '24px', border: '1.5px solid rgba(10, 59, 42, 0.08)', boxShadow: '0 20px 25px -5px rgba(10, 59, 42, 0.05)' }}>
          <div className="empty-state-icon-circle flex-center" style={{ width: '96px', height: '96px', background: 'linear-gradient(135deg, #E8F0EC 0%, #CDE0D7 100%)', borderRadius: '50%', margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(10, 59, 42, 0.06)' }}>
            <Building2 size={42} style={{ color: '#0A3B2A' }} />
          </div>
          <h2 style={{ color: '#0A3B2A', fontSize: '24px', fontWeight: '800', marginBottom: '14px', letterSpacing: '0.2px' }}>Welcome to Nowhere Nest Host Console!</h2>
          <p style={{ color: 'var(--text-medium)', maxWidth: '440px', margin: '0 auto 28px', fontSize: '14px', lineHeight: '1.6' }}>
            To start hosting guests and earning payouts, you need to register your hotel, resort, guest house, or co-living property.
          </p>
          <Link to="/properties" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '9999px', background: '#0A3B2A', boxShadow: '0 6px 15px rgba(10, 59, 42, 0.25)', fontWeight: '700', gap: '10px' }}>
            Create Your First Property <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Get max revenue value for chart scaling
  const maxTrendRevenue = stats?.trendData?.reduce((max, d) => d.revenue > max ? d.revenue : max, 1) || 1;

  return (
    <div className="container dashboard-page">
      {/* Header Property selector */}
      <section className="dashboard-header flex-between flex-wrap gap-12">
        <div>
          <h2>Console Dashboard</h2>
          <p className="subtitle">Manage operations and monitor revenue statistics</p>
        </div>

        <div className="property-picker flex-center">
          <Building2 size={16} style={{ color: 'var(--text-medium)', marginRight: '8px' }} />
          <select 
            value={selectedPropertyId} 
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="form-control"
            style={{ width: '220px', padding: '8px 12px' }}
          >
            {properties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="error-card">{error}</div>}

      {user && !user.isLicensed && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', border: '1.5px solid #F59E0B', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#D97706', color: 'white', flexShrink: 0 }}>
              <Clock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#78350F' }}>Verification Pending</h5>
              <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#92400E', lineHeight: '1.5' }}>
                Your host account is currently pending manual verification by the Nowhere Nest administration. Any stays you add will not be visible on the customer explore dashboard until your account is fully licensed.
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed rgba(120, 53, 15, 0.2)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Self verification form */}
            <form onSubmit={handleSelfVerify} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#78350F', textTransform: 'uppercase' }}>Verify Account using Unique ID</label>
                <input
                  type="text"
                  placeholder="e.g. NWN-HOST-123456"
                  value={licenseInput}
                  onChange={e => setLicenseInput(e.target.value)}
                  className="form-control"
                  style={{ padding: '8px 12px', width: '220px', fontSize: '13px', fontWeight: '600', border: '1px solid #D97706' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '10px 20px', background: '#D97706', borderColor: '#D97706', fontSize: '13px', fontWeight: '700', borderRadius: '8px', color: 'white', alignSelf: 'flex-end' }}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {/* Scan Status Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'flex-end' }}>
              <button
                type="button"
                onClick={handleScanStatus}
                className="btn btn-outline flex-center gap-6"
                style={{ padding: '10px 20px', borderColor: '#D97706', color: '#78350F', fontSize: '13px', fontWeight: '700', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                disabled={isScanning}
              >
                <RefreshCw size={14} className={isScanning ? 'spin-animation' : ''} />
                {isScanning ? 'Scanning...' : 'Scan Status / Refresh'}
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {(verifyError || verifySuccess || scanMessage) && (
            <div style={{ marginTop: '4px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', backgroundColor: verifySuccess || (scanMessage && scanMessage.toLowerCase().includes('successful')) ? '#DCFCE7' : '#FEE2E2', color: verifySuccess || (scanMessage && scanMessage.toLowerCase().includes('successful')) ? '#16A34A' : '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{verifyError || verifySuccess || scanMessage}</span>
            </div>
          )}

          <style>{`
            .spin-animation {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {stats && (
        <>
          {/* Metrics summary cards */}
          <section className="dashboard-metrics-grid grid grid-cols-4">
            <div className="card card-premium-border metric-card">
              <div className="flex-between">
                <span className="metric-title">Revenue Today</span>
                <div className="metric-icon-wrapper flex-center rev">
                  <TrendingUp size={18} />
                </div>
              </div>
              <h3 className="metric-value">₹{stats.revenueToday.toLocaleString('en-IN')}</h3>
              <span className="metric-trend green">⚡ Commission split applied</span>
            </div>

            <div className="card metric-card">
              <div className="flex-between">
                <span className="metric-title">Occupancy Rate</span>
                <div className="metric-icon-wrapper flex-center occ">
                  <Percent size={18} />
                </div>
              </div>
              <h3 className="metric-value">{stats.occupancyRate}%</h3>
              <span className="metric-trend text-medium">{stats.activeGuests} Rooms Occupied</span>
            </div>

            <div className="card metric-card">
              <div className="flex-between">
                <span className="metric-title">Check-ins Today</span>
                <div className="metric-icon-wrapper flex-center check">
                  <Calendar size={18} />
                </div>
              </div>
              <h3 className="metric-value">{stats.todayCheckInsCount}</h3>
              <span className="metric-trend text-medium">{stats.todayCheckOutsCount} Check-outs</span>
            </div>

            <div className="card metric-card">
              <div className="flex-between">
                <span className="metric-title">Pending Bookings</span>
                <div className="metric-icon-wrapper flex-center pend">
                  <Users size={18} />
                </div>
              </div>
              <h3 className="metric-value">{stats.pendingBookings}</h3>
              <span className="metric-trend warning">Requires confirmation</span>
            </div>
          </section>

          {/* Core Dashboard Sections */}
          <div className="dashboard-grid-layout">
            
            {/* Left side: Operations Queue */}
            <div className="operations-queue-column">
              <div className="card flex-col-card">
                <div className="card-header-row flex-between">
                  <h4>Guest Check-ins Queue</h4>
                  <span className="badge badge-info">{stats.todayCheckIns.length} Expected</span>
                </div>

                <div className="queue-list">
                  {stats.todayCheckIns.length === 0 ? (
                    <div className="empty-queue flex-center">
                      <Clock size={16} />
                      <span>No guest check-ins scheduled for today.</span>
                    </div>
                  ) : (
                    stats.todayCheckIns.map(b => (
                      <div key={b._id} className="queue-item flex-between">
                        <div className="guest-info">
                          <h6>{b.customer.name}</h6>
                          <p>{b.customer.phone || 'No phone verified'}</p>
                          <span className="room-badge">{b.room.category} room</span>
                        </div>
                        
                        <div className="guest-action">
                          {b.status === 'checked_in' ? (
                            <span className="badge badge-success flex-center gap-4">
                              <CheckCircle2 size={12} /> Checked In
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleOpenOtpModal(b)}
                              className="btn btn-primary btn-small"
                            >
                              Verify OTP
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="card-header-row flex-between" style={{ marginTop: '24px' }}>
                  <h4>Active Guests & Check-outs</h4>
                  <span className="badge badge-warning">{stats.todayCheckOuts.length} Today</span>
                </div>

                <div className="queue-list">
                  {stats.todayCheckOuts.length === 0 ? (
                    <div className="empty-queue flex-center">
                      <Clock size={16} />
                      <span>No active guest check-outs scheduled for today.</span>
                    </div>
                  ) : (
                    stats.todayCheckOuts.map(b => (
                      <div key={b._id} className="queue-item flex-between">
                        <div className="guest-info">
                          <h6>{b.customer.name}</h6>
                          <p>Room: {b.room.category}</p>
                          <span className="checkout-badge">Out: {new Date(b.endDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="guest-action">
                          {b.status === 'checked_out' ? (
                            <span className="badge badge-info flex-center gap-4">
                              Checked Out
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleCheckout(b._id)}
                              className="btn btn-outline btn-small btn-danger-hover"
                            >
                              Checkout
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Charts & Performance */}
            <div className="analytics-summary-column">
              <div className="card">
                <h4>Property Earnings (Last 7 Days)</h4>
                <p className="subtitle">Owner profit shares collected after 10% commission fee</p>

                {/* SVG/CSS Custom bar chart */}
                <div className="custom-bar-chart">
                  {stats.trendData.map(d => {
                    const percentHeight = Math.round((d.revenue / maxTrendRevenue) * 150); // scales to max 150px
                    return (
                      <div key={d.date} className="custom-bar-col">
                        <div className="custom-bar-val">₹{d.revenue.toLocaleString('en-IN')}</div>
                        <div 
                          className="custom-bar" 
                          style={{ height: `${percentHeight}px` }}
                          title={`Revenue: ₹${d.revenue}, Bookings: ${d.bookings}`}
                        ></div>
                        <span className="custom-bar-label">{d.date.split(',')[0]}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex-between stats-footer-row" style={{ marginTop: '24px' }}>
                  <div className="stat-summary-info">
                    <span>Weekly Booking Count</span>
                    <h5>{stats.trendData.reduce((sum, d) => sum + d.bookings, 0)} reservations</h5>
                  </div>
                  <Link to="/finance" className="view-all-link flex-center gap-4">
                    View Finance Reports <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Cleaning Alert Widget */}
              <div className="card card-alert-housekeeping" style={{ marginTop: '24px' }}>
                <div className="flex-between">
                  <div className="flex gap-12">
                    <div className="alert-circle-icon flex-center">
                      <Bed size={18} />
                    </div>
                    <div>
                      <h5>Staff & Housekeeping Status</h5>
                      <p className="subtitle">Cleaning operations required in active rooms.</p>
                    </div>
                  </div>
                  <Link to="/housekeeping" className="btn btn-secondary btn-small">
                    Manage Tasks
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* OTP verification Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '16px' }}>
              <h4>Guest Arrival Verification</h4>
              <button onClick={() => setShowOtpModal(false)} className="btn-close">
                <XCircle size={20} />
              </button>
            </div>
            
            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Enter the 6-digit digital check-in OTP generated by the guest (<strong>{selectedBooking?.customer.name}</strong>) upon booking.
            </p>

            {otpError && (
              <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={16} />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Verification OTP Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 123456" 
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  style={{ fontSize: '20px', letterSpacing: '8px', textAlign: 'center' }}
                  required
                />
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowOtpModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={otpLoading}>
                  {otpLoading ? 'Verifying...' : 'Check In Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
