import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Briefcase, Calendar, Bed, CheckCircle, XCircle, Clock, Star, ArrowLeft, MapPin, ChevronRight
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import './Trips.css';
import { SkeletonCard } from '../components/SkeletonCard';

const Trips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.bookings.getCustomerBookings();
      setBookings(res?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: '#DCFCE7', color: '#16A34A', icon: <CheckCircle size={12} />, label: 'Confirmed' },
      checked_in: { bg: '#DBEAFE', color: '#2563EB', icon: <Bed size={12} />, label: 'Checked In' },
      checked_out: { bg: '#F1F5F9', color: '#64748B', icon: <CheckCircle size={12} />, label: 'Checked Out' },
      cancelled: { bg: '#FEE2E2', color: '#EF4444', icon: <XCircle size={12} />, label: 'Cancelled' },
      pending: { bg: '#FEF3C7', color: '#D97706', icon: <Clock size={12} />, label: 'Pending' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700',
        padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px'
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

  const getCheckInTimeString = (booking) => {
    if (booking.bookingType === 'hourly') {
      return new Date(booking.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return booking.property?.checkInTime || '12:00 PM';
  };

  const getCheckOutTimeString = (booking) => {
    if (booking.bookingType === 'hourly') {
      return new Date(booking.endDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return booking.property?.checkOutTime || '11:00 AM';
  };

  const formatTripDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || reviewRating < 1) {
      setReviewError('Please select a star rating.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await api.bookings.submitReview(reviewModalBooking._id, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess('Review submitted! Thank you.');
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

  return (
    <div className="trips-page">
      {/* Header */}
      <div className="trips-header">
        <div className="trips-header-inner">
          <div className="trips-hero-text">
            <Briefcase size={28} className="trips-hero-icon" />
            <div>
              <h1>My Trips</h1>
              <p>All your stays and booking history in one place</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="trips-explore-btn">
            Explore Stays
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="trips-content">
        {loading ? (
          <div className="trips-list">
            <SkeletonCard type="trip" />
            <SkeletonCard type="trip" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="trips-empty">
            <div className="trips-empty-icon">✈️</div>
            <h3>No trips yet</h3>
            <p>Your upcoming and completed stays will appear here once you make a booking.</p>
            <button onClick={() => navigate('/')} className="trips-cta-btn">
              Browse Stays
            </button>
          </div>
        ) : (
          <div className="trips-list">
            {bookings.map(booking => {
              const propertyName = booking.property?.name || 'Property';
              const propertyPhoto = Array.isArray(booking.property?.photos) ? booking.property.photos[0] : (booking.property?.photos || null);
              const roomCategory = booking.room?.category || 'standard';
              const hasReview = booking.review && booking.review.rating;
              const canReview = ['checked_out', 'confirmed'].includes(booking.status) && !hasReview;

              return (
                <div key={booking._id} className="trip-card">
                  {/* Property image banner */}
                  {propertyPhoto ? (
                    <div className="trip-card-banner">
                      <img src={propertyPhoto} alt={propertyName} onError={e => { e.target.style.display = 'none'; }} />
                      <div className="trip-card-banner-overlay">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ) : (
                    <div className="trip-card-banner trip-card-banner-placeholder">
                      <div className="trip-card-banner-overlay">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  )}

                  <div className="trip-card-body">
                    {/* Property info */}
                    <div className="trip-property-row">
                      <div>
                        <h4 className="trip-property-name">{propertyName}</h4>
                        <span className="trip-room-tag">
                          {roomCategory.charAt(0).toUpperCase() + roomCategory.slice(1)} Room
                          {booking.bookingType === 'hourly' && ' · Fresher Stay'}
                        </span>
                      </div>
                      <Link to={`/listing/${booking.property?._id}`} className="trip-view-btn">
                        View <ChevronRight size={14} />
                      </Link>
                    </div>

                    {/* Date range */}
                    <div className="trip-meta-row">
                      <Calendar size={13} />
                      <span>{formatDateRange(booking.startDate, booking.endDate, booking.bookingType, booking.durationHours)}</span>
                    </div>

                    {/* Check-In / Check-Out Grid Details */}
                    <div className="trip-times-grid">
                      <div className="trip-time-col">
                        <span className="trip-time-label">CHECK-IN</span>
                        <span className="trip-time-date">{formatTripDate(booking.startDate)}</span>
                        <span className="trip-time-hour">⏱️ {getCheckInTimeString(booking)}</span>
                      </div>
                      <div className="trip-time-divider"></div>
                      <div className="trip-time-col">
                        <span className="trip-time-label">CHECK-OUT</span>
                        <span className="trip-time-date">{formatTripDate(booking.endDate)}</span>
                        <span className="trip-time-hour">⏱️ {getCheckOutTimeString(booking)}</span>
                      </div>
                    </div>

                    {/* Actual check-in / check-out details */}
                    {(booking.checkedInAt || booking.checkedOutAt) && (
                      <div className="trip-actual-times">
                        {booking.checkedInAt && (
                          <div className="trip-actual-time-row">
                            <span className="trip-actual-time-label">✓ Checked In:</span>
                            <span className="trip-actual-time-value">
                              {new Date(booking.checkedInAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {booking.checkedOutAt && (
                          <div className="trip-actual-time-row" style={{ marginTop: '6px' }}>
                            <span className="trip-actual-time-label">✓ Checked Out:</span>
                            <span className="trip-actual-time-value">
                              {new Date(booking.checkedOutAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amount */}
                    <div className="trip-amount-row">
                      <span className="trip-amount-label">Total Paid</span>
                      <strong className="trip-amount-value">{formatPrice(booking.totalAmount)}</strong>
                    </div>

                    {/* Check-in OTP */}
                    {booking.status === 'confirmed' && booking.checkInOTP && (
                      <div className="trip-otp-card">
                        <div>
                          <p className="trip-otp-label">CHECK-IN OTP</p>
                          <span className="trip-otp-code">{booking.checkInOTP}</span>
                        </div>
                        <p className="trip-otp-hint">Show at reception on arrival</p>
                      </div>
                    )}

                    {/* Review section */}
                    {hasReview ? (
                      <div className="trip-review-display">
                        <div className="trip-review-stars">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={14} fill={s <= booking.review.rating ? '#F59E0B' : 'none'} stroke={s <= booking.review.rating ? '#F59E0B' : '#CBD5E1'} />
                          ))}
                          <span>Your Review</span>
                        </div>
                        {booking.review.comment && (
                          <p className="trip-review-comment">"{booking.review.comment}"</p>
                        )}
                      </div>
                    ) : canReview ? (
                      <button
                        className="trip-rate-btn"
                        onClick={() => { setReviewModalBooking(booking); setReviewRating(0); setReviewComment(''); setReviewError(''); setReviewSuccess(''); }}
                      >
                        <Star size={14} /> Rate Your Stay
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalBooking && (
        <div className="trips-modal-overlay" onClick={() => setReviewModalBooking(null)}>
          <div className="trips-modal-card" onClick={e => e.stopPropagation()}>
            <h4 className="trips-modal-title">Rate Your Stay</h4>
            <p className="trips-modal-sub">{reviewModalBooking.property?.name || 'Your Stay'}</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '20px', textAlign: 'center' }}>
              How was your experience? Help other travelers.
            </p>

            {/* Stars */}
            <div className="trips-modal-stars">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
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

            <textarea
              placeholder="Share your experience (optional)..."
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', resize: 'none', fontFamily: 'inherit', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
            />

            {reviewError && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>{reviewError}</p>}
            {reviewSuccess && <p style={{ color: '#22C55E', fontSize: '12px', marginBottom: '12px', textAlign: 'center', fontWeight: '700' }}>{reviewSuccess}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setReviewModalBooking(null)}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', background: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewLoading}
                style={{ flex: 2, padding: '12px', background: '#0A3B2A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', opacity: reviewLoading ? 0.7 : 1 }}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
