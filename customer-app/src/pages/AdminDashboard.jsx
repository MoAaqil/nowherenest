import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Percent, DollarSign, Layers, Users, TrendingUp, Check, X, ShieldCheck } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Commission setting
  const [commissionRate, setCommissionRate] = useState('0.10');

  useEffect(() => {
    fetchAdminRecords();
  }, []);

  const fetchAdminRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await api.admin.getStats();
      setStats(statsRes.stats);
      
      const payoutsRes = await api.payouts.getAll();
      setPayouts(payoutsRes.payouts);

      // Default the commission input based on env or fallback
      if (statsRes.stats) {
        // Commission values are typically between 0.05 and 0.12
        setCommissionRate(process.env.COMMISSION_RATE || '0.10');
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrator records');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);
    try {
      const rateNum = parseFloat(commissionRate);
      if (isNaN(rateNum) || rateNum < 0.05 || rateNum > 0.12) {
        throw new Error('Commission rate must be between 0.05 (5%) and 0.12 (12%)');
      }
      await api.admin.updateCommissionRate(rateNum);
      setSuccessMsg(`Platform commission split updated to ${(rateNum * 100).toFixed(1)}%!`);
      fetchAdminRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePayoutStatusUpdate = async (id, status) => {
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await api.payouts.updateStatus(id, status);
      setSuccessMsg(`Payout request successfully ${status}!`);
      fetchAdminRecords(); // Refresh data lists
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !stats) {
    return <div className="admin-page-loading flex-center"><span>Loading administrator database...</span></div>;
  }

  return (
    <div className="admin-page container">
      <div className="admin-header-row flex-between">
        <h2>Administrator System Panel</h2>
        <span className="badge badge-success flex-center">
          <ShieldCheck size={14} style={{ marginRight: '4px' }} /> Secure Access Verified
        </span>
      </div>

      {error && <div className="login-error-alert">{error}</div>}
      {successMsg && <div className="login-success-alert">{successMsg}</div>}

      {/* Stats Cards Grid */}
      {stats && (
        <section className="admin-stats-grid grid grid-cols-3">
          <div className="admin-stat-card card">
            <div className="flex-between">
              <span className="lbl">Total System Sales</span>
              <TrendingUp className="stat-ic" size={20} />
            </div>
            <h3>${stats.financials.totalSales.toFixed(2)}</h3>
            <p>Total transaction volume handled</p>
          </div>

          <div className="admin-stat-card card primary-highlight">
            <div className="flex-between">
              <span className="lbl">Platform Commission (10%)</span>
              <DollarSign className="stat-ic" size={20} />
            </div>
            <h3>${stats.financials.platformCommission.toFixed(2)}</h3>
            <p>Net platform revenues accumulated</p>
          </div>

          <div className="admin-stat-card card">
            <div className="flex-between">
              <span className="lbl">User Accounts</span>
              <Users className="stat-ic" size={20} />
            </div>
            <h3>{stats.users.total}</h3>
            <p>{stats.users.customers} Guests | {stats.users.owners} Property Hosts</p>
          </div>
        </section>
      )}

      {/* Main split sections */}
      <div className="admin-split-layout grid grid-cols-2" style={{ gap: '32px', marginTop: '32px' }}>
        {/* Left Side: Payout Approvals */}
        <div className="admin-payouts-section card" style={{ padding: '24px' }}>
          <h4>Owner Redemption Requests</h4>
          <p className="sub-description" style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '20px' }}>
            Review requested bank withdrawals. Approving marks funds as transferred. Rejecting refunds the amount to the host's wallet immediately.
          </p>

          {payouts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', fontSize: '14px' }}>No payout requests submitted yet.</p>
          ) : (
            <div className="admin-payout-requests-list">
              {payouts.map(p => (
                <div key={p._id} className="payout-request-item card" style={{ padding: '16px', marginBottom: '12px' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong>{p.owner?.name}</strong>
                    <span className={`badge ${
                      p.status === 'approved' ? 'badge-success' : p.status === 'requested' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="payout-details-meta" style={{ fontSize: '13px', color: 'var(--text-medium)' }}>
                    <div>Requested Amount: <strong style={{ color: 'var(--primary-color)' }}>${p.amount}</strong></div>
                    <div>Bank: {p.bankDetailsSnapshot.bankName} (A/C: {p.bankDetailsSnapshot.accountNumber})</div>
                    <div>IFSC: {p.bankDetailsSnapshot.ifscCode}</div>
                  </div>

                  {p.status === 'requested' && (
                    <div className="payout-actions flex" style={{ gap: '10px', marginTop: '12px' }}>
                      <button 
                        onClick={() => handlePayoutStatusUpdate(p._id, 'approved')} 
                        className="btn btn-primary btn-small flex-center"
                        style={{ flex: 1, gap: '4px' }}
                      >
                        <Check size={14} /> Approve Transfer
                      </button>
                      <button 
                        onClick={() => handlePayoutStatusUpdate(p._id, 'rejected')} 
                        className="btn btn-danger btn-small flex-center"
                        style={{ flex: 1, gap: '4px' }}
                      >
                        <X size={14} /> Reject & Refund
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Configurations & Recent actions */}
        <div className="admin-configs-section">
          {/* Commission adjust form */}
          <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
            <h4>Adjust Platform Commission Split</h4>
            <p className="sub-description" style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '20px' }}>
              Set global fee deducted from user bookings. Configured in real time (restricted between 5% and 12%).
            </p>

            <form onSubmit={handleCommissionSubmit} className="flex" style={{ gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Platform Share (Decimal: 0.05 to 0.12)</label>
                <div className="input-with-icon">
                  <Percent size={16} />
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.05"
                    max="0.12"
                    className="form-control" 
                    value={commissionRate}
                    onChange={e => setCommissionRate(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
                Update Split
              </button>
            </form>
          </div>

          {/* Listings review stats */}
          {stats && (
            <div className="card" style={{ padding: '24px' }}>
              <h4>Active Properties Breakdown</h4>
              <div className="active-properties-chart" style={{ marginTop: '16px' }}>
                <div className="chart-row flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Short-stay Cottages & Hotels:</span>
                  <strong>{stats.listings.stays} active listings</strong>
                </div>
                <div className="chart-row flex-between" style={{ padding: '8px 0' }}>
                  <span>Long-term Rental PGs:</span>
                  <strong>{stats.listings.rentals} active listings</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
