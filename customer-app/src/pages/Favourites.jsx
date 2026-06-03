import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Play, Trash2, ArrowLeft, ShieldAlert, Wifi, BedDouble, Flame, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatPrice } from '../utils/currency';
import './Favourites.css';

const Favourites = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';

  const [activeTab, setActiveTab] = useState('stays'); // 'stays' or 'vibes'
  const [likedStays, setLikedStays] = useState([]);
  const [likedVibes, setLikedVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch liked stays from backend API (cross-device sync)
  useEffect(() => {
    const fetchFavourites = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load liked stays from backend API (synced across devices)
        const favRes = await api.auth.getFavourites();
        setLikedStays(favRes.favourites || []);
        // Also sync localStorage to reflect backend state
        const ids = (favRes.favourites || []).map(p => p._id);
        localStorage.setItem('liked_stays', JSON.stringify(ids));

        // Fetch vibes liked by user
        const vibesRes = await api.vibes.getAll();
        const allVibes = vibesRes.vibes || [];
        const filteredVibes = allVibes.filter(vibe =>
          vibe.likes && Array.isArray(vibe.likes) && vibe.likes.includes(currentUserId)
        );
        setLikedVibes(filteredVibes);
      } catch (err) {
        console.error('Failed to load favourites:', err);
        // Fallback to localStorage if API fails
        try {
          const localLikedStays = JSON.parse(localStorage.getItem('liked_stays') || '[]');
          const staysRes = await api.listings.getAll({ type: 'stay' });
          const allStays = staysRes.listings || [];
          setLikedStays(allStays.filter(stay => localLikedStays.includes(stay._id)));
        } catch {
          setError('Unable to load your favourites. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchFavourites();
    }
  }, [currentUserId]);

  // Remove stay from favourites — syncs to backend API + localStorage
  const handleRemoveStay = async (stayId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLikedStays(prev => prev.filter(stay => stay._id !== stayId));
      const local = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      localStorage.setItem('liked_stays', JSON.stringify(local.filter(id => id !== stayId)));
      await api.auth.toggleFavourite(stayId);
    } catch (err) {
      console.error('Failed to remove favourite:', err);
      const favRes = await api.auth.getFavourites();
      setLikedStays(favRes.favourites || []);
    }
  };

  const handleUnlikeVibe = async (vibeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.vibes.toggleLike(vibeId);
      setLikedVibes(prev => prev.filter(vibe => vibe._id !== vibeId));
    } catch (err) {
      console.error('Failed to unlike vibe:', err);
    }
  };

  // Get best photo from property — handles both 'photos' and 'images' fields
  const getPhoto = (stay) => {
    if (stay.photos && stay.photos.length > 0) return stay.photos[0];
    if (stay.images && stay.images.length > 0) return stay.images[0];
    return 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80';
  };

  // Get display name — handles both 'name' and 'title' fields
  const getName = (stay) => stay.name || stay.title || 'Unnamed Stay';

  const getAmenityIcon = (amenity) => {
    const a = amenity.toLowerCase();
    if (a.includes('wifi') || a.includes('wi-fi')) return '📶';
    if (a.includes('pool')) return '🏊';
    if (a.includes('ac') || a.includes('air')) return '❄️';
    if (a.includes('hot')) return '🚿';
    if (a.includes('park')) return '🅿️';
    if (a.includes('food') || a.includes('breakfast')) return '🍽️';
    if (a.includes('pet')) return '🐾';
    if (a.includes('gym')) return '🏋️';
    if (a.includes('spa')) return '💆';
    return '✓';
  };

  return (
    <div className="favourites-page container">
      {/* Header Panel */}
      <header className="favourites-header">
        <Link to="/" className="btn-back flex-center">
          <ArrowLeft size={16} /> Back to Explore
        </Link>
        <h1 className="page-title">Your Favourites</h1>
        <p className="page-subtitle">Your saved stays and vibes in one place</p>
      </header>

      {/* Tabs Switcher */}
      <div className="favourites-tabs flex-center">
        <button
          className={`tab-btn ${activeTab === 'stays' ? 'active' : ''}`}
          onClick={() => setActiveTab('stays')}
        >
          <Heart size={18} fill={activeTab === 'stays' ? '#EF4444' : 'none'} color={activeTab === 'stays' ? '#EF4444' : 'currentColor'} />
          <span>Saved Stays ({likedStays.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'vibes' ? 'active' : ''}`}
          onClick={() => setActiveTab('vibes')}
        >
          <Play size={18} fill={activeTab === 'vibes' ? 'var(--primary-color)' : 'none'} />
          <span>Liked Vibes ({likedVibes.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-spinner-wrapper flex-center">
          <div className="spinner"></div>
          <span>Loading your favourites...</span>
        </div>
      ) : error ? (
        <div className="error-card flex-center" style={{ flexDirection: 'column', padding: '40px' }}>
          <ShieldAlert size={36} color="#EF4444" />
          <span style={{ marginTop: '12px', fontWeight: '600' }}>{error}</span>
        </div>
      ) : activeTab === 'stays' ? (
        likedStays.length === 0 ? (
          <div className="empty-favourites card flex-center">
            <Heart size={48} color="#94A3B8" />
            <h3>No Saved Stays Yet</h3>
            <p>Explore stays and tap the heart icon on any property to save it here.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Explore Stays</Link>
          </div>
        ) : (
          <div className="fav-stays-grid">
            {likedStays.map(stay => (
              <Link to={`/listing/${stay._id}`} key={stay._id} className="fav-stay-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                {/* Image Section */}
                <div className="fav-card-image">
                  <img
                    src={getPhoto(stay)}
                    alt={getName(stay)}
                    referrerPolicy="no-referrer"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'; }}
                  />
                  {/* Remove button */}
                  <button
                    className="fav-remove-btn"
                    onClick={(e) => handleRemoveStay(stay._id, e)}
                    title="Remove from Favourites"
                  >
                    <Trash2 size={15} />
                  </button>
                  {/* Price pill */}
                  <div className="fav-price-pill">
                    {formatPrice(stay.price || stay.pricePerNight || 0)}
                    <span>/night</span>
                  </div>
                  {/* Rating badge */}
                  {stay.starRating > 0 && (
                    <div className="fav-rating-badge">
                      <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
                      <span>{(stay.starRating || stay.rating || 4.0).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="fav-card-info">
                  {/* Category */}
                  <div className="fav-card-meta-row">
                    <span className="fav-category-chip">
                      {stay.category === 'hotel' ? '🏨' : stay.category === 'apartment' ? '🏢' : '🏡'}
                      {' '}{stay.category || 'Stay'}
                    </span>
                    {stay.isLicensed && (
                      <span className="fav-verified-badge">✓ Approved</span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="fav-stay-name">{getName(stay)}</h3>

                  {/* Location */}
                  <p className="fav-stay-location">
                    <MapPin size={13} />
                    <span>{stay.location?.address || stay.location?.city || stay.location?.district || 'Location not specified'}</span>
                  </p>

                  {/* Amenities row */}
                  {stay.amenities && stay.amenities.length > 0 && (
                    <div className="fav-amenities-row">
                      {stay.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="fav-amenity-tag">
                          {getAmenityIcon(a)} {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="fav-card-footer">
                    <span className="fav-book-btn">View & Book →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        likedVibes.length === 0 ? (
          <div className="empty-favourites card flex-center">
            <Play size={48} color="#94A3B8" />
            <h3>No Liked Vibes Yet</h3>
            <p>Browse through host reels in the Vibes tab and double-tap or like reels to save them here.</p>
            <Link to="/vibes" className="btn btn-primary" style={{ marginTop: '16px' }}>Go to Vibes</Link>
          </div>
        ) : (
          <div className="favourites-grid grid">
            {likedVibes.map(vibe => (
              <div key={vibe._id} className="vibe-fav-card card">
                <button
                  className="remove-fav-btn flex-center"
                  onClick={(e) => handleUnlikeVibe(vibe._id, e)}
                  title="Unlike Vibe"
                >
                  <Trash2 size={16} />
                </button>

                <div className="vibe-video-preview">
                  <div className="video-overlay flex-center">
                    <div className="play-badge flex-center">
                      <Play size={20} fill="white" color="white" />
                    </div>
                  </div>
                  <div className="vibe-host-tag">
                    {vibe.owner?.name || 'Local Host'}
                  </div>
                  <div className="vibe-caption-bg">
                    <h4>{vibe.title || 'Vibe Video'}</h4>
                    <p>{vibe.caption || 'No description available'}</p>
                    {vibe.property?._id && (
                      <Link to={`/listing/${vibe.property._id}`} className="vibe-stay-link">
                        🏡 {vibe.property.name || 'Nest Stay'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Favourites;
