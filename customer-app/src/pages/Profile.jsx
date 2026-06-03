import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
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
  History,
  Coins,
  Send,
  AlertTriangle
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { translate } from '../utils/translations';
import { pushNotification } from '../components/Navbar';
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
  const [activePlan, setActivePlan] = useState(localStorage.getItem('user_plan') || 'Classic');
  const [toastMessage, setToastMessage] = useState('');
  const [plansExpanded, setPlansExpanded] = useState(false);

  // NWN Cash Balance — now sourced from real user.owlsPoints
  const [totalSpendings, setTotalSpendings] = useState(0);

  // Booking history
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Cancel booking state
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelError, setCancelError] = useState('');

  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Real messaging state (replaces hardcoded dummy chats)
  const [activeMessagingBooking, setActiveMessagingBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchSpendings = async () => {
      try {
        const res = await api.bookings.getCustomerBookings();
        const bookingsList = res?.bookings || (Array.isArray(res) ? res : []);
        const total = bookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        setTotalSpendings(total);
        
        const computedOwls = Math.floor(total / 1000) * 25;
        let computedPlan = 'Classic';
        if (computedOwls >= 1250) computedPlan = 'Royal';
        else if (computedOwls >= 625) computedPlan = 'Prestige';
        else if (computedOwls >= 250) computedPlan = 'Grand';
        
        setActivePlan(computedPlan);
        localStorage.setItem('user_plan', computedPlan);
      } catch (err) {
        console.error('Failed to fetch spendings:', err);
      }
    };

    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      fetchSpendings();
    }
  }, [user]);

  // Fetch real messages for a booking
  const fetchMessages = async (bookingId) => {
    setMessagesLoading(true);
    try {
      const res = await api.messages.getByBooking(bookingId);
      setMessages(res.messages || []);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleOpenMessaging = (booking) => {
    setActiveMessagingBooking(booking);
    setChatInput('');
    fetchMessages(booking._id);
  };

  const handleCloseMessaging = () => {
    setActiveMessagingBooking(null);
    setMessages([]);
    setChatInput('');
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeMessagingBooking) return;
    setSendingMessage(true);
    try {
      const res = await api.messages.send(activeMessagingBooking._id, chatInput.trim());
      setMessages(prev => [...prev, res.message]);
      setChatInput('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    setCancellingBookingId(bookingId);
    setCancelError('');
    try {
      await api.bookings.cancel(bookingId);
      // Update local bookings list
      setBookings(prev => prev.map(b =>
        b._id === bookingId
          ? { ...b, status: 'cancelled', paymentStatus: 'refunded' }
          : b
      ));
      setCancelConfirmId(null);
      showToast('Booking cancelled. Refund has been initiated.');
      pushNotification({
        type: 'cancel',
        title: 'Booking Cancelled',
        body: 'Your booking has been cancelled and a refund has been initiated.'
      });
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
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
    Classic: { perkKey: 'unlocked_classic', req: 0, nextReq: 250, nextTier: 'Grand', badgeColor: '#94A3B8' },
    Grand: { perkKey: 'unlocked_grand', req: 250, nextReq: 625, nextTier: 'Prestige', badgeColor: '#D97706' },
    Prestige: { perkKey: 'unlocked_prestige', req: 625, nextReq: 1250, nextTier: 'Royal', badgeColor: '#0EA5E9' },
    Royal: { perkKey: 'unlocked_royal', req: 1250, nextReq: null, nextTier: null, badgeColor: '#A855F7' },
  };
  const currentPlanMeta = planDetailsMeta[activePlan] || planDetailsMeta.Classic;
  const owlsPoints = user?.owlsPoints ?? Math.floor(totalSpendings / 1000) * 25;

  return (
    <div className="profile-page-wrapper">
      {toastMessage && <div className="profile-toast-alert">{toastMessage}</div>}

      {/* Header Hero Panel */}
      <section className="profile-hero-header">
        <div className="hero-profile-container flex-between">
          <div className="user-details flex">
            <div className="user-avatar-circle flex-center">
              {(profileName || user?.name || 'A').charAt(0).toUpperCase()}
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
            {/* Membership Plan Collapsible Toggle Button */}
            <div className="profile-card plan-details-card" style={{ padding: '16px', marginBottom: '20px' }}>
              <button 
                onClick={() => setPlansExpanded(!plansExpanded)}
                className="nwn-plans-toggle-btn"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '26px' }}>🦉</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '850', color: '#0A3B2A' }}>
                      Membership: <span style={{ color: currentPlanMeta.badgeColor }}>{activePlan}</span>
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#16A34A', fontWeight: '750' }}>
                      {owlsPoints.toLocaleString()} Owls Points
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-medium)', fontSize: '13px', fontWeight: '700' }}>
                  <span>{plansExpanded ? 'Hide' : 'View'}</span>
                  {plansExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {plansExpanded && (
                <div className="nwn-plans-expanded-content" style={{ marginTop: '16px', borderTop: '1px solid rgba(10,59,42,0.06)', paddingTop: '16px' }}>
                  
                  {/* Current Active Plan Perks & Offers */}
                  <div className="active-plan-info" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid rgba(10,59,42,0.04)', marginBottom: '16px' }}>
                    <div className="plan-header flex" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="plan-badge-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentPlanMeta.badgeColor }}></span>
                      <h5 style={{ fontSize: '13px', fontWeight: '800', color: '#0A3B2A', margin: 0 }}>
                        Current Active Plan: {activePlan} Member
                      </h5>
                    </div>
                    <p className="plan-desc" style={{ fontSize: '12.5px', color: '#475569', margin: '4px 0 12px 0', lineHeight: '1.4', fontWeight: '600' }}>
                      🎁 {translate(currentPlanMeta.perkKey, language)}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed rgba(10,59,42,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '750', color: '#64748B' }}>
                          Total Spendings:
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0A3B2A', fontWeight: '800' }}>
                          {formatPrice(totalSpendings)}
                        </strong>
                      </div>
                      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '750', color: '#64748B' }}>
                          Total Owls Points:
                        </span>
                        <strong style={{ fontSize: '13px', color: '#16A34A', fontWeight: '800' }}>
                          {owlsPoints.toLocaleString()} Owls
                        </strong>
                      </div>
                    </div>

                    {currentPlanMeta.nextReq !== null && (
                      <div className="tier-progress-tracker" style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0, fontWeight: '700' }}>
                          Earn {currentPlanMeta.nextReq - owlsPoints} more Owls to unlock {currentPlanMeta.nextTier} Tier
                        </p>
                        <div className="progress-bar-bg" style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              height: '100%', 
                              background: '#166534', 
                              width: `${Math.min(100, ((owlsPoints - currentPlanMeta.req) / (currentPlanMeta.nextReq - currentPlanMeta.req)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Available Plans inside the button/expandable */}
                  <h5 style={{ fontSize: '12.5px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    All Membership Tiers
                  </h5>
                  <div className="plan-tiers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    {['Classic', 'Grand', 'Prestige', 'Royal'].map(tier => (
                      <div
                        key={tier}
                        className={`plan-tier-btn ${activePlan === tier ? 'active' : ''}`}
                        style={{
                          background: activePlan === tier ? planDetailsMeta[tier].badgeColor : '#F1F5F9',
                          color: activePlan === tier ? 'white' : '#64748B',
                          padding: '10px 4px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          textAlign: 'center',
                          border: 'none',
                          boxShadow: activePlan === tier ? `0 4px 10px ${planDetailsMeta[tier].badgeColor}33` : 'none'
                        }}
                      >
                        {tier}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

                <div className="option-item flex-between">
                  <div className="option-left flex">
                    <Coins size={20} className="option-icon" />
                    <span>Currency</span>
                  </div>
                  <select 
                    value={currency} 
                    onChange={e => {
                      localStorage.setItem('currency', e.target.value);
                      setCurrency(e.target.value);
                      showToast(`${translate('switched_to', language)} ${e.target.value}`);
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className="profile-select-mini"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="option-item flex-between" onClick={() => setActiveTab('bookings')}>
                  <div className="option-left flex">
                    <MessageSquare size={20} className="option-icon" />
                    <span>{translate('property_messages', language)}</span>
                  </div>
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

                      {/* Action buttons row: Review, Cancel, Message */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>

                        {/* Review button */}
                        {canReview && (
                          <button
                            onClick={() => {
                              setReviewModalBooking(booking);
                              setReviewRating(0);
                              setReviewComment('');
                              setReviewError('');
                              setReviewSuccess('');
                            }}
                            style={{
                              flex: 1, minWidth: '120px', padding: '8px 12px', border: '1.5px dashed #F59E0B',
                              borderRadius: '10px', background: '#FFFBEB', color: '#D97706',
                              fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            }}
                          >
                            <Star size={13} /> Rate Stay
                          </button>
                        )}

                        {/* Message Host button */}
                        <button
                          onClick={() => handleOpenMessaging(booking)}
                          style={{
                            flex: 1, minWidth: '120px', padding: '8px 12px', border: '1.5px solid #E2E8F0',
                            borderRadius: '10px', background: '#F8FAFC', color: '#0A3B2A',
                            fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          }}
                        >
                          <MessageSquare size={13} /> Message Host
                        </button>

                        {/* Cancel button — only for confirmed bookings */}
                        {booking.status === 'confirmed' && (
                          cancelConfirmId === booking._id ? (
                            <div style={{ width: '100%', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <AlertTriangle size={14} color="#EF4444" />
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#EF4444' }}>Are you sure you want to cancel?</span>
                              </div>
                              <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 10px' }}>
                                Your booking will be cancelled and a refund will be initiated. This cannot be undone.
                              </p>
                              {cancelError && <p style={{ fontSize: '11px', color: '#EF4444', marginBottom: '8px' }}>{cancelError}</p>}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={cancellingBookingId === booking._id}
                                  style={{
                                    flex: 1, padding: '8px', background: '#EF4444', color: 'white',
                                    border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                  }}
                                >
                                  {cancellingBookingId === booking._id ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                                <button
                                  onClick={() => { setCancelConfirmId(null); setCancelError(''); }}
                                  style={{
                                    flex: 1, padding: '8px', background: 'white', color: '#475569',
                                    border: '1px solid #E2E8F0', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                  }}
                                >
                                  Keep Booking
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancelConfirmId(booking._id)}
                              style={{
                                flex: 1, minWidth: '120px', padding: '8px 12px', border: '1.5px solid #FECACA',
                                borderRadius: '10px', background: '#FEF2F2', color: '#EF4444',
                                fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              }}
                            >
                              <XCircle size={13} /> Cancel Booking
                            </button>
                          )
                        )}

                        {/* Already reviewed */}
                        {hasReview && (
                          <div style={{ width: '100%', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px' }}>
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Real Messaging Panel Modal ─── */}
        {activeMessagingBooking && (
          <div className="modal-overlay" style={{ zIndex: 300 }}>
            <div className="modal-content" style={{ maxWidth: '500px', height: '540px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0A3B2A', borderRadius: '16px 16px 0 0' }}>
                <div>
                  <h5 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '14px' }}>
                    💬 Message Host — {activeMessagingBooking.property?.name || 'Property'}
                  </h5>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    Booking #{activeMessagingBooking._id?.slice(-6)?.toUpperCase()}
                  </span>
                </div>
                <button onClick={handleCloseMessaging} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC' }}>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <MessageSquare size={32} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>No messages yet. Say hello to your host!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                    return (
                      <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? '#0A3B2A' : 'white',
                          color: isMe ? 'white' : '#1E293B',
                          fontSize: '13px', fontWeight: '500',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}>
                          {!isMe && (
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                              {msg.sender?.name || 'Host'}
                            </p>
                          )}
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px', background: 'white', borderRadius: '0 0 16px 16px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message to your host..."
                  style={{
                    flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '13px', outline: 'none', background: '#F8FAFC'
                  }}
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingMessage}
                  style={{
                    width: '42px', height: '42px', background: '#0A3B2A', color: 'white',
                    border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: chatInput.trim() && !sendingMessage ? 'pointer' : 'not-allowed',
                    opacity: chatInput.trim() && !sendingMessage ? 1 : 0.5, transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
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


      {/* Messages Modal — OLD, kept as fallback but now handled by handleOpenMessaging in bookings tab */}

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
