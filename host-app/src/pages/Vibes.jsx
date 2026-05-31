import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Video, Heart, Home, Film, Sparkles, CheckCircle2, ShieldAlert, Link2, Trash2 } from 'lucide-react';
import './Vibes.css';

const getVideoTypeAndUrl = (url) => {
  if (!url) return { type: 'video', url: '' };
  let resolved = url.trim();

  // 1. Google Drive
  const driveMatch = resolved.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return {
      type: 'iframe',
      url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // 2. YouTube (supports shorts/watch/embed/youtu.be)
  const ytMatch = resolved.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return {
      type: 'iframe',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0`
    };
  }

  // 3. Instagram (supports reels/reel/p/tv)
  const igMatch = resolved.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    return {
      type: 'iframe',
      url: `https://www.instagram.com/p/${igMatch[1]}/embed/`
    };
  }

  // 4. Pinterest (supports regional pin patterns)
  const pinMatch = resolved.match(/pinterest\.[a-z.]+\/pin\/([0-9]+)/);
  if (pinMatch) {
    return {
      type: 'iframe',
      url: `https://assets.pinterest.com/ext/embed.html?id=${pinMatch[1]}`
    };
  }

  // 5. Dropbox
  if (resolved.includes('dropbox.com')) {
    resolved = resolved.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
    return { type: 'video', url: resolved };
  }

  return { type: 'video', url: resolved };
};

const Vibes = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [myVibes, setMyVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form states
  const [selectedProperty, setSelectedProperty] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  
  // Status messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    setLoading(true);
    try {
      // 1. Get Host Properties
      const propsRes = await api.properties.getOwnerProperties();
      setProperties(propsRes.properties || []);
      if (propsRes.properties && propsRes.properties.length > 0) {
        setSelectedProperty(propsRes.properties[0]._id);
      }

      // 2. Get All Vibes and filter by owner
      const vibesRes = await api.vibes.getAll();
      const filtered = (vibesRes.vibes || []).filter(v => {
        const ownerId = v.owner?._id || v.owner;
        const currentUserId = user?._id || user?.id;
        return ownerId && currentUserId && ownerId.toString() === currentUserId.toString();
      });
      setMyVibes(filtered);
    } catch (err) {
      console.error('Failed to load host vibes dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVibe = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !videoUrl.trim()) {
      setErrorMsg('Property and Video URL are required.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Clean Pinterest/Drive URL resolves if needed (can do it backend or pass URL directly)
      // Since video Url is processed by standard HTML5 video tag, we can support Pinterest or Google Drive resolving if needed,
      // but raw MP4 links or resolved Google Drive streams are best.
      let resolvedUrl = videoUrl.trim();
      
      // Google Drive link helper
      const driveMatch = resolvedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        resolvedUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      }

      const res = await api.vibes.create({
        propertyId: selectedProperty,
        videoUrl: resolvedUrl,
        title: title.trim(),
        caption: caption.trim()
      });

      setSuccessMsg('Vibe campaign published successfully!');
      setTitle('');
      setCaption('');
      setVideoUrl('');
      
      // Reload vibes
      fetchHostData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish video campaign.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteVibe = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Vibe campaign? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.vibes.delete(id);
      setSuccessMsg('Vibe campaign deleted successfully!');
      fetchHostData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete vibe campaign.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p>Loading your Vibes Campaigns...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  return (
    <div className="vibes-dashboard-page container" style={{ padding: '24px 0' }}>
      
      {/* Eyebrow and header */}
      <div className="flex-between header-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.5px' }}>Marketing Campaigns</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '4px' }}>NWN Vibes (Reels)</h2>
        </div>
        <div className="badge badge-success flex-center gap-6" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
          <Sparkles size={14} /> Active
        </div>
      </div>

      <div className="vibes-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Side: List of current campaigns */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} style={{ color: 'var(--primary-color)' }} />
            Your Active Campaigns ({myVibes.length})
          </h4>

          {myVibes.length === 0 ? (
            <div className="card text-center" style={{ padding: '60px 20px', border: '1.5px dashed var(--border-color)', background: 'white' }}>
              <Video size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
              <h5 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>No campaigns running</h5>
              <p style={{ color: 'var(--text-medium)', fontSize: '13px', maxWidth: '360px', margin: '0 auto 20px' }}>
                NWN Vibes lets you publish short video loops (reels) directly linking to your properties. Engage guests and drive direct check-ins!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {myVibes.map(vibe => {
                const propName = vibe.property?.name || 'Property';
                return (
                  <div key={vibe._id} className="card vibe-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', padding: 0, background: 'white' }}>
                    <div style={{ position: 'relative', height: '240px', background: '#000', overflow: 'hidden' }}>
                      {(() => {
                        const videoData = getVideoTypeAndUrl(vibe.videoUrl);
                        if (videoData.type === 'iframe') {
                          return (
                            <iframe
                              src={videoData.url}
                              style={{ width: '100%', height: '100%', border: 'none', opacity: 0.85 }}
                              frameBorder="0"
                              allow="autoplay; encrypted-media"
                            />
                          );
                        } else {
                          return (
                            <video 
                              src={videoData.url} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                              muted 
                              loop
                              playsInline
                              onMouseOver={e => {
                                try { e.target.play(); } catch(err) {}
                              }}
                              onMouseOut={e => {
                                try { e.target.pause(); e.target.currentTime = 0; } catch(err) {}
                              }}
                            />
                          );
                        }
                      })()}
                      <div className="vibe-card-likes-pill" style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', color: '#EF4444', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4.5px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <Heart size={12} fill="#EF4444" stroke="#EF4444" />
                        {vibe.likes?.length || 0} Likes
                      </div>
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Home size={10} />
                        {propName}
                      </div>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', textAlign: 'left' }}>
                      <div>
                        {vibe.title && (
                          <h5 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '800', color: 'var(--text-dark)' }}>
                            {vibe.title}
                          </h5>
                        )}
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-medium)', fontStyle: 'italic', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{vibe.caption || 'No description'}"
                        </p>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block', marginTop: '12px' }}>
                        Published: {new Date(vibe.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const customerOrigin = window.location.origin.replace('5174', '5173');
                          const postLink = `${customerOrigin}/vibes?vibeId=${vibe._id}`;
                          navigator.clipboard.writeText(postLink);
                          alert('Shareable Vibe Campaign Link copied to clipboard!');
                        }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={e => e.target.style.opacity = '0.9'}
                        onMouseOut={e => e.target.style.opacity = '1'}
                      >
                        <Link2 size={13} />
                        Copy Shareable Post Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVibe(vibe._id)}
                        style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#FEE2E2',
                          color: '#EF4444',
                          border: '1px solid #FCA5A5',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#EF4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#FEE2E2';
                          e.currentTarget.style.color = '#EF4444';
                        }}
                      >
                        <Trash2 size={13} />
                        Delete Vibe Campaign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Create/Publish Campaign Form */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px' }}>
            Publish New Campaign
          </h4>

          <div className="card" style={{ background: 'white', padding: '24px', textAlign: 'left' }}>
            <form onSubmit={handlePublishVibe}>
              
              {/* Select Property dropdown */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                  Target Property
                </label>
                {properties.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>
                    ⚠️ You need an active property to publish vibes campaigns.
                  </p>
                ) : (
                  <select 
                    value={selectedProperty}
                    onChange={e => setSelectedProperty(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', height: '38px', outline: 'none', background: 'white' }}
                    required
                  >
                    {properties.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Campaign Heading input */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                  Campaign Heading
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Poolside Luxury Resort"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', outline: 'none' }}
                  required
                />
              </div>

              {/* Video URL input */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                  Video URL Link
                </label>
                <input 
                  type="url"
                  placeholder="e.g. Instagram reel, Pinterest pin, YouTube, or Google Drive link"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', outline: 'none' }}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block', marginTop: '6px' }}>
                  Supports Instagram reels, Pinterest pins (full URL), YouTube, Google Drive, Dropbox, or raw MP4 files.
                </span>
              </div>

              {/* Caption text area */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                  Campaign Caption
                </label>
                <textarea 
                  rows={4}
                  placeholder="e.g. Unwinding in Kumarakom backwaters! 🌴 Poolside views, local organic food and relaxing vibes."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '8px 12px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Status messaging */}
              {successMsg && (
                <div className="badge badge-success flex-center gap-6" style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px 14px', width: '100%', borderRadius: '8px', marginBottom: '16px', textAlign: 'left', display: 'flex', fontSize: '12px' }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="badge badge-danger flex-center gap-6" style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px 14px', width: '100%', borderRadius: '8px', marginBottom: '16px', textAlign: 'left', display: 'flex', fontSize: '12px' }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-block flex-center"
                style={{ width: '100%', background: 'var(--primary-color)', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontWeight: '700' }}
                disabled={submitLoading || properties.length === 0}
              >
                {submitLoading ? 'Publishing Campaign...' : 'Publish Vibe Reel 🚀'}
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Vibes;
