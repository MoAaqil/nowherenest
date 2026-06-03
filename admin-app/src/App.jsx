import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { 
  LayoutDashboard, Users, Home, CreditCard, TrendingUp, ShieldAlert,
  DollarSign, CheckCircle, XCircle, RefreshCw, LogOut, Building,
  Clock, Lock, Percent, ChevronDown, ChevronUp, MapPin, Video,
  Search, Star, Sparkles, Phone, FileText, BadgeCheck, Calendar
} from 'lucide-react';
import './App.css';

const AppContent = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  
  // Dashboard states
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [commissionRate, setCommissionRate] = useState(0.08);
  const [rateInput, setRateInput] = useState('8');
  const [expandedStays, setExpandedStays] = useState({});
  const [registeredProperties, setRegisteredProperties] = useState([]);
  
  // Hosts states
  const [hosts, setHosts] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const [hostLicenseId, setHostLicenseId] = useState('');
  const [hostPhoneSearch, setHostPhoneSearch] = useState('');
  const [hostVibeCreditsInput, setHostVibeCreditsInput] = useState('');
  
  // Properties states
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyLicenseNumber, setPropertyLicenseNumber] = useState('');
  
  // Payouts states
  const [payouts, setPayouts] = useState([]);

  // Region Stats states
  const [regions, setRegions] = useState([]);
  const [expandedRegions, setExpandedRegions] = useState({});

  // Vibe Queue states
  const [pendingVibes, setPendingVibes] = useState([]);
  const [rejectVibeId, setRejectVibeId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Channel Manager states
  const [channelData, setChannelData] = useState(null);
  const [channelSyncing, setChannelSyncing] = useState({});
  const [channelSyncResults, setChannelSyncResults] = useState({});
  
  // General states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (activeTab === 'stats') {
        const res = await api.admin.getStats();
        setStats(res.stats);
        setRecentBookings(res.recentBookings || []);
        setRegisteredProperties(res.properties || []);
        if (res.commissionRate !== undefined) {
          setCommissionRate(res.commissionRate);
          setRateInput((res.commissionRate * 100).toString());
        }
      } else if (activeTab === 'hosts') {
        const res = await api.admin.getHosts(hostPhoneSearch);
        setHosts(res.hosts || []);
      } else if (activeTab === 'properties') {
        const res = await api.admin.getProperties();
        setProperties(res.properties || []);
      } else if (activeTab === 'payouts') {
        const res = await api.payouts.getAll();
        setPayouts(res.payouts || []);
      } else if (activeTab === 'regions') {
        const res = await api.admin.getRegionStats();
        setRegions(res.regions || []);
      } else if (activeTab === 'vibes') {
        const res = await api.admin.getPendingVibes();
        setPendingVibes(res.vibes || []);
      } else if (activeTab === 'channels') {
        const res = await api.channel.getDashboard();
        setChannelData(res);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch administration data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const rateVal = parseFloat(rateInput) / 100;
      const res = await api.admin.updateCommissionRate(rateVal);
      setSuccessMsg(res.message);
      setCommissionRate(res.currentRate);
    } catch (err) {
      setError(err.message || 'Failed to update commission rate');
    }
  };

  // Generate Host License Key
  const generateHostLicense = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setHostLicenseId(`NWN-HOST-${rand}`);
  };

  // Submit Host Verification
  const handleVerifyHostSubmit = async (e) => {
    e.preventDefault();
    if (!hostLicenseId.trim()) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.admin.verifyHost(selectedHost._id, hostLicenseId);
      setSuccessMsg(`Host ${selectedHost.name} verified successfully!`);
      setSelectedHost(null);
      setHostLicenseId('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to verify host');
    }
  };

  // Generate Stay License Key
  const generateStayLicense = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPropertyLicenseNumber(`NWN-STAY-${rand}`);
  };

  // Submit Stay Licensing/Approval
  const handleLicensePropertySubmit = async (e) => {
    e.preventDefault();
    if (!propertyLicenseNumber.trim()) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.admin.licenseProperty(selectedProperty._id, propertyLicenseNumber);
      setSuccessMsg(`Property stay approved and licensed!`);
      setSelectedProperty(null);
      setPropertyLicenseNumber('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to license property stay');
    }
  };

  // Handle Payout status update
  const handlePayoutAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this payout request as ${status}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.payouts.updateStatus(id, status);
      setSuccessMsg(`Payout request updated to ${status}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update payout request');
    }
  };

  // Toggle Nest Partner
  const handleToggleNestPartner = async (hostId, currentStatus) => {
    const action = currentStatus ? 'REVOKE' : 'GRANT';
    if (!window.confirm(`${action} Nest Partner status for this host?`)) return;
    setError(null); setSuccessMsg(null);
    try {
      const res = await api.admin.toggleNestPartner(hostId);
      setSuccessMsg(res.message);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  // Add Vibe Credits
  const handleAddVibeCredits = async (hostId) => {
    const credits = parseInt(hostVibeCreditsInput);
    if (!credits || credits <= 0) { setError('Enter a valid number of credits'); return; }
    setError(null); setSuccessMsg(null);
    try {
      const res = await api.admin.addVibeCredits(hostId, credits);
      setSuccessMsg(res.message);
      setHostVibeCreditsInput('');
      fetchData();
    } catch (err) { setError(err.message); }
  };

  // Approve Vibe
  const handleVerifyVibe = async (vibeId) => {
    setError(null); setSuccessMsg(null);
    try {
      const res = await api.admin.verifyVibe(vibeId);
      setSuccessMsg(res.message);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  // Reject Vibe
  const handleRejectVibe = async (vibeId) => {
    if (!rejectReason.trim()) { setError('Please enter a rejection reason'); return; }
    setError(null); setSuccessMsg(null);
    try {
      const res = await api.admin.rejectVibe(vibeId, rejectReason);
      setSuccessMsg(res.message);
      setRejectVibeId(null);
      setRejectReason('');
      fetchData();
    } catch (err) { setError(err.message); }
  };

  // Next Sunday helper
  const getNextSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Phone search
  const handlePhoneSearch = async (e) => {
    e.preventDefault();
    setError(null); setSuccessMsg(null);
    try {
      const res = await api.admin.getHosts(hostPhoneSearch);
      setHosts(res.hosts || []);
    } catch (err) { setError(err.message); }
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* Mobile Hamburger Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileNavOpen(p => !p)}
        aria-label="Toggle sidebar"
      >☰</button>

      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${mobileNavOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar Nav dock */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand flex-center">
          <div className="brand-logo-circle">🦉</div>
          <div>
            <h2>Nowhere Nest</h2>
            <span>Admin Center</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => { setActiveTab('stats'); setMobileNavOpen(false); }}>
            <LayoutDashboard size={18} /><span>Overview Metrics</span>
          </button>
          <button className={`nav-item ${activeTab === 'hosts' ? 'active' : ''}`} onClick={() => { setActiveTab('hosts'); setMobileNavOpen(false); }}>
            <Users size={18} /><span>Host Accounts</span>
          </button>
          <button className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => { setActiveTab('properties'); setMobileNavOpen(false); }}>
            <Building size={18} /><span>Stays Validation</span>
          </button>
          <button className={`nav-item ${activeTab === 'payouts' ? 'active' : ''}`} onClick={() => { setActiveTab('payouts'); setMobileNavOpen(false); }}>
            <CreditCard size={18} /><span>Payout Requests</span>
          </button>
          <button className={`nav-item ${activeTab === 'regions' ? 'active' : ''}`} onClick={() => { setActiveTab('regions'); setMobileNavOpen(false); }}>
            <MapPin size={18} /><span>Region Stats</span>
          </button>
          <button className={`nav-item ${activeTab === 'vibes' ? 'active' : ''}`} onClick={() => { setActiveTab('vibes'); setMobileNavOpen(false); }}>
            <Video size={18} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Vibe Queue {pendingVibes.length > 0 && <span style={{ background: '#EF4444', color: 'white', borderRadius: '9999px', fontSize: '10px', fontWeight: '800', padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>{pendingVibes.length}</span>}</span>
          </button>
          <button className={`nav-item ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => { setActiveTab('channels'); setMobileNavOpen(false); }}>
            <span style={{ fontSize: '16px' }}>📡</span><span>Channel Manager</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-widget flex-between">
            <div className="profile-details">
              <h6>Administrator</h6>
              <p>{user.email}</p>
            </div>
            <button onClick={logout} className="logout-btn" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content body */}
      <main className="admin-main">
        <header className="main-header flex-between">
          <div>
            <h1>Admin Administration Portal</h1>
            <p>Monitors system metrics, licenses stays, and distributes booking splits.</p>
          </div>
          <button onClick={fetchData} className="refresh-btn flex-center gap-6">
            <RefreshCw size={14} /> Refresh Data
          </button>
        </header>

        {/* Global Alert Notification block */}
        {error && (
          <div className="alert alert-danger flex">
            <ShieldAlert size={20} style={{ marginRight: '10px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success flex">
            <CheckCircle size={20} style={{ marginRight: '10px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Panels */}
        {loading && !stats && !hosts.length && !properties.length && !payouts.length ? (
          <div className="loading-spinner-wrapper flex-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <span>Loading administration database...</span>
          </div>
        ) : activeTab === 'stats' && stats ? (
          <div className="tab-panel stats-panel">
            {/* Split Metrics Summary Row */}
            <div className="metrics-grid grid grid-cols-4">
              <div className="card metric-card">
                <div className="flex-between">
                  <span>Sales Volume</span>
                  <div className="icon-badge sales"><DollarSign size={18} /></div>
                </div>
                <h3>₹{stats.financials?.totalSales.toLocaleString('en-IN') || 0}</h3>
                <p className="trend text-medium">Confirmed stay booking values</p>
              </div>

              <div className="card metric-card">
                <div className="flex-between">
                  <span>Company Commission ({(commissionRate * 100).toFixed(0)}%)</span>
                  <div className="icon-badge commission"><TrendingUp size={18} /></div>
                </div>
                <h3>₹{stats.financials?.platformCommission.toLocaleString('en-IN') || 0}</h3>
                <p className="trend green">Automatically split at checkout</p>
              </div>

              <div className="card metric-card">
                <div className="flex-between">
                  <span>Total Properties</span>
                  <div className="icon-badge stays"><Home size={18} /></div>
                </div>
                <h3>{stats.listings?.total || 0}</h3>
                <p className="trend text-medium">{stats.listings?.stays || 0} Stays / {stats.listings?.rentals || 0} PG Rooms</p>
              </div>

              <div className="card metric-card">
                <div className="flex-between">
                  <span>Total Hosts</span>
                  <div className="icon-badge hosts"><Users size={18} /></div>
                </div>
                <h3>{stats.users?.owners || 0}</h3>
                <p className="trend text-medium">{stats.users?.customers || 0} verified customers</p>
              </div>
            </div>

            {/* Middle Section: Payout metrics & Commission controls */}
            <div className="dashboard-grid-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '24px' }}>
              <div className="card flex-col-card">
                <h4>Financial Settlement Pools</h4>
                <p className="subtitle">Outstanding liability balances owed to property hosts</p>
                <div className="financial-summary-split flex-between" style={{ marginTop: '16px' }}>
                  <div className="split-item text-center" style={{ flex: 1, padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Owner Accumulated Funds</span>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '6px' }}>
                      ₹{stats.financials?.ownerPayoutsAccumulated.toLocaleString('en-IN') || 0}
                    </h3>
                  </div>
                  <div style={{ width: '16px' }}></div>
                  <div className="split-item text-center" style={{ flex: 1, padding: '16px', background: '#FEE2E2', borderRadius: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#991B1B' }}>Pending Withdrawal Requests</span>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#EF4444', marginTop: '6px' }}>
                      ₹{stats.financials?.pendingPayouts.toLocaleString('en-IN') || 0}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Commission splits adjuster */}
              <div className="card adjuster-card flex-col-card">
                <h4>Global Brokerage Splits</h4>
                <p className="subtitle">Configure platform brokerage share rate</p>
                <form onSubmit={handleUpdateCommission} className="adjuster-form" style={{ marginTop: '16px' }}>
                  <div className="form-group flex-between" style={{ gap: '12px', marginBottom: 0 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="5" 
                        max="12" 
                        className="form-control" 
                        value={rateInput}
                        onChange={e => setRateInput(e.target.value)}
                        style={{ paddingRight: '36px', height: '44px', fontWeight: '700', fontSize: '18px' }}
                        required
                      />
                      <Percent size={18} style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-medium)' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: '44px', borderRadius: '12px' }}>
                      Update
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px', display: 'block' }}>
                    Must be between 5.0% and 12.0%. Default rate splits 8.0%.
                  </span>
                </form>
              </div>
            </div>

            {/* Grouped Booking Invoices */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '14px' }}>Recent Booking Invoices by Stay</h4>
              <p className="subtitle" style={{ fontSize: '12px', color: 'var(--text-medium)', marginBottom: '20px' }}>
                Select a stay below to view customer names, emails, prices paid, platform commission split rates, and transaction statuses.
              </p>
              
              <div className="grouped-invoices-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(() => {
                  const grouped = {};
                  
                  // Initialize with all active properties so stays with 0 bookings are shown
                  registeredProperties.forEach(p => {
                    grouped[p._id] = { id: p._id, name: p.name, bookings: [] };
                  });

                  // Add bookings
                  recentBookings.forEach(b => {
                    const propId = b.property?._id || 'other';
                    const propName = b.property?.name || 'Direct Bookings / Others';
                    if (!grouped[propId]) {
                      grouped[propId] = { id: propId, name: propName, bookings: [] };
                    }
                    grouped[propId].bookings.push(b);
                  });
                  
                  const groupsList = Object.values(grouped);
                  if (groupsList.length === 0) {
                    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>No registered stays or transactions found.</div>;
                  }

                  return groupsList.map(group => {
                    const isExpanded = expandedStays[group.id];
                    return (
                      <div key={group.id} className="grouped-stay-invoice-card">
                        <button 
                          onClick={() => setExpandedStays(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                          className="grouped-stay-invoice-header"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '850', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>🏨 {group.name}</span>
                            <span className="invoice-badge-count">
                              {group.bookings.length}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-medium)', fontSize: '13px', fontWeight: '700' }}>
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="invoice-details-table-wrapper">
                            {group.bookings.length === 0 ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-medium)', fontSize: '13px', fontWeight: '600' }}>
                                No transactions or invoices found for this stay.
                              </div>
                            ) : (
                              <table className="admin-table" style={{ margin: 0, width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th>Booking Ref ID</th>
                                    <th>Guest Details</th>
                                    <th>Split (Platform {(commissionRate * 100).toFixed(0)}%)</th>
                                    <th>Payout (Host {((1 - commissionRate) * 100).toFixed(0)}%)</th>
                                    <th>Total Value</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.bookings.map(b => (
                                    <tr key={b._id}>
                                      <td><code className="invoice-ref-code">#{b._id.slice(-8).toUpperCase()}</code></td>
                                      <td>
                                        <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{b.customer?.name || 'Customer'}</strong>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-medium)', marginTop: '2px' }}>{b.customer?.email}</span>
                                      </td>
                                      <td style={{ color: 'var(--primary-color)', fontWeight: '800' }}>₹{(b.commissionAmount || Math.round(b.totalAmount * commissionRate)).toLocaleString('en-IN')}</td>
                                      <td style={{ color: '#16A34A', fontWeight: '800' }}>₹{(b.ownerAmount || Math.round(b.totalAmount * (1 - commissionRate))).toLocaleString('en-IN')}</td>
                                      <td><strong style={{ color: 'var(--text-dark)' }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong></td>
                                      <td>
                                        <span className={`badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : b.status === 'checked_out' ? 'secondary' : 'info'}`}>
                                          {b.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : activeTab === 'hosts' ? (
          <div className="tab-panel hosts-panel card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h4 style={{ margin: 0 }}>Registered Host Users</h4>
              {/* Phone Search */}
              <form onSubmit={handlePhoneSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
                  <input
                    type="text"
                    placeholder="Search by phone number..."
                    value={hostPhoneSearch}
                    onChange={e => setHostPhoneSearch(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '32px', width: '240px', height: '38px', fontSize: '13px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-small" style={{ height: '38px' }}>
                  <Search size={14} style={{ marginRight: '4px' }} /> Search
                </button>
                {hostPhoneSearch && (
                  <button type="button" className="btn btn-outline btn-small" style={{ height: '38px' }}
                    onClick={() => { setHostPhoneSearch(''); fetchData(); }}>Clear</button>
                )}
              </form>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Host Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Aadhar / KYC</th>
                    <th>License</th>
                    <th>Status</th>
                    <th>Nest Partner</th>
                    <th>Vibe Credits</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No host accounts found.</td></tr>
                  ) : (
                    hosts.map(h => (
                      <tr key={h._id}>
                        <td><strong>{h.name}</strong></td>
                        <td style={{ fontSize: '12px' }}>{h.email}</td>
                        <td>
                          <span style={{ fontWeight: '700', color: h.phone ? 'var(--text-dark)' : '#94A3B8' }}>
                            {h.phone || '—'}
                          </span>
                        </td>
                        <td>
                          {h.aadharNumber ? (
                            <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                              <span style={{ fontWeight: '700', color: '#0A3B2A' }}>#{h.aadharNumber}</span>
                              {h.aadharPhotoUrl && (
                                <><br />
                                <a href={h.aadharPhotoUrl} target="_blank" rel="noreferrer"
                                  style={{ color: '#3B82F6', fontSize: '11px', fontWeight: '700' }}>📄 View Photo</a>
                                </>
                              )}
                              {h.hostAddress && (
                                <><br />
                                <span style={{ color: '#64748B', fontSize: '10px' }}>📍 {h.hostAddress.slice(0, 40)}...</span>
                                </>
                              )}
                            </div>
                          ) : <span style={{ color: '#94A3B8', fontSize: '12px' }}>Not submitted</span>}
                        </td>
                        <td>
                          {h.licenseId ? (
                            <code style={{ background: '#E8F0EC', color: '#0A3B2A', padding: '3px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>{h.licenseId}</code>
                          ) : <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>None</span>}
                        </td>
                        <td>
                          <span className={`badge badge-${h.isLicensed ? 'success' : 'warning'}`} style={{ fontSize: '11px' }}>
                            {h.isLicensed ? '✓ Active' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleNestPartner(h._id, h.nestPartner)}
                            style={{
                              background: h.nestPartner ? '#DCFCE7' : '#F1F5F9',
                              color: h.nestPartner ? '#16A34A' : '#64748B',
                              border: 'none', borderRadius: '8px', padding: '4px 10px',
                              fontSize: '11px', fontWeight: '800', cursor: 'pointer'
                            }}
                          >
                            {h.nestPartner ? '🦉 Partner' : 'Grant'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number" min="1" placeholder="Qty"
                              style={{ width: '50px', padding: '4px 6px', fontSize: '11px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                              onFocus={() => setHostVibeCreditsInput('')}
                              onChange={e => setHostVibeCreditsInput(e.target.value)}
                            />
                            <button
                              onClick={() => handleAddVibeCredits(h._id)}
                              style={{ background: '#0A3B2A', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >+Add</button>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>({h.vibeCredits || 0})</span>
                          </div>
                        </td>
                        <td>
                          {h.isLicensed ? (
                            <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={13} /> Approved
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSelectedHost(h); setHostLicenseId(h.licenseId || ''); }}
                              className="btn btn-primary btn-small"
                            >Verify</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'properties' ? (
          <div className="tab-panel properties-panel card">
            <h4 style={{ marginBottom: '16px' }}>Stays Approval Queue</h4>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Stay Name</th>
                    <th>Type</th>
                    <th>State / District</th>
                    <th>Host & KYC</th>
                    <th>Aadhar Proof</th>
                    <th>Address</th>
                    <th>License</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No properties created.</td></tr>
                  ) : (
                    properties.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{p.type}</span></td>
                        <td style={{ fontSize: '11px' }}>
                          <strong>{p.state || '—'}</strong><br />
                          <span style={{ color: 'var(--text-medium)' }}>{p.district || '—'}</span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '12px' }}>{p.owner?.name}</strong>
                          <span style={{ display: 'block', fontSize: '10px', color: p.owner?.isLicensed ? '#16A34A' : '#EF4444', fontWeight: '700' }}>
                            {p.owner?.isLicensed ? '✓ Licensed' : '✗ Unverified'}
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', color: '#64748B' }}>{p.owner?.phone || 'No phone'}</span>
                        </td>
                        <td>
                          {p.owner?.aadharNumber ? (
                            <div style={{ fontSize: '10px' }}>
                              <span style={{ fontWeight: '700' }}>#{p.owner.aadharNumber}</span><br />
                              {p.owner.aadharPhotoUrl && (
                                <a href={p.owner.aadharPhotoUrl} target="_blank" rel="noreferrer"
                                  style={{ color: '#3B82F6', fontWeight: '700', fontSize: '10px' }}>📄 View</a>
                              )}
                            </div>
                          ) : <span style={{ fontSize: '10px', color: '#94A3B8' }}>Not submitted</span>}
                        </td>
                        <td style={{ fontSize: '10px', maxWidth: '140px', lineHeight: '1.3' }}>
                          {p.owner?.hostAddress ? (
                            <span title={p.owner.hostAddress}>📍 {p.owner.hostAddress.slice(0, 50)}{p.owner.hostAddress.length > 50 ? '...' : ''}</span>
                          ) : <span style={{ color: '#94A3B8' }}>No address</span>}
                          {p.address && <><br /><span style={{ color: '#64748B' }}>🏠 {p.address.slice(0, 40)}</span></>}
                        </td>
                        <td>
                          {p.licenseNumber ? (
                            <code style={{ background: '#DBEAFE', color: '#1E40AF', padding: '3px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '10px' }}>{p.licenseNumber}</code>
                          ) : <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>None</span>}
                        </td>
                        <td>
                          <span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                            {p.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {p.status === 'active' ? (
                            <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={12} /> Approved
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSelectedProperty(p); generateStayLicense(); }}
                              className="btn btn-primary btn-small"
                              disabled={!p.owner?.isLicensed}
                              title={!p.owner?.isLicensed ? 'Host must be verified first' : 'Approve stay'}
                            >Issue License</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'regions' ? (
          <div className="tab-panel regions-panel card">
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '4px' }}>Region & Area-Wise Hotel Volume</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-medium)', margin: 0 }}>Breakdown of all registered properties grouped by State → District</p>
            </div>
            {regions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No region data available. Properties need state/district fields.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {regions.map(region => (
                  <div key={region.state} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedRegions(p => ({ ...p, [region.state]: !p[region.state] }))}
                      style={{ width: '100%', padding: '14px 20px', background: expandedRegions[region.state] ? '#0A3B2A' : '#F8FAFC', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MapPin size={16} style={{ color: expandedRegions[region.state] ? 'white' : '#0A3B2A' }} />
                        <span style={{ fontWeight: '800', fontSize: '15px', color: expandedRegions[region.state] ? 'white' : '#0A3B2A' }}>{region.state}</span>
                        <span style={{ background: expandedRegions[region.state] ? 'rgba(255,255,255,0.2)' : '#E8F0EC', color: expandedRegions[region.state] ? 'white' : '#0A3B2A', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '800' }}>
                          {region.totalInState} properties
                        </span>
                      </div>
                      {expandedRegions[region.state] ? <ChevronUp size={16} style={{ color: 'white' }} /> : <ChevronDown size={16} style={{ color: '#64748B' }} />}
                    </button>
                    {expandedRegions[region.state] && (
                      <table className="admin-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>District</th>
                            <th>Total</th>
                            <th>Active</th>
                            <th>Pending</th>
                            <th>By Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {region.districts.map(d => (
                            <tr key={d.district}>
                              <td><strong>{d.district}</strong></td>
                              <td><strong style={{ color: '#0A3B2A' }}>{d.total}</strong></td>
                              <td><span style={{ color: '#16A34A', fontWeight: '700' }}>{d.active}</span></td>
                              <td><span style={{ color: '#F59E0B', fontWeight: '700' }}>{d.pending}</span></td>
                              <td style={{ fontSize: '11px' }}>
                                {Object.entries(d.byType || {}).map(([t, c]) => (
                                  <span key={t} style={{ marginRight: '6px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{t}: <strong>{c}</strong></span>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : activeTab === 'vibes' ? (
          <div className="tab-panel vibes-panel card">
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '4px' }}>Vibe Review Queue</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-medium)', margin: 0 }}>
                All host-uploaded vibes require manual approval before appearing in the customer app.
              </p>
            </div>
            {pendingVibes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle size={40} style={{ color: '#16A34A', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-medium)', fontWeight: '600' }}>All clear! No vibes pending review.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingVibes.map(vibe => (
                  <div key={vibe._id} style={{ border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '20px', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ background: vibe.vibeType === 'partner' ? '#0A3B2A' : '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: '800' }}>
                            {vibe.vibeType === 'partner' ? '🦉 Partner' : vibe.vibeType === 'credited' ? '💳 Credited' : '📹 Free'}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0A3B2A' }}>{vibe.title || 'Untitled Vibe'}</strong>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>{vibe.caption || 'No caption'}</p>
                        <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span>👤 {vibe.owner?.name} ({vibe.owner?.email})</span>
                          <span>📞 {vibe.owner?.phone || 'No phone'}</span>
                          <span>🏨 {vibe.property?.name}</span>
                          <span>📍 {vibe.property?.address}</span>
                          <span>🕐 {new Date(vibe.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <a
                            href={vibe.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ background: '#EFF6FF', color: '#2563EB', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}
                          >▶ Preview Video Link</a>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                        <button
                          onClick={() => handleVerifyVibe(vibe._id)}
                          style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <CheckCircle size={15} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectVibeId(rejectVibeId === vibe._id ? null : vibe._id)}
                          style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    </div>
                    {rejectVibeId === vibe._id && (
                      <div style={{ marginTop: '14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B', marginBottom: '8px', display: 'block' }}>Rejection Reason *</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Video quality is too low, content violates guidelines..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', fontSize: '12px', resize: 'vertical', marginBottom: '8px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRejectVibe(vibe._id)} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Confirm Reject</button>
                          <button onClick={() => { setRejectVibeId(null); setRejectReason(''); }} style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : activeTab === 'payouts' ? (
          <div className="tab-panel payouts-panel card">
            {/* Weekly Payout Window Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0A3B2A 0%, #16533F 100%)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
              <Calendar size={24} />
              <div>
                <h5 style={{ margin: '0 0 3px', fontWeight: '800', fontSize: '14px' }}>Weekly Payout Window</h5>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>
                  Payouts are processed <strong>every Sunday</strong>. Next window closes: <strong>{getNextSunday()}</strong>. Hosts can only redeem at week-ending. Update status manually.
                </p>
              </div>
            </div>
            <h4 style={{ marginBottom: '16px' }}>Owner Payout Withdrawal Requests</h4>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Host details</th>
                    <th>Withdrawal Value</th>
                    <th>Bank Settlement Details</th>
                    <th>Request Timestamp</th>
                    <th>Status</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No payouts requested.</td>
                    </tr>
                  ) : (
                    payouts.map(p => (
                      <tr key={p._id}>
                        <td>
                          <strong>{p.owner?.name}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)' }}>{p.owner?.email}</span>
                        </td>
                        <td style={{ fontSize: '15px', fontWeight: '800', color: '#EF4444' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                        <td>
                          {p.owner?.bankDetails ? (
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              <strong>Acc:</strong> {p.owner.bankDetails.accountNumber} <br />
                              <strong>Bank:</strong> {p.owner.bankDetails.bankName} <br />
                              <strong>IFSC:</strong> {p.owner.bankDetails.ifscCode}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>No bank account set</span>
                          )}
                        </td>
                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'approved' ? 'success' : p.status === 'requested' ? 'warning' : 'danger'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {p.status === 'requested' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => handlePayoutAction(p._id, 'approved')}
                                className="btn btn-primary btn-small"
                                style={{ background: '#16A34A' }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handlePayoutAction(p._id, 'rejected')}
                                className="btn btn-danger btn-small"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: p.status === 'approved' ? '#16A34A' : '#EF4444' }}>
                              {p.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />} {p.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'channels' ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>📡 Channel Manager</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                Real-time room inventory synced across all OTA channels.
                Formula: <strong>Available = Total Rooms − Confirmed Bookings − Maintenance Blocks</strong>
              </p>
            </div>

            {/* OTA Channels Legend */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected OTA Channels</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {(channelData?.channels || [
                  { id: 'booking_com', name: 'Booking.com', icon: '🏨' },
                  { id: 'agoda', name: 'Agoda', icon: '🌏' },
                  { id: 'airbnb', name: 'Airbnb', icon: '🏠' },
                  { id: 'expedia', name: 'Expedia', icon: '✈️' },
                  { id: 'makemytrip', name: 'MakeMyTrip', icon: '🧳' },
                  { id: 'goibibo', name: 'Goibibo', icon: '🐦' },
                ]).map((ch, idx) => (
                  <div key={ch.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: idx < 2 ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${idx < 2 ? '#86EFAC' : '#E2E8F0'}`,
                    fontSize: '13px', fontWeight: '700',
                    color: idx < 2 ? '#15803D' : '#475569'
                  }}>
                    <span>{ch.icon}</span>
                    <span>{ch.name}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: '800', padding: '2px 8px',
                      borderRadius: '20px',
                      background: idx < 2 ? '#15803D' : '#94A3B8',
                      color: 'white'
                    }}>{idx < 2 ? '✓ Connected' : 'Add'}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic' }}>
                ⚠️ Real OTA push requires official partner API credentials from each platform. Currently showing simulated sync.
              </p>
            </div>

            {/* Property Room Inventory Cards */}
            {!channelData ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading channel data...</div>
            ) : channelData.dashboard?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No active properties found.</div>
            ) : (
              channelData.dashboard.map(property => (
                <div key={property.propertyId} style={{
                  background: 'white', borderRadius: '16px', padding: '20px',
                  marginBottom: '16px', border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>{property.propertyName}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>📍 {property.location} · {property.totalRooms} room type{property.totalRooms !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {property.channelsConnected.map(ch => (
                        <span key={ch.id} style={{ fontSize: '18px' }} title={ch.name}>{ch.icon}</span>
                      ))}
                    </div>
                  </div>

                  {/* Rooms Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Room Type</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Total</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Booked</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Maintenance</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Available</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Price/Night</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '11px' }}>Sync</th>
                        </tr>
                      </thead>
                      <tbody>
                        {property.rooms.map(room => {
                          const availColor = room.available === 0 ? '#EF4444' : room.availabilityPercent < 30 ? '#F59E0B' : '#16A34A';
                          const syncKey = `${property.propertyId}-${room.roomId}`;
                          const syncResult = channelSyncResults[syncKey];
                          return (
                            <tr key={room.roomId} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'capitalize' }}>{room.category}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>{room.totalInventory}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#EF4444', fontWeight: '700' }}>{room.currentlyBooked}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#F59E0B', fontWeight: '700' }}>{room.maintenanceBlocks}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{
                                  background: availColor + '20', color: availColor,
                                  padding: '3px 10px', borderRadius: '20px',
                                  fontWeight: '800', fontSize: '13px'
                                }}>
                                  {room.available === 0 ? '🔴 Sold Out' : `✅ ${room.available}`}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>₹{room.price?.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button
                                  onClick={async () => {
                                    setChannelSyncing(prev => ({ ...prev, [syncKey]: true }));
                                    try {
                                      const res = await fetch(`http://localhost:5000/api/channel/sync`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                                        body: JSON.stringify({ propertyId: property.propertyId, roomId: room.roomId })
                                      });
                                      const data = await res.json();
                                      setChannelSyncResults(prev => ({ ...prev, [syncKey]: data.syncResults }));
                                    } catch(e) { console.error(e); }
                                    finally { setChannelSyncing(prev => ({ ...prev, [syncKey]: false })); }
                                  }}
                                  disabled={channelSyncing[syncKey]}
                                  style={{
                                    padding: '5px 12px', fontSize: '11px', fontWeight: '700',
                                    background: channelSyncing[syncKey] ? '#94A3B8' : '#0A3B2A',
                                    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
                                  }}
                                >
                                  {channelSyncing[syncKey] ? '⏳ Syncing...' : '📡 Sync Now'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 7-Day Forecast */}
                  {property.rooms[0]?.forecast && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>7-Day Availability Forecast (First Room Type)</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {property.rooms[0].forecast.map(day => (
                          <div key={day.date} style={{
                            flex: '1', minWidth: '60px', textAlign: 'center',
                            padding: '8px 4px', borderRadius: '10px',
                            background: day.available === 0 ? '#FEE2E2' : '#F0FDF4',
                            border: `1px solid ${day.available === 0 ? '#FCA5A5' : '#BBF7D0'}`
                          }}>
                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                              {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: day.available === 0 ? '#EF4444' : '#15803D', marginTop: '2px' }}>
                              {day.available}
                            </div>
                            <div style={{ fontSize: '9px', color: '#94A3B8' }}>avail</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : null}
      </main>

      {/* Host Verification modal popup */}
      {selectedHost && (
        <div className="modal-overlay flex-center">
          <div className="card modal-content" style={{ padding: '32px', maxWidth: '440px', width: '90%', borderRadius: '24px' }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Verify Host Account</h4>
            <p className="subtitle" style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '24px', textAlign: 'center' }}>
              Assign a license identifier number to verify host <strong>{selectedHost.name}</strong>.
            </p>

            <form onSubmit={handleVerifyHostSubmit} className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px' }}>Host License Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={hostLicenseId}
                    onChange={e => setHostLicenseId(e.target.value)}
                    placeholder="e.g. NWN-HOST-1234"
                    style={{ flex: 1, fontWeight: '700' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={generateHostLicense} 
                    className="btn btn-secondary" 
                    style={{ padding: '0 16px', borderRadius: '12px', fontSize: '13px' }}
                  >
                    Gen
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setSelectedHost(null)} className="btn btn-outline" style={{ flex: 1, padding: '10px 0', borderRadius: '12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px 0', borderRadius: '12px' }}>
                  Verify Host
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property/Stay Licensing modal popup */}
      {selectedProperty && (
        <div className="modal-overlay flex-center">
          <div className="card modal-content" style={{ padding: '32px', maxWidth: '440px', width: '90%', borderRadius: '24px' }}>
            <h4 style={{ color: 'var(--primary-color)', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>License Stay Accommodation</h4>
            <p className="subtitle" style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '24px', textAlign: 'center' }}>
              Assign a stay registry license code to approve stay <strong>{selectedProperty.name}</strong> and list it on the customer explore page.
            </p>

            <form onSubmit={handleLicensePropertySubmit} className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px' }}>Registry License ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={propertyLicenseNumber}
                    onChange={e => setPropertyLicenseNumber(e.target.value)}
                    placeholder="e.g. NWN-STAY-5678"
                    style={{ flex: 1, fontWeight: '700' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={generateStayLicense} 
                    className="btn btn-secondary" 
                    style={{ padding: '0 16px', borderRadius: '12px', fontSize: '13px' }}
                  >
                    Gen
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setSelectedProperty(null)} className="btn btn-outline" style={{ flex: 1, padding: '10px 0', borderRadius: '12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px 0', borderRadius: '12px' }}>
                  Approve Stay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminLogin = () => {
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-container flex-center">
      <div className="card login-card" style={{ padding: '40px 32px', maxWidth: '400px', width: '90%', borderRadius: '24px', border: '1.5px solid rgba(10, 59, 42, 0.08)', boxShadow: '0 20px 25px -5px rgba(10, 59, 42, 0.05)' }}>
        <div className="logo-section flex-center" style={{ flexDirection: 'column', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🦉</div>
          <h2 style={{ color: '#0A3B2A', fontSize: '24px', fontWeight: '800', margin: 0 }}>Nowhere Nest</h2>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '1px' }}>Admin Command Console</span>
        </div>

        {error && (
          <div className="login-error-alert alert alert-danger flex" style={{ marginBottom: '20px', padding: '12px' }}>
            <ShieldAlert size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', textAlign: 'left' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)' }}>Admin Username / Email</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="admin@nowherenest.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)' }}>Secure Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '12px', borderRadius: '12px', background: '#0A3B2A', fontWeight: '700', display: 'flex', gap: '8px' }}
            disabled={loginLoading}
          >
            {loginLoading ? 'Authenticating Secures...' : (
              <>
                Open Admin Portal <Lock size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px', background: '#F8FAFC' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E8F0EC', borderTop: '3px solid #0A3B2A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-medium)' }}>Verifying System Keys...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? <AppContent /> : <AdminLogin />;
};

export default App;
