import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heart, Home, ArrowLeft, Volume2, VolumeX, Play, Clapperboard, MoreVertical, ExternalLink, X, Calendar, CheckCircle } from 'lucide-react';
import './Vibes.css';

const getVideoTypeAndUrl = (url) => {
  if (!url) return { type: 'video', url: '' };
  let resolved = url.trim();

  // 1. Google Drive
  const driveMatch = resolved.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { type: 'iframe', url: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // 2. YouTube (supports shorts/watch/embed/youtu.be)
  const ytMatch = resolved.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return {
      type: 'iframe',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&rel=0&modestbranding=1&enablejsapi=1&iv_load_policy=3&showinfo=0&playsinline=1&disablekb=1&fs=0`
    };
  }

  // 3. Instagram reels (convert to direct embed that shows only the video)
  const igMatch = resolved.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    return { type: 'iframe', url: `https://www.instagram.com/p/${igMatch[1]}/embed/` };
  }

  // 4. Pinterest — clean embed
  const pinMatch = resolved.match(/pinterest\.[a-z.]+\/pin\/([0-9]+)/);
  if (pinMatch) {
    return { type: 'iframe', url: `https://assets.pinterest.com/ext/embed.html?id=${pinMatch[1]}` };
  }

  // 5. Dropbox
  if (resolved.includes('dropbox.com')) {
    resolved = resolved.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
    return { type: 'video', url: resolved };
  }

  return { type: 'video', url: resolved };
};

// Helper: detect social platform from URL
const getSocialPlatform = (url) => {
  if (!url) return null;
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('pinterest')) return 'pinterest';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('drive.google.com')) return 'gdrive';
  return null;
};

// Helper: determine video aspect ratio (portrait vs landscape) based on URL type
const getVideoAspectRatio = (url) => {
  if (!url) return '16/9';
  const resolved = url.trim();
  
  // Instagram Reels
  if (resolved.includes('/reel/') || resolved.includes('/reels/')) {
    return '9/16';
  }
  // YouTube Shorts
  if (resolved.includes('/shorts/')) {
    return '9/16';
  }
  // Pinterest Pins (typically vertical)
  if (resolved.includes('pinterest.com') || resolved.includes('pin.it')) {
    return '9/16';
  }
  return '16/9';
};

// Three-dot menu that appears in top-right corner
const VibeDotsMenu = ({ vibe, onClose }) => {
  const navigate = useNavigate();
  const hasProperty = !!vibe.property?._id;

  return (
    <div className="vibe-dots-menu" onClick={e => e.stopPropagation()}>
      <div className="vibe-dots-header">
        <span className="vibe-dots-title">{vibe.title || 'Vibe Options'}</span>
        <button onClick={onClose} className="vibe-dots-close"><X size={16} /></button>
      </div>
      <div className="vibe-dots-divider" />
      {hasProperty && (
        <button
          className="vibe-dots-item"
          onClick={() => { navigate(`/listing/${vibe.property._id}`); onClose(); }}
        >
          <Home size={16} />
          <span>Visit {vibe.property?.name || 'Stay'} Page</span>
        </button>
      )}
      <div className="vibe-dots-item vibe-dots-info" onClick={onClose}>
        <span style={{ fontSize: '12px', color: '#94A3B8', padding: '4px 0' }}>
          🔒 External links are disabled for your safety
        </span>
      </div>
    </div>
  );
};

const VibeReelCard = ({ vibe, active, user, onLikeToggle, muted, setMuted }) => {
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const currentUserId = user?._id || user?.id;
  const [liked, setLiked] = useState(vibe.likes.includes(currentUserId));
  const [likesCount, setLikesCount] = useState(vibe.likes.length);
  const [playing, setPlaying] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showDotsMenu, setShowDotsMenu] = useState(false);

  // Direct checkout states
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const platform = getSocialPlatform(vibe.videoUrl);

  useEffect(() => {
    setLiked(vibe.likes.includes(currentUserId));
    setLikesCount(vibe.likes.length);
  }, [vibe, user, currentUserId]);

  const sendYoutubeCommand = (func) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: func, args: [] }),
          '*'
        );
      } catch (err) {
        console.error('Failed to postMessage to YouTube iframe:', err);
      }
    }
  };

  useEffect(() => {
    setShowEndScreen(false);
    setShowDotsMenu(false);
    setShowCheckoutSheet(false);
    if (videoRef.current) {
      if (active) {
        videoRef.current.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setPlaying(false);
      }
    } else if (iframeRef.current && platform === 'youtube') {
      if (active) {
        sendYoutubeCommand('playVideo');
        sendYoutubeCommand(muted ? 'mute' : 'unmute');
        setPlaying(true);
      } else {
        sendYoutubeCommand('pauseVideo');
        setPlaying(false);
      }
    } else if (active) {
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }, [active]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
    if (active && platform === 'youtube') {
      sendYoutubeCommand(muted ? 'mute' : 'unmute');
    }
  }, [muted, active]);

  const handlePlayPause = () => {
    if (showEndScreen || showCheckoutSheet) return;
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
        setPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => setPlaying(true))
          .catch(err => console.error(err));
      }
    } else if (iframeRef.current && platform === 'youtube') {
      if (playing) {
        sendYoutubeCommand('pauseVideo');
        setPlaying(false);
      } else {
        sendYoutubeCommand('playVideo');
        setPlaying(true);
      }
    }
  };

  // Fetch rooms for checkout
  useEffect(() => {
    if (showCheckoutSheet && vibe.property?._id) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      setCheckInDate(today.toISOString().split('T')[0]);
      setCheckOutDate(tomorrow.toISOString().split('T')[0]);
      fetchPropertyRooms();
    }
  }, [showCheckoutSheet, vibe.property?._id]);

  const fetchPropertyRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.rooms.getByProperty(vibe.property._id);
      setRooms(res.rooms || []);
      if (res.rooms && res.rooms.length > 0) {
        setSelectedRoom(res.rooms[0]);
      }
    } catch (err) {
      console.error('Failed to load rooms for Vibes checkout:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const calculateDays = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedRoom) {
      setBookingError('Please select a room category.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    try {
      const guestDetails = [];
      for (let i = 0; i < (adults + children); i++) {
        guestDetails.push({ name: `Guest ${i+1}`, age: i < adults ? 25 : 8 });
      }

      await api.bookings.create({
        propertyId: vibe.property._id,
        roomId: selectedRoom._id,
        startDate: new Date(checkInDate),
        endDate: new Date(checkOutDate),
        guests: guestDetails,
        noteToOwner: 'Booked directly from Vibes ad campaign 🎥',
        bookingType: 'nightly'
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setShowCheckoutSheet(false);
        setBookingSuccess(false);
      }, 2000);
    } catch (err) {
      setBookingError(err.message || 'Booking checkout failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleVideoEnded = () => {
    setShowEndScreen(true);
    setPlaying(false);
  };

  const handleReplay = (e) => {
    e.stopPropagation();
    setShowEndScreen(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
        .then(() => setPlaying(true))
        .catch(err => console.error(err));
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.vibes.toggleLike(vibe._id);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
      if (onLikeToggle) onLikeToggle(vibe._id, res.liked, res.likesCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleVolumeToggle = (e) => {
    e.stopPropagation();
    setMuted(!muted);
  };

  const handleVisitStay = (e) => {
    e.stopPropagation();
    if (vibe.property?._id) navigate(`/listing/${vibe.property._id}`);
  };

  const videoData = getVideoTypeAndUrl(vibe.videoUrl);

  return (
    <div className="vibe-reel-slide" onClick={handlePlayPause}>

      {/* ── Video / Iframe ──────────────────────── */}
      {videoData.type === 'iframe' ? (
        active ? (
          <div className={`vibe-iframe-wrapper vibe-aspect-${getVideoAspectRatio(vibe.videoUrl).replace('/', '-')}`}>
            <iframe
              ref={iframeRef}
              key={`iframe-${vibe._id}`}
              src={videoData.url}
              className={`vibe-video-player vibe-iframe-${platform}`}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              scrolling="no"
              style={{ border: 'none', backgroundColor: '#000' }}
              onLoad={() => {
                if (active && platform === 'youtube') {
                  sendYoutubeCommand('playVideo');
                  sendYoutubeCommand(muted ? 'mute' : 'unmute');
                }
              }}
            />
            {/* Click-blocker overlay: prevents clicking any links inside the iframe */}
            <div 
              className="vibe-iframe-click-blocker" 
              style={{ pointerEvents: platform === 'youtube' ? 'all' : 'none' }}
              onClick={handlePlayPause}
            />
            {/* Crop footer mask overlay for non-YouTube vertical media */}
            {platform !== 'youtube' && (
              <div className={`vibe-iframe-crop-bottom vibe-crop-aspect-${getVideoAspectRatio(vibe.videoUrl).replace('/', '-')}`} />
            )}
          </div>
        ) : (
          <div className="vibe-iframe-placeholder" />
        )
      ) : (
        <video
          ref={videoRef}
          src={videoData.url}
          className="vibe-video-player"
          playsInline
          autoPlay={active}
          loop
          muted={muted}
          onEnded={handleVideoEnded}
        />
      )}

      {/* ── Our overlay controls (above the iframe blocker) ── */}
      <div className="vibe-overlay-controls" style={{ opacity: showEndScreen ? 0.3 : 1, transition: 'opacity 0.2s' }}>

        {/* Play indicator for native video or YouTube */}
        {!playing && (videoData.type === 'video' || platform === 'youtube') && !showEndScreen && (
          <div className="center-play-indicator flex-center">
            <Play size={40} fill="white" color="white" />
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="vibe-top-bar flex-between" onClick={e => e.stopPropagation()}>
          <button onClick={() => navigate(-1)} className="vibe-back-btn flex-center">
            <ArrowLeft size={20} />
            <span>Exit Vibes</span>
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Mute/Unmute — for native video or YouTube */}
            {(videoData.type === 'video' || platform === 'youtube') && (
              <button onClick={handleVolumeToggle} className="vibe-audio-btn flex-center">
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            {/* Three-dot menu */}
            <button
              onClick={e => { e.stopPropagation(); setShowDotsMenu(prev => !prev); }}
              className="vibe-dots-btn flex-center"
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* ── Right action bar ── */}
        <div className="vibe-right-actions flex-col" onClick={e => e.stopPropagation()}>
          <button className={`vibe-action-btn like-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
            <Heart size={28} fill={liked ? '#EF4444' : 'none'} color={liked ? '#EF4444' : 'white'} />
            <span className="action-label">{likesCount}</span>
          </button>

          <button className="vibe-action-btn stay-btn" onClick={handleVisitStay}>
            <div className="visit-icon-wrapper flex-center">
              <Home size={24} color="white" />
            </div>
            <span className="action-label">Visit Stay</span>
          </button>

          <button className="vibe-action-btn book-now-btn" onClick={() => setShowCheckoutSheet(true)}>
            <div className="visit-icon-wrapper flex-center" style={{ backgroundColor: '#22C55E', borderColor: '#22C55E' }}>
              <Calendar size={22} color="white" />
            </div>
            <span className="action-label" style={{ color: '#22C55E' }}>Book Stay</span>
          </button>
        </div>

        {/* ── Bottom description ── */}
        <div className="vibe-bottom-description" onClick={e => e.stopPropagation()}>
          <div className="host-info flex">
            {vibe.owner?.profileImage ? (
              <img src={vibe.owner.profileImage} alt={vibe.owner.name} className="vibe-host-avatar" />
            ) : (
              <div className="vibe-host-avatar-placeholder flex-center">
                {(vibe.owner?.name || 'H').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="host-name">{vibe.owner?.name || 'Local Host'}</span>
              <span className="stay-meta">📍 {vibe.property?.name || 'Nowhere Nest Stay'}</span>
            </div>
          </div>
          {vibe.title && (
            <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px', fontWeight: '800', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {vibe.title}
            </h4>
          )}
          <p className="vibe-caption-text" style={{ margin: 0 }}>{vibe.caption}</p>
        </div>
      </div>

      {/* ── Three-dot dropdown menu ── */}
      {showDotsMenu && (
        <div className="vibe-dots-backdrop" onClick={e => { e.stopPropagation(); setShowDotsMenu(false); }}>
          <VibeDotsMenu vibe={vibe} onClose={() => setShowDotsMenu(false)} />
        </div>
      )}

      {/* ── End screen ── */}
      {showEndScreen && (
        <div className="vibe-end-screen-overlay" onClick={e => e.stopPropagation()}>
          <div className="vibe-end-card">
            <span className="vibe-end-eyebrow">Explore this Nest</span>
            <h4 className="vibe-end-title">{vibe.property?.name || 'Beautiful Resort'}</h4>
            <div className="vibe-end-rating">
              <span>★ {vibe.property?.starRating || '4.5'}</span>
            </div>
            <p className="vibe-end-desc">Zero brokerage · Direct Host Verified Stay</p>
            <button className="vibe-end-visit-btn" onClick={handleVisitStay}>Visit Resort 🏡</button>
            <button className="vibe-end-replay-btn" onClick={handleReplay}>Replay Video 🔄</button>
          </div>
        </div>
      )}

      {/* ── Direct Booking Sheet Overlay ── */}
      {showCheckoutSheet && (
        <div className="vibe-checkout-backdrop" onClick={() => setShowCheckoutSheet(false)}>
          <div className="vibe-checkout-sheet" onClick={e => e.stopPropagation()}>
            <div className="vibe-checkout-header">
              <span className="vibe-checkout-title">⚡ Instant Booking</span>
              <button type="button" onClick={() => setShowCheckoutSheet(false)} className="vibe-checkout-close">×</button>
            </div>
            
            {bookingSuccess ? (
              <div className="checkout-success-view flex-center flex-col" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={48} color="#16A34A" />
                <h5 style={{ color: '#0F172A', fontWeight: '800', margin: 0 }}>Booking Confirmed!</h5>
                <p style={{ color: '#64748B', fontSize: '12.5px', margin: 0 }}>Your room is successfully reserved.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="vibe-checkout-form">
                <p className="vibe-checkout-subtitle">🏡 {vibe.property?.name}</p>
                
                {/* Rooms selection tabs */}
                <div className="vibe-checkout-group">
                  <label className="vibe-checkout-label">Select Room Category</label>
                  {roomsLoading ? (
                    <div style={{ fontSize: '11px', color: '#64748B', padding: '6px 0' }}>Loading categories...</div>
                  ) : rooms.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#EF4444', padding: '6px 0' }}>No room categories found.</div>
                  ) : (
                    <div className="vibe-checkout-rooms-tabs">
                      {rooms.map(rm => (
                        <button
                          key={rm._id}
                          type="button"
                          onClick={() => setSelectedRoom(rm)}
                          className={`vibe-checkout-room-tab ${selectedRoom?._id === rm._id ? 'active' : ''}`}
                        >
                          <span style={{ textTransform: 'capitalize' }}>{rm.category}</span>
                          <strong>₹{rm.price}/night</strong>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dates selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div className="vibe-checkout-group">
                    <label className="vibe-checkout-label">Check-In</label>
                    <input 
                      type="date" 
                      value={checkInDate}
                      onChange={e => setCheckInDate(e.target.value)}
                      className="vibe-checkout-input"
                      required
                    />
                  </div>
                  <div className="vibe-checkout-group">
                    <label className="vibe-checkout-label">Check-Out</label>
                    <input 
                      type="date" 
                      value={checkOutDate}
                      onChange={e => setCheckOutDate(e.target.value)}
                      className="vibe-checkout-input"
                      required
                    />
                  </div>
                </div>

                {/* Guest counter steppers */}
                <div className="vibe-checkout-guests-box">
                  <div className="vibe-checkout-stepper-row">
                    <div>
                      <span className="stepper-title">Adults</span>
                      <span className="stepper-subtitle">Age 18+</span>
                    </div>
                    <div className="stepper-controls">
                      <button type="button" onClick={() => setAdults(prev => Math.max(1, prev - 1))} className="stepper-btn">-</button>
                      <span className="stepper-val">{adults}</span>
                      <button type="button" onClick={() => setAdults(prev => Math.min(selectedRoom?.capacity || 2, prev + 1))} className="stepper-btn">+</button>
                    </div>
                  </div>
                  <div className="vibe-checkout-stepper-row" style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '8px' }}>
                    <div>
                      <span className="stepper-title">Children</span>
                      <span className="stepper-subtitle">Age 2-17</span>
                    </div>
                    <div className="stepper-controls">
                      <button type="button" onClick={() => setChildren(prev => Math.max(0, prev - 1))} className="stepper-btn">-</button>
                      <span className="stepper-val">{children}</span>
                      <button type="button" onClick={() => setChildren(prev => Math.min((selectedRoom?.capacity || 2) - adults, prev + 1))} className="stepper-btn">+</button>
                    </div>
                  </div>
                </div>

                {/* Total and Submit */}
                {selectedRoom && (
                  <div className="vibe-checkout-totals">
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                      ₹{selectedRoom.price} x {calculateDays()} nights
                    </span>
                    <strong style={{ fontSize: '15px', color: '#0A3B2A', fontWeight: '800' }}>
                      Total: ₹{selectedRoom.price * calculateDays()}
                    </strong>
                  </div>
                )}

                {bookingError && <p style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600', margin: '0 0 10px 0', textAlign: 'center' }}>{bookingError}</p>}

                <button type="submit" disabled={bookingLoading} className="vibe-checkout-btn">
                  {bookingLoading ? 'Processing Booking...' : 'Confirm Direct Booking 💳'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Vibes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vibeIdParam = searchParams.get('vibeId');
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);
  const { user } = useAuth();
  const [muted, setMuted] = useState(true);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    fetchVibes();
  }, [vibeIdParam]);

  // IntersectionObserver — fires reliably when each slide crosses 60% visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container || vibes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = parseInt(entry.target.dataset.vibeIdx, 10);
            if (!isNaN(idx)) setActiveIdx(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const slides = container.querySelectorAll('.vibe-reel-slide');
    slides.forEach((slide, i) => {
      slide.setAttribute('data-vibe-idx', String(i));
      observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [vibes]);

  const fetchVibes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.vibes.getAll();
      let list = res.vibes || [];
      if (vibeIdParam) {
        const index = list.findIndex(v => v._id === vibeIdParam);
        if (index !== -1) {
          const selected = list.splice(index, 1)[0];
          list = [selected, ...list];
        }
      }
      setVibes(list);
      setActiveIdx(0);
    } catch (err) {
      setError(err.message || 'Failed to fetch vibes reels');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeUpdate = (vibeId, liked, count) => {
    const currentUserId = user?._id || user?.id;
    setVibes(prev => prev.map(v =>
      v._id === vibeId
        ? { ...v, likes: liked ? [...v.likes, currentUserId] : v.likes.filter(id => id !== currentUserId) }
        : v
    ));
  };

  if (loading) {
    return (
      <div className="vibes-loading-container flex-center flex-col">
        <div className="loading-spinner"></div>
        <span>Loading NWN Vibes Reels...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vibes-error-container flex-center flex-col">
        <p>⚠️ {error}</p>
        <button onClick={fetchVibes} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className="vibes-empty-container flex-center flex-col">
        <Clapperboard size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
        <h5>No Vibes Campaigns Yet</h5>
        <p>Short host promotional reels will appear here once published.</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="vibes-reels-container" ref={containerRef}>
      {vibes.map((vibe, idx) => (
        <VibeReelCard
          key={vibe._id}
          vibe={vibe}
          active={idx === activeIdx}
          user={user}
          onLikeToggle={handleLikeUpdate}
          muted={muted}
          setMuted={setMuted}
        />
      ))}
    </div>
  );
};

export default Vibes;
