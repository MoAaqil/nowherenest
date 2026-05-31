import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  MessageSquare, 
  Bell, 
  Globe, 
  MapPin, 
  X,
  ChevronRight,
  LogOut,
  Save,
  Lock,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Bed,
  History
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { translate } from '../utils/translations';
import './Profile.css';

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  // Selected Option Modals
  const [activeModal, setActiveModal] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'bookings'
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'bookings') {
      setActiveTab('bookings');
    } else if (tabParam === 'settings') {
      setActiveTab('settings');
    }
  }, [tabParam]);

  // Edit Profile form states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Settings states (backed by localStorage)
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const [distanceUnit, setDistanceUnit] = useState(localStorage.getItem('distance_unit') || 'km');
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications_enabled') !== 'false');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'INR');
  const [activePlan, setActivePlan] = useState(localStorage.getItem('user_plan') || 'Silver');
  const [toastMessage, setToastMessage] = useState('');

  // NWN Cash Balance
  const [nwnCash, setNwnCash] = useState(parseFloat(localStorage.getItem('nwn_cash')) || 1250.00);
  const [totalSpendings, setTotalSpendings] = useState(0);

  // Booking history
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Property chats
  const [chats, setChats] = useState([
    { id: 1, host: 'Albert (Bail Exotica)', text: 'Hello! Your Deluxe room is ready for check-in.', time: '10:30 AM', unread: true },
    { id: 2, host: 'Taj Kumarakom Spa', text: 'We have applied the WELCOME10 coupon to your booking.', time: 'Yesterday', unread: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const fetchSpendings = async () => {
      try {
        const res = await api.bookings.getCustomerBookings();
        const bookingsList = res?.bookings || (Array.isArray(res) ? res : []);
        const total = bookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        setTotalSpendings(total);
        
        let computedPlan = 'Silver';
        if (total >= 50000) computedPlan = 'Diamond';
        else if (total >= 25000) computedPlan = 'Platinum';
        else if (total >= 10000) computedPlan = 'Gold';
        
        setActivePlan(computedPlan);
        localStorage.setItem('user_plan', computedPlan);
      } catch (err) {
        console.error('Failed to fetch spendings:', err);
      }
    };

    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      fetchSpendings();
    }
  }, [user]);

  const fetchBookingHistory = async () => {
    setBookingsLoading(true);
    try {
      const res = await api.bookings.getCustomerBookings();
      setBookings(res?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookingHistory();
    }
  }, [activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const syncRes = await api.auth.updateProfile({
        name: profileName,
        phone: profilePhone,
        password: profilePassword || undefined
      });
      setUser(prev => ({ ...prev, ...syncRes.user }));
      setProfileSuccess('Profile updated successfully!');
      showToast(translate('setting_saved', language));
      setProfilePassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    localStorage.setItem(key, value);
    showToast(translate('setting_saved', language));
    if (key === 'language') {
      setLanguage(value);
      window.dispatchEvent(new Event('storage'));
    }
    if (key === 'distance_unit') setDistanceUnit(value);
  };

  const handleToggleNotifications = (checked) => {
    setNotifications(checked);
    localStorage.setItem('notifications_enabled', checked ? 'true' : 'false');
    showToast(translate('setting_saved', language));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const activeIndex = chats.findIndex(c => c.id === activeChat.id);
    if (activeIndex !== -1) {
      const updated = [...chats];
      updated[activeIndex].text = chatInput;
      updated[activeIndex].time = 'Just Now';
      updated[activeIndex].unread = false;
      setChats(updated);
      setChatInput('');
      setTimeout(() => {
        const replies = [...updated];
        replies[activeIndex].text = 'Sure! We received your message and will arrange everything accordingly.';
        replies[activeIndex].time = 'Just Now';
        setChats(replies);
      }, 1500);
    }
  };

  const handleGoToHost = () => {
    window.location.href = 'http://localhost:5174';
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  // Submit Review Handler
  const handleSubmitReview = async () => {
    if (!reviewRating || reviewRating < 1) {
      setReviewError('Please select a star rating before submitting.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await api.bookings.submitReview(reviewModalBooking._id, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSuccess('Review submitted! Thank you for your feedback.');
      showToast('Review submitted successfully!');
      // Update local state
      setBookings(prev => prev.map(b => 
        b._id === reviewModalBooking._id 
          ? { ...b, review: { rating: reviewRating, comment: reviewComment, reviewedAt: new Date() } }
          : b
      ));
      setTimeout(() => {
        setReviewModalBooking(null);
        setReviewRating(0);
        setReviewComment('');
        setReviewSuccess('');
      }, 1500);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: '#DCFCE7', color: '#16A34A', icon: <CheckCircle size={12}/>, label: 'Confirmed' },
      checked_in: { bg: '#DBEAFE', color: '#2563EB', icon: <Bed size={12}/>, label: 'Checked In' },
      checked_out: { bg: '#F1F5F9', color: '#64748B', icon: <CheckCircle size={12}/>, label: 'Checked Out' },
      cancelled: { bg: '#FEE2E2', color: '#EF4444', icon: <XCircle size={12}/>, label: 'Cancelled' },
      pending: { bg: '#FEF3C7', color: '#D97706', icon: <Clock size={12}/>, label: 'Pending' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700',
        padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        {s.icon} {s.label}
      </span>
    );
  };

  const formatDateRange = (start, end, bookingType, durationHours) => {
    if (bookingType === 'hourly') {
      return `${new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${durationHours}hr fresher stay`;
    }
    const s = new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} – ${e}`;
  };

  const planDetailsMeta = {
    Silver: { perkKey: 'unlocked_silver', req: 0, nextReq: 10000, nextTier: 'Gold', badgeColor: '#94A3B8' },
    Gold: { perkKey: 'unlocked_gold', req: 10000, nextReq: 25000, nextTier: 'Platinum', badgeColor: '#D97706' },
    Platinum: { perkKey: 'unlocked_platinum', req: 25000, nextReq: 50000, nextTier: 'Diamond', badgeColor: '#0EA5E9' },
    Diamond: { perkKey: 'unlocked_diamond', req: 50000, nextReq: null, nextTier: null, badgeColor: '#A855F7' },
  };
  const currentPlanMeta = planDetailsMeta[activePlan] || planDetailsMeta.Silver;

  return (
    <div className="profile-page-wrapper">
      {toastMessage && <div className="profile-toast-alert">{toastMessage}</div>}

      {/* Header Hero Panel */}
      <section className="profile-hero-header">
        <div className="hero-profile-container flex-between">
          <div className="user-details flex">
            <div className="user-avatar-circle flex-center">
              {profileName.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2>{translate('welcome', language)}, {profileName || 'User'}</h2>
              <p className="plan-brief-label">{translate(activePlan.toLowerCase() + '_member', language)}</p>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="btn-logout-header" title={translate('logout', language)}>
            <LogOut size={20} />
          </button>
        </div>
      </section>

      <div className="container profile-content-container">
        
        {/* NWN Cash Card */}
        <div className="nwn-cash-card flex-between">
          <div className="cash-left flex">
            <div className="cash-icon-circle flex-center"><span>💵</span></div>
            <div className="cash-data">
              <span className="cash-lbl">{translate('nwn_cash_balance', language)}</span>
              <h3>{formatPrice(nwnCash)}</h3>
            </div>
          </div>
          <div className="currency-selector-badge flex-center">
            <Globe size={14} style={{ marginRight: '6px' }} />
            <select 
              value={currency} 
              onChange={e => {
                localStorage.setItem('currency', e.target.value);
                setCurrency(e.target.value);
                showToast(`${translate('switched_to', language)} ${e.target.value}`);
                window.dispatchEvent(new Event('storage'));
              }}
              className="currency-select-inline"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'settings' ? '#0A3B2A' : 'transparent',
              color: activeTab === 'settings' ? 'white' : '#64748B',
              fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <User size={15} /> Account & Settings
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'bookings' ? '#0A3B2A' : 'transparent',
              color: activeTab === 'bookings' ? 'white' : '#64748B',
              fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <History size={15} /> Booking History
          </button>
        </div>

        {/* ===== TAB 1: SETTINGS ===== */}
        {activeTab === 'settings' && (
          <>
            {/* Membership Plan Card */}
            <div className="profile-card plan-details-card">
              <h4 className="card-title">{translate('membership_plan_details', language)}</h4>
              
              <div className="plan-tiers-grid">
                {['Silver', 'Gold', 'Platinum', 'Diamond'].map(tier => (
                  <div
                    key={tier}
                    className={`plan-tier-btn ${activePlan === tier ? 'active' : ''}`}
                    style={{ '--accent-color': planDetailsMeta[tier].badgeColor, cursor: 'default' }}
                  >
                    {translate(tier.toLowerCase() + '_member', language).split(' ')[0]}
                  </div>
                ))}
              </div>

              <div className="active-plan-info">
                <div className="spendings-header flex-between" style={{ marginBottom: '12px', borderBottom: '1px solid rgba(10,59,42,0.06)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A3B2A' }}>
                    {translate('total_spendings', language)}:
                  </span>
                  <strong style={{ fontSize: '15px', color: '#0A3B2A' }}>
                    {formatPrice(totalSpendings)}
                  </strong>
                </div>

                <div className="plan-header flex" style={{ marginBottom: '8px' }}>
                  <span className="plan-badge-dot" style={{ backgroundColor: currentPlanMeta.badgeColor }}></span>
                  <h5 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A3B2A' }}>
                    {translate('active_plan_info', language)}
                  </h5>
                </div>
                <p className="plan-desc" style={{ marginBottom: '12px' }}>
                  {translate(currentPlanMeta.perkKey, language)}
                </p>

                {currentPlanMeta.nextReq !== null && (
                  <div className="tier-progress-tracker" style={{ background: 'white', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(10,59,42,0.06)' }}>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: '600' }}>
                      {translate('spend_more', language).replace('{amount}', formatPrice(currentPlanMeta.nextReq - totalSpendings))}
                    </p>
                    <div className="progress-bar-bg" style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ height: '100%', background: '#0A3B2A', width: `${Math.min(100, (totalSpendings / currentPlanMeta.nextReq) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Section */}
            <div className="profile-card settings-options-card">
              <h4 className="card-title">{translate('account_settings', language)}</h4>
              
              <div className="options-list">
                <div className="option-item flex-between" onClick={() => setActiveModal('profile')}>
                  <div className="option-left flex">
                    <User size={20} className="option-icon" />
                    <span>{translate('profile_settings', language)}</span>
                  </div>
                  <ChevronRight size={18} className="chevron" />
                </div>

                <div className="option-item flex-between" onClick={() => setActiveModal('messages')}>
                  <div className="option-left flex">
                    <MessageSquare size={20} className="option-icon" />
                    <span>{translate('property_messages', language)}</span>
                  </div>
                  {chats.some(c => c.unread) && <span className="badge badge-success font-weight-bold" style={{ background: '#0A3B2A', color: 'white' }}>New</span>}
                  <ChevronRight size={18} className="chevron" />
                </div>

                <div className="option-item flex-between">
                  <div className="option-left flex">
                    <Globe size={20} className="option-icon" />
                    <span>{translate('language', language)}</span>
                  </div>
                  <select 
                    value={language} 
                    onChange={e => handleSettingChange('language', e.target.value)}
                    className="profile-select-mini"
                  >
                    <option value="English">English 🇬🇧</option>
                    <option value="Tamil">Tamil 🇮🇳</option>
                  </select>
                </div>

                <div className="option-item flex-between">
                  <div className="option-left flex">
                    <MapPin size={20} className="option-icon" />
                    <span>{translate('distance_units', language)}</span>
                  </div>
                  <select 
                    value={distanceUnit} 
                    onChange={e => handleSettingChange('distance_unit', e.target.value)}
                    className="profile-select-mini"
                  >
                    <option value="km">Kilometers (km)</option>
                    <option value="miles">Miles (mi)</option>
                  </select>
                </div>

                <div className="option-item flex-between">
                  <div className="option-left flex">
                    <Bell size={20} className="option-icon" />
                    <span>{translate('notifications', language)}</span>
                  </div>
                  <div className="toggle-switch-wrapper">
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={notifications}
                        onChange={(e) => handleToggleNotifications(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* List property CTA */}
            <div className="list-property-animated-btn" onClick={handleGoToHost}>
              <div className="btn-inner flex-between">
                <div className="btn-left flex">
                  <span className="house-emoji">🏘️</span>
                  <div>
                    <h5>{translate('list_your_property', language)}</h5>
                    <p>{translate('list_property_desc', language)}</p>
                  </div>
                </div>
                <div className="arrow-circle flex-center">
                  <ArrowRight size={18} />
                </div>
              </div>
              <div className="btn-pulse-wave"></div>
            </div>
          </>
        )}

        {/* ===== TAB 2: BOOKING HISTORY ===== */}
        {activeTab === 'bookings' && (
          <div className="bookings-history-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <History size={20} style={{ color: '#0A3B2A' }} />
              <h4 style={{ margin: 0, color: '#0A3B2A', fontWeight: '800' }}>Your Stay History</h4>
            </div>

            {bookingsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTop: '3px solid #0A3B2A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                <p>Loading your booking history...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
              </div>
            ) : bookings.length === 0 ? (
              <div className="profile-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Calendar size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
                <h5 style={{ color: '#475569', marginBottom: '8px' }}>No bookings yet</h5>
                <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px' }}>
                  Your completed and upcoming stays will appear here.
                </p>
                <button onClick={() => navigate('/')} className="btn btn-primary" style={{ background: '#0A3B2A', borderRadius: '10px' }}>
                  Explore Stays
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map(booking => {
                  const propertyName = booking.property?.name || 'Property';
                  const propertyPhoto = Array.isArray(booking.property?.photos) ? booking.property.photos[0] : (booking.property?.photos || null);
                  const roomCategory = booking.room?.category || 'standard';
                  const hasReview = booking.review && booking.review.rating;
                  const canReview = ['checked_out', 'confirmed'].includes(booking.status) && !hasReview;

                  return (
                    <div key={booking._id} className="profile-card" style={{ padding: '20px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                      {/* Status ribbon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            {propertyPhoto && (
                              <img 
                                src={propertyPhoto} 
                                alt={propertyName}
                                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div>
                              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{propertyName}</h5>
                              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'capitalize' }}>
                                {roomCategory} Room
                                {booking.bookingType === 'hourly' && ' · Hourly'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                            <Calendar size={12} />
                            {formatDateRange(booking.startDate, booking.endDate, booking.bookingType, booking.durationHours)}
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Amount row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Total Paid</span>
                        <strong style={{ fontSize: '16px', color: '#0A3B2A', fontWeight: '800' }}>
                          {formatPrice(booking.totalAmount)}
                        </strong>
                      </div>

                      {/* Check-in OTP */}
                      {booking.status === 'confirmed' && booking.checkInOTP && (
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>Check-In OTP</p>
                            <span style={{ fontSize: '22px', fontWeight: '900', color: '#0A3B2A', letterSpacing: '4px' }}>{booking.checkInOTP}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#64748B', textAlign: 'right', maxWidth: '120px' }}>
                            Show this to reception at check-in
                          </p>
                        </div>
                      )}

                      {/* Review section */}
                      {hasReview ? (
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} fill={s <= booking.review.rating ? '#F59E0B' : 'none'} stroke={s <= booking.review.rating ? '#F59E0B' : '#CBD5E1'} />
                            ))}
                            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>Your Review</span>
                          </div>
                          {booking.review.comment && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                              "{booking.review.comment}"
                            </p>
                          )}
                        </div>
                      ) : canReview ? (
                        <button
                          onClick={() => {
                            setReviewModalBooking(booking);
                            setReviewRating(0);
                            setReviewComment('');
                            setReviewError('');
                            setReviewSuccess('');
                          }}
                          style={{
                            width: '100%', padding: '10px', border: '1.5px dashed #F59E0B',
                            borderRadius: '10px', background: '#FFFBEB', color: '#D97706',
                            fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; }}
                        >
                          <Star size={14} /> Rate Your Stay Experience
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======= MODALS ======= */}

      {/* Profile Edit Modal */}
      {activeModal === 'profile' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '20px' }}>
              <h4>{translate('update_profile', language)}</h4>
              <button onClick={() => setActiveModal(null)} className="btn-close"><X size={20} /></button>
            </div>

            {profileSuccess && <div className="badge badge-success" style={{ display: 'block', padding: '10px', marginBottom: '16px' }}>{profileSuccess}</div>}
            {profileError && <div className="badge badge-danger" style={{ display: 'block', padding: '10px', marginBottom: '16px' }}>{profileError}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>{translate('profile_name', language)}</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{translate('phone_number', language)}</label>
                <div className="input-with-icon">
                  <span className="input-icon">📞</span>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{translate('new_password', language)}</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder={translate('password_placeholder', language)}
                    value={profilePassword}
                    onChange={e => setProfilePassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block flex-center gap-8" style={{ background: '#0A3B2A', borderRadius: '12px', padding: '12px' }} disabled={profileLoading}>
                <Save size={16} />
                {profileLoading ? translate('saving', language) : translate('save_changes', language)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {activeModal === 'messages' && (
        <div className="modal-overlay">
          <div className="modal-content messages-modal">
            <div className="flex-between modal-header" style={{ marginBottom: '20px' }}>
              <h4>{translate('property_chats', language)}</h4>
              <button onClick={() => { setActiveModal(null); setActiveChat(null); }} className="btn-close"><X size={20} /></button>
            </div>

            {activeChat ? (
              <div className="chat-window-view">
                <button onClick={() => setActiveChat(null)} className="btn btn-secondary btn-small" style={{ marginBottom: '14px', background: '#E8F0EC', color: '#0A3B2A' }}>
                  ← {translate('back_to_chats', language)}
                </button>
                <h5 style={{ fontWeight: '800', marginBottom: '14px', color: '#0A3B2A' }}>Chatting with {activeChat.host}</h5>
                <div className="chat-messages-container">
                  <div className="msg bubble-received">{activeChat.text}</div>
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder={translate('type_message', language)} 
                    className="form-control"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ background: '#0A3B2A' }}>{translate('send', language)}</button>
                </form>
              </div>
            ) : (
              <div className="chats-list flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chats.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChat(chat)}
                    className="chat-item card flex-between" 
                    style={{ padding: '16px', cursor: 'pointer', border: chat.unread ? '1.5px solid #0A3B2A' : '1px solid #E5E7EB', background: chat.unread ? '#E8F0EC' : 'white', borderRadius: '12px' }}
                  >
                    <div>
                      <h6 style={{ fontWeight: '800', color: '#0A3B2A' }}>{chat.host}</h6>
                      <p style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>{chat.text}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{chat.time}</span>
                      {chat.unread && <span className="indicator-unread-dot" style={{ display: 'block', width: '8px', height: '8px', background: '#0A3B2A', borderRadius: '50%', margin: '4px 0 0 auto' }}></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="flex-between modal-header" style={{ marginBottom: '20px' }}>
              <h4>Rate Your Stay</h4>
              <button onClick={() => setReviewModalBooking(null)} className="btn-close"><X size={20} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>
                {reviewModalBooking.property?.name || 'Your Stay'}
              </p>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                How was your experience? Your feedback helps other travelers.
              </p>
            </div>

            {/* Star Rating Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.15s' }}
                >
                  <Star 
                    size={40} 
                    fill={(reviewHoverRating || reviewRating) >= star ? '#F59E0B' : 'none'}
                    stroke={(reviewHoverRating || reviewRating) >= star ? '#F59E0B' : '#CBD5E1'}
                    style={{ transform: (reviewHoverRating || reviewRating) >= star ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}
                  />
                </button>
              ))}
            </div>

            {reviewRating > 0 && (
              <p style={{ textAlign: 'center', fontWeight: '700', color: '#F59E0B', marginBottom: '16px', fontSize: '14px' }}>
                {['', 'Poor 😞', 'Below Average 😐', 'Good 🙂', 'Very Good 😊', 'Excellent! 🌟'][reviewRating]}
              </p>
            )}

            <div className="form-group">
              <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                Leave a comment (optional)
              </label>
              <textarea 
                className="form-control"
                rows={3}
                placeholder="Describe your stay experience, what you loved, what could be improved..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            {reviewError && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{reviewError}</div>}
            {reviewSuccess && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{reviewSuccess}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setReviewModalBooking(null)} 
                className="btn btn-outline"
                style={{ flex: 1, borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSubmitReview}
                className="btn btn-primary"
                style={{ flex: 2, background: '#0A3B2A', borderRadius: '10px' }}
                disabled={reviewLoading || !reviewRating}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review ⭐'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
