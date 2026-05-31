import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Play, Trash2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Favourites.css';

const Favourites = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';

  const [activeTab, setActiveTab] = useState('stays'); // 'stays' or 'vibes'
  const [likedStays, setLikedStays] = useState([]);
  const [likedVibes, setLikedVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all stays & vibes on mount
  useEffect(() => {
    const fetchFavourites = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load liked stays IDs from localStorage
        const localLikedStays = JSON.parse(localStorage.getItem('liked_stays') || '[]');

        // Fetch all stays
        const staysRes = await api.listings.getAll({ type: 'stay' });
        const allStays = staysRes.listings || [];
        
        // Filter stays matching local storage IDs
        const filteredStays = allStays.filter(stay => localLikedStays.includes(stay._id));
        setLikedStays(filteredStays);

        // Fetch all vibes
        const vibesRes = await api.vibes.getAll();
        const allVibes = vibesRes || [];

        // Filter vibes liked by user
        const filteredVibes = allVibes.filter(vibe => 
          vibe.likes && Array.isArray(vibe.likes) && vibe.likes.includes(currentUserId)
        );
        setLikedVibes(filteredVibes);
      } catch (err) {
        console.error('Failed to load favourites:', err);
        setError('Unable to load your favourites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchFavourites();
    }
  }, [currentUserId]);

  // Remove stay from favourites
  const handleRemoveStay = (stayId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const localLikedStays = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      const updated = localLikedStays.filter(id => id !== stayId);
      localStorage.setItem('liked_stays', JSON.stringify(updated));
      setLikedStays(prev => prev.filter(stay => stay._id !== stayId));
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle vibe like
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

      {/* Content Side */}
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
          <div className="favourites-grid grid">
            {likedStays.map(stay => (
              <div key={stay._id} className="stay-horizontal-card card" style={{ position: 'relative' }}>
                {/* Remove button overlay */}
                <button 
                  className="remove-fav-btn flex-center"
                  onClick={(e) => handleRemoveStay(stay._id, e)}
                  title="Remove from Favourites"
                >
                  <Trash2 size={16} />
                </button>

                <div className="card-image-panel">
                  <img
                    src={stay.images && stay.images[0] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'}
                    alt={stay.title}
                  />
                  <div className="price-tag-pill">₹{stay.price}<span>/night</span></div>
                </div>

                <div className="card-info-panel">
                  <div className="flex-between card-top-row">
                    <span className="stay-category">{stay.category}</span>
                    <div className="rating-tag">
                      <Star size={14} className="star-icon" />
                      <span>{stay.starRating || 4.5}</span>
                    </div>
                  </div>

                  <h5 style={{ display: 'flex', alignItems: 'center', gap: '4.5px', marginTop: '6px' }}>
                    {stay.title}
                  </h5>
                  
                  <p className="card-location">
                    <MapPin size={14} />
                    <span>{stay.location?.address}</span>
                  </p>

                  <div className="card-amenities-row flex">
                    {(stay.amenities || []).slice(0, 3).map(a => (
                      <span key={a} className="amenity-pill">{a.replace('_', ' ')}</span>
                    ))}
                  </div>

                  <div className="card-action-row flex-between" style={{ marginTop: '12px' }}>
                    <span className="owner-name-tag" style={{ color: '#16A34A', fontWeight: '700' }}>✓ Approved Stay</span>
                    <Link to={`/listing/${stay._id}`} className="btn btn-secondary btn-small">Book Now</Link>
                  </div>
                </div>
              </div>
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
                {/* Remove button */}
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
