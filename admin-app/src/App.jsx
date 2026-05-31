import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  CreditCard, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Building, 
  Clock,
  Lock,
  ArrowRight,
  Percent
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
  
  // Hosts states
  const [hosts, setHosts] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const [hostLicenseId, setHostLicenseId] = useState('');
  
  // Properties states
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyLicenseNumber, setPropertyLicenseNumber] = useState('');
  
  // Payouts states
  const [payouts, setPayouts] = useState([]);
  
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
        // Setup initial commission rate based on backend rate
        // We know standard split is 8%
      } else if (activeTab === 'hosts') {
        const res = await api.admin.getHosts();
        setHosts(res.hosts || []);
      } else if (activeTab === 'properties') {
        const res = await api.admin.getProperties();
        setProperties(res.properties || []);
      } else if (activeTab === 'payouts') {
        const res = await api.payouts.getAll();
        setPayouts(res.payouts || []);
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

  return (
    <div className="admin-layout">
      {/* Sidebar Nav dock */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand flex-center">
          <div className="brand-logo-circle">🦉</div>
          <div>
            <h2>Nowhere Nest</h2>
            <span>Admin Center</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <LayoutDashboard size={18} />
            <span>Overview Metrics</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'hosts' ? 'active' : ''}`}
            onClick={() => setActiveTab('hosts')}
          >
            <Users size={18} />
            <span>Host accounts</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <Building size={18} />
            <span>Stays validation</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            <CreditCard size={18} />
            <span>Payout requests</span>
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
                  <span>Company Commission (8%)</span>
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

            {/* Recent bookings log */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '14px' }}>Recent Booking Invoices</h4>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking Ref ID</th>
                      <th>Guest Details</th>
                      <th>Stay / Room Category</th>
                      <th>Split (Platform 8%)</th>
                      <th>Payout (Host 92%)</th>
                      <th>Total Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No transactions found.</td>
                      </tr>
                    ) : (
                      recentBookings.map(b => (
                        <tr key={b._id}>
                          <td><code>#{b._id.slice(-8).toUpperCase()}</code></td>
                          <td>
                            <strong>{b.customer?.name}</strong>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)' }}>{b.customer?.email}</span>
                          </td>
                          <td>
                            <strong style={{ display: 'block' }}>{b.listing?.title}</strong>
                            <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px' }}>{b.listing?.type}</span>
                          </td>
                          <td style={{ color: 'var(--primary-color)', fontWeight: '700' }}>₹{b.commissionAmount || Math.round(b.totalAmount * 0.08)}</td>
                          <td style={{ color: '#16A34A', fontWeight: '700' }}>₹{b.ownerAmount || Math.round(b.totalAmount * 0.92)}</td>
                          <td><strong>₹{b.totalAmount}</strong></td>
                          <td>
                            <span className={`badge badge-${b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'danger'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'hosts' ? (
          <div className="tab-panel hosts-panel card">
            <h4 style={{ marginBottom: '16px' }}>Registered Host Users</h4>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Host Account Name</th>
                    <th>Email Address</th>
                    <th>Phone Code</th>
                    <th>Licensing Number</th>
                    <th>Status</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No host accounts registered.</td>
                    </tr>
                  ) : (
                    hosts.map(h => (
                      <tr key={h._id}>
                        <td><strong>{h.name}</strong></td>
                        <td>{h.email}</td>
                        <td>{h.phone || 'Not Verified'}</td>
                        <td>
                          {h.isLicensed ? (
                            <code style={{ background: '#E8F0EC', color: '#0A3B2A', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>{h.licenseId}</code>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>Unverified</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${h.isLicensed ? 'success' : 'warning'}`}>
                            {h.isLicensed ? 'Active Host' : 'Pending Verification'}
                          </span>
                        </td>
                        <td>
                          {h.isLicensed ? (
                            <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Approved
                            </span>
                          ) : (
                            <button 
                              onClick={() => { setSelectedHost(h); generateHostLicense(); }}
                              className="btn btn-primary btn-small"
                            >
                              Verify Account
                            </button>
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
            <h4 style={{ marginBottom: '16px' }}>Stays Approvals queue</h4>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Stay Listing Name</th>
                    <th>Category</th>
                    <th>Property Host</th>
                    <th>Location Details</th>
                    <th>Stay Registry License</th>
                    <th>Approval Status</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>No properties stays created.</td>
                    </tr>
                  ) : (
                    properties.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="badge badge-info">{p.category || p.type}</span></td>
                        <td>
                          <strong>{p.owner?.name}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: p.owner?.isLicensed ? '#16A34A' : '#EF4444' }}>
                            {p.owner?.isLicensed ? '✓ Host Licensed' : '✗ Host Unverified'}
                          </span>
                        </td>
                        <td>{p.location?.address}</td>
                        <td>
                          {p.licenseNumber ? (
                            <code style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>{p.licenseNumber}</code>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>None Issued</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${p.status === 'active' ? 'success' : 'warning'}`}>
                            {p.status === 'active' ? 'Active' : 'Pending Approval'}
                          </span>
                        </td>
                        <td>
                          {p.status === 'active' ? (
                            <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Approved & Active
                            </span>
                          ) : (
                            <button 
                              onClick={() => { setSelectedProperty(p); generateStayLicense(); }}
                              className="btn btn-primary btn-small"
                              disabled={!p.owner?.isLicensed}
                              title={!p.owner?.isLicensed ? 'Host must be verified first' : 'Approve stay'}
                            >
                              Issue License
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'payouts' ? (
          <div className="tab-panel payouts-panel card">
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
