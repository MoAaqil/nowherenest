import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarCheck, ShieldAlert, X, CheckCircle, LogOut } from 'lucide-react';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.bookings.getOwnerBookings();
      setBookings(res.bookings);
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
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
      fetchBookings();
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckout = async (bookingId) => {
    if (!window.confirm('Check out this guest?')) return;
    try {
      await api.bookings.checkOut(bookingId);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Checkout failed');
    }
  };

  const getFilteredBookings = () => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter(b => b.status === statusFilter);
  };

  const filtered = getFilteredBookings();

  return (
    <div className="container bookings-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Manage Reservations</h2>
          <p className="subtitle">Verify digital arrival check-in OTP keys and monitor stay cycles</p>
        </div>

        <div className="filter-toggles flex">
          {['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`btn btn-toggle ${statusFilter === f ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '13px', textTransform: 'capitalize' }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error-card">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>Loading Bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <CalendarCheck size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Reservations Found</h5>
          <p className="subtitle">No bookings match the selected status filter.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Property & Room</th>
                <th>Dates</th>
                <th>Payment</th>
                <th>Commission Detail</th>
                <th>Status</th>
                <th>Verification Code</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{b.customer?.name || 'Local traveler'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{b.customer?.phone || 'No phone verified'}</div>
                    {b.noteToOwner && (
                      <div style={{ fontSize: '11px', color: '#854D0E', background: '#FEF9C3', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', maxWidth: '180px', wordBreak: 'break-word', border: '1px solid #FEF08A' }}>
                        📝 {b.noteToOwner}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{b.property?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-medium)', textTransform: 'capitalize' }}>{b.room?.category} category</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {Math.ceil(Math.abs(new Date(b.endDate) - new Date(b.startDate)) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700' }}>₹{b.totalAmount.toLocaleString('en-IN')}</div>
                    <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>Host: <strong>₹{b.ownerAmount.toLocaleString('en-IN')}</strong></div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>App Fee: ₹{b.commissionAmount.toLocaleString('en-IN')}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      b.status === 'confirmed' ? 'badge-info' : 
                      b.status === 'checked_in' ? 'badge-success' : 
                      b.status === 'checked_out' ? 'badge-warning' : 
                      'badge-danger'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {b.status === 'confirmed' ? (
                      <span className="otp-placeholder">••••••</span>
                    ) : (
                      <span className="otp-verified-code">✓ Verified</span>
                    )}
                  </td>
                  <td>
                    {b.status === 'confirmed' && (
                      <button 
                        onClick={() => handleOpenOtpModal(b)}
                        className="btn btn-primary btn-small"
                      >
                        Verify Check-in OTP
                      </button>
                    )}
                    {b.status === 'checked_in' && (
                      <button 
                        onClick={() => handleCheckout(b._id)}
                        className="btn btn-outline btn-small btn-danger"
                      >
                        Check Out
                      </button>
                    )}
                    {b.status === 'checked_out' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Stay Finished</span>
                    )}
                    {b.status === 'cancelled' && (
                      <span style={{ fontSize: '12px', color: '#EF4444' }}>Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* OTP verification Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '16px' }}>
              <h4>Verify Guest Arrival</h4>
              <button onClick={() => setShowOtpModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Ask the guest for the 6-digit OTP code found on their booking voucher or Customer Dashboard.
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
                  style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }}
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

export default Bookings;
