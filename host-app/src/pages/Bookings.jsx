import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarCheck, ShieldAlert, X, Calendar as CalendarIcon, List as ListIcon, Plus } from 'lucide-react';
import CalendarView from '../components/CalendarView';
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

  // View Mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Manual Booking Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [manualForm, setManualForm] = useState({
    guestName: '', guestPhone: '', propertyId: '', roomId: '', startDate: '', endDate: '', noteToOwner: ''
  });
  const [manualLoading, setManualLoading] = useState(false);

  // Experience Schedules state: { [bookingId-uspId]: { date: string, status: string } }
  const [schedules, setSchedules] = useState({});

  const handleScheduleChange = (bookingId, uspId, field, value) => {
    setSchedules(prev => ({
      ...prev,
      [`${bookingId}-${uspId}`]: {
        ...prev[`${bookingId}-${uspId}`],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = async (bookingId, uspId) => {
    const key = `${bookingId}-${uspId}`;
    const dateVal = schedules[key]?.date;
    const statusVal = schedules[key]?.status;
    
    if (!dateVal && !statusVal) {
      alert('Please select a date or status to update.');
      return;
    }
    
    try {
      await api.bookings.updateUspSchedule(bookingId, uspId, {
        scheduledDate: dateVal ? new Date(dateVal).toISOString() : undefined,
        status: statusVal
      });
      alert('Experience schedule updated successfully!');
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update schedule');
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.properties.getOwnerProperties();
      setProperties(res.properties);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePropertyChange = async (e) => {
    const propId = e.target.value;
    setManualForm({ ...manualForm, propertyId: propId, roomId: '' });
    if (propId) {
      try {
        const res = await api.rooms.getRoomsByProperty(propId);
        setRooms(res.rooms || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setRooms([]);
    }
  };

  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      await api.bookings.createManual(manualForm);
      setShowManualModal(false);
      setManualForm({ guestName: '', guestPhone: '', propertyId: '', roomId: '', startDate: '', endDate: '', noteToOwner: '' });
      fetchBookings();
      alert('Manual booking created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setManualLoading(false);
    }
  };

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
      <section className="flex-between page-header-row flex-wrap gap-12" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Manage Reservations</h2>
          <p className="subtitle">Verify digital arrival check-in OTP keys and monitor stay cycles</p>
        </div>

        <div className="flex gap-12 align-center">
          <button onClick={() => setShowManualModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> New Booking
          </button>
          
          <div className="view-toggle" style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setViewMode('list')} 
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', background: viewMode === 'list' ? 'white' : 'transparent', border: 'none', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: viewMode === 'list' ? '600' : '500', color: viewMode === 'list' ? '#0F172A' : '#64748B' }}
            >
              <ListIcon size={16}/> List
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', background: viewMode === 'calendar' ? 'white' : 'transparent', border: 'none', boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: viewMode === 'calendar' ? '600' : '500', color: viewMode === 'calendar' ? '#0F172A' : '#64748B' }}
            >
              <CalendarIcon size={16}/> Calendar
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'list' && (
        <div className="filter-toggles flex" style={{ marginBottom: '20px' }}>
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
      )}

      {error && <div className="error-card">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>Loading Bookings...</div>
      ) : viewMode === 'calendar' ? (
        <CalendarView 
          bookings={bookings} 
          onDateClick={(date) => {
            const tzOffset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - tzOffset)).toISOString().split('T')[0];
            setManualForm({ ...manualForm, startDate: localISOTime });
            setShowManualModal(true);
          }} 
        />
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
                    {b.selectedUsps && b.selectedUsps.length > 0 && (
                      <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', minWidth: '220px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '6px' }}>🎒 Selected Experiences:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {b.selectedUsps.map(usp => (
                            <div key={usp._id} style={{ fontSize: '11px', background: '#FFFFFF', padding: '6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                              <div><strong>{usp.title}</strong></div>
                              <div style={{ color: 'var(--text-medium)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                <span>Status: <span style={{ fontWeight: 'bold', color: usp.status === 'scheduled' ? '#2563EB' : usp.status === 'completed' ? '#16A34A' : '#475569' }}>{usp.status.toUpperCase()}</span></span>
                                <span>Date: {usp.scheduledDate ? new Date(usp.scheduledDate).toLocaleString('en-IN') : 'Not Scheduled'}</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexDirection: 'column' }}>
                                <input 
                                  type="datetime-local" 
                                  className="form-control" 
                                  style={{ fontSize: '10px', padding: '2px 4px', height: '24px', width: '100%' }}
                                  value={schedules[`${b._id}-${usp._id}`]?.date || ''}
                                  onChange={e => handleScheduleChange(b._id, usp._id, 'date', e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <select
                                    className="form-control"
                                    style={{ fontSize: '10px', padding: '2px 4px', height: '24px', flex: 1 }}
                                    value={schedules[`${b._id}-${usp._id}`]?.status || usp.status}
                                    onChange={e => handleScheduleChange(b._id, usp._id, 'status', e.target.value)}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                  <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    style={{ padding: '0 8px', fontSize: '10px', height: '24px', borderRadius: '4px', color: 'white', background: 'var(--primary-color)' }}
                                    onClick={() => handleSaveSchedule(b._id, usp._id)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

      {/* Manual Booking Modal */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="flex-between modal-header" style={{ marginBottom: '16px' }}>
              <h4>Create Walk-In / Manual Booking</h4>
              <button onClick={() => setShowManualModal(false)} className="btn-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateManualBooking}>
              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Guest Name</label>
                  <input type="text" className="form-control" required value={manualForm.guestName} onChange={e => setManualForm({...manualForm, guestName: e.target.value})} placeholder="e.g. John Doe"/>
                </div>
                <div className="form-group">
                  <label>Guest Phone (optional)</label>
                  <input type="text" className="form-control" value={manualForm.guestPhone} onChange={e => setManualForm({...manualForm, guestPhone: e.target.value})} placeholder="e.g. +91 9876543210"/>
                </div>
                
                <div className="form-group">
                  <label>Property</label>
                  <select className="form-control" required value={manualForm.propertyId} onChange={handlePropertyChange}>
                    <option value="">Select Property...</option>
                    {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Room / Category</label>
                  <select className="form-control" required value={manualForm.roomId} onChange={e => setManualForm({...manualForm, roomId: e.target.value})} disabled={!manualForm.propertyId}>
                    <option value="">Select Room...</option>
                    {rooms.map(r => <option key={r._id} value={r._id}>{r.category} (₹{r.price}/night)</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Check-in Date</label>
                  <input type="date" className="form-control" required value={manualForm.startDate} onChange={e => setManualForm({...manualForm, startDate: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label>Check-out Date</label>
                  <input type="date" className="form-control" required value={manualForm.endDate} onChange={e => setManualForm({...manualForm, endDate: e.target.value})} min={manualForm.startDate} />
                </div>
              </div>

              <div className="form-group">
                <label>Note to Host (Optional)</label>
                <textarea className="form-control" rows="2" value={manualForm.noteToOwner} onChange={e => setManualForm({...manualForm, noteToOwner: e.target.value})} placeholder="Any special requests or instructions..."></textarea>
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={manualLoading}>
                  {manualLoading ? 'Creating...' : 'Create Booking'}
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
