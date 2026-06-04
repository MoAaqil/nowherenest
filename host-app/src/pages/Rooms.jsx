import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bed, Plus, Trash2, Edit3, X, Sparkles, AlertCircle } from 'lucide-react';
import './Rooms.css';

const ROOM_CATEGORIES = [
  { value: 'standard', label: '🛏️ Standard Room' },
  { value: 'deluxe', label: '✨ Deluxe Room' },
  { value: 'premium', label: '👑 Premium Room' },
  { value: 'suite', label: '🛁 Luxury Suite' },
  { value: 'custom', label: '⚙️ Custom Category' }
];

const ROOM_AMENITIES = [
  { value: 'ac', label: '❄️ Air Conditioner' },
  { value: 'tv', label: '📺 Smart TV' },
  { value: 'minibar', label: '🍾 Mini Bar' },
  { value: 'wifi', label: '🛜 High Speed Wifi' },
  { value: 'balcony', label: '🌅 Private Balcony' },
  { value: 'tub', label: '🛁 Bath Tub' }
];

const Rooms = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form states
  const [category, setCategory] = useState('standard');
  const [price, setPrice] = useState('');
  const [weekendPrice, setWeekendPrice] = useState('');
  const [enableSurgePricing, setEnableSurgePricing] = useState(false);
  const [capacity, setCapacity] = useState('2');
  const [roomImagesList, setRoomImagesList] = useState([]);
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [brokenImages, setBrokenImages] = useState({});
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [cancellationPolicy, setCancellationPolicy] = useState('Free cancellation within 24 hours');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Bulk Adder rows
  const [bulkRows, setBulkRows] = useState([
    { category: 'standard', price: 120, capacity: 2, amenities: ['wifi', 'ac'] },
    { category: 'deluxe', price: 200, capacity: 2, amenities: ['wifi', 'ac', 'tv'] },
    { category: 'suite', price: 350, capacity: 4, amenities: ['wifi', 'ac', 'tv', 'minibar', 'tub'] }
  ]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.properties.getOwnerProperties();
      setProperties(res.properties);
      if (res.properties.length > 0) {
        setSelectedPropertyId(res.properties[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load properties');
      setLoading(false);
    }
  };

  const fetchRooms = async (propertyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.rooms.getRoomsByProperty(propertyId);
      setRooms(res.rooms);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setCategory('standard');
    setPrice('');
    setWeekendPrice('');
    setEnableSurgePricing(false);
    setCapacity('2');
    setSelectedAmenities([]);
    setRoomImagesList([]);
    setNewRoomImageUrl('');
    setCancellationPolicy('Free cancellation within 24 hours');
    setFormError('');
    setShowSingleModal(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setCategory(room.category);
    setPrice(room.price.toString());
    setWeekendPrice(room.weekendPrice ? room.weekendPrice.toString() : '');
    setEnableSurgePricing(room.enableSurgePricing || false);
    setCapacity(room.capacity.toString());
    setSelectedAmenities(room.amenities || []);
    
    let imagesArray = [];
    if (Array.isArray(room.images)) {
      imagesArray = room.images;
    } else if (typeof room.images === 'string' && room.images) {
      imagesArray = [room.images];
    }
    setRoomImagesList(imagesArray);
    
    setNewRoomImageUrl('');
    setCancellationPolicy(room.cancellationPolicy || 'Free cancellation within 24 hours');
    setFormError('');
    setShowSingleModal(true);
  };

  const handleAddRoomPhoto = async (urlToResolve) => {
    const trimmed = urlToResolve.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/utils/resolve-image?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const resolved = data.success && data.resolvedUrl ? data.resolvedUrl : trimmed;
      setRoomImagesList(prev => [...prev, resolved]);
    } catch (err) {
      setRoomImagesList(prev => [...prev, trimmed]);
    }
  };

  const handleAmenityToggle = (val) => {
    if (selectedAmenities.includes(val)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== val));
    } else {
      setSelectedAmenities([...selectedAmenities, val]);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!price) return;
    setFormError('');
    setFormLoading(true);

    let finalImages = [...roomImagesList];
    if (newRoomImageUrl.trim()) {
      const trimmed = newRoomImageUrl.trim();
      try {
        const res = await fetch(`http://localhost:5000/api/utils/resolve-image?url=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const resolved = data.success && data.resolvedUrl ? data.resolvedUrl : trimmed;
        if (!finalImages.includes(resolved)) {
          finalImages.push(resolved);
        }
      } catch (err) {
        if (!finalImages.includes(trimmed)) {
          finalImages.push(trimmed);
        }
      }
    }

    const roomData = {
      propertyId: selectedPropertyId,
      category,
      price: parseFloat(price) || 0,
      weekendPrice: parseFloat(weekendPrice) || 0,
      enableSurgePricing,
      capacity: parseInt(capacity) || 2,
      amenities: selectedAmenities,
      images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
      cancellationPolicy
    };

    try {
      if (editingRoom) {
        await api.rooms.update(editingRoom._id, roomData);
      } else {
        await api.rooms.create(roomData);
      }
      setShowSingleModal(false);
      fetchRooms(selectedPropertyId);
    } catch (err) {
      setFormError(err.message || 'Failed to save room category');
    } finally {
      setFormLoading(false);
    }
  };

  // Bulk rows helpers
  const handleBulkRowChange = (index, field, value) => {
    const updated = [...bulkRows];
    updated[index][field] = value;
    setBulkRows(updated);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.rooms.bulkAdd(selectedPropertyId, bulkRows);
      setShowBulkModal(false);
      fetchRooms(selectedPropertyId);
    } catch (err) {
      setFormError(err.message || 'Bulk addition failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRoom = async (id, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the "${categoryName}" room category?`)) return;
    try {
      await api.rooms.delete(id);
      fetchRooms(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="container rooms-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Manage Rooms Inventory</h2>
          <p className="subtitle">Configure room configurations, pricing structures, capacity limits, and calendar blocks</p>
        </div>

        <div className="flex gap-12">
          {properties.length > 0 && (
            <>
              <button onClick={() => setShowBulkModal(true)} className="btn btn-outline flex-center gap-4">
                <Sparkles size={16} /> Bulk Add Categories
              </button>
              <button onClick={handleOpenAdd} className="btn btn-primary">
                <Plus size={16} /> Add Room Category
              </button>
            </>
          )}
        </div>
      </section>

      {/* Property selector */}
      <section className="property-banner card flex-between flex-wrap gap-12" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-center">
          <Bed size={18} style={{ color: 'var(--primary-color)', marginRight: '10px' }} />
          <h5 style={{ fontSize: '15px', fontWeight: '800' }}>Active Property Context:</h5>
        </div>
        
        <select 
          value={selectedPropertyId} 
          onChange={e => setSelectedPropertyId(e.target.value)}
          className="form-control"
          style={{ width: '280px', padding: '8px 12px' }}
        >
          {properties.length === 0 ? (
            <option value="">No properties available</option>
          ) : (
            properties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))
          )}
        </select>
      </section>

      {error && <div className="error-card">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>Loading Room Categories...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Properties Available</h5>
          <p className="subtitle">You must create a property first in the Properties tab before listing rooms.</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Bed size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Room Categories Listed</h5>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Configure standard or deluxe rooms to make them bookable by customers.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            Add Room Category
          </button>
        </div>
      ) : (
        <div className="rooms-list-grid grid grid-cols-3">
          {rooms.map(r => (
            <div key={r._id} className="card room-card card-premium-border">
              <div className="room-card-image">
                <img 
                  src={Array.isArray(r.images) 
                    ? (r.images?.[0] || 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80')
                    : (typeof r.images === 'string' && r.images ? r.images : 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80')
                  } 
                  alt={r.category} 
                  referrerPolicy="no-referrer"
                />
                <span className="price-tag">₹{r.price.toLocaleString('en-IN')}<span>/night</span></span>
              </div>

              <div className="room-card-details">
                <div className="flex-between">
                  <h5 style={{ textTransform: 'capitalize' }}>{r.category} Room</h5>
                  <span className="capacity-badge">👥 Max {r.capacity} Guests</span>
                </div>

                <p className="policy-text"><strong>Policy:</strong> {r.cancellationPolicy}</p>

                <div className="room-facilities flex">
                  {r.amenities?.map(a => (
                    <span key={a} className="room-facility-pill">{a.toUpperCase()}</span>
                  ))}
                </div>

                {r.blockedDates?.length > 0 && (
                  <div className="blocked-dates-indicator">
                    🛑 <strong>{r.blockedDates.length} Dates Blocked</strong> in reservation calendars.
                  </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

                <div className="flex-between">
                  <span className="availability-label">
                    Status: {r.availability ? <span style={{ color: '#16A34A', fontWeight: '700' }}>Live</span> : <span style={{ color: '#EF4444', fontWeight: '700' }}>Blocked</span>}
                  </span>
                  
                  <div className="actions flex">
                    <button onClick={() => handleOpenEdit(r)} className="btn-action-circle" title="Edit category">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteRoom(r._id, r.category)} className="btn-action-circle danger" title="Delete category">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Add/Edit Modal */}
      {showSingleModal && (
        <div className="modal-overlay">
          <div className="modal-content room-form-modal">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>{editingRoom ? 'Edit Room Category' : 'Create Room Category'}</h4>
              <button onClick={() => setShowSingleModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            {formError && <div className="login-error-alert" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleSingleSubmit} className="room-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Room Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="form-control"
                  >
                    {ROOM_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nightly Price (INR)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 1500" 
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Weekend Price (Fri/Sat) (Optional)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 2000" 
                    value={weekendPrice}
                    onChange={e => setWeekendPrice(e.target.value)}
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>Leave empty to use base price</small>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="surgeToggle"
                    checked={enableSurgePricing}
                    onChange={e => setEnableSurgePricing(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                  />
                  <label htmlFor="surgeToggle" style={{ margin: 0, fontWeight: '600', cursor: 'pointer' }}>
                    Enable Auto-Surge Pricing (+15%)
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'normal', marginTop: '2px' }}>
                      Automatically increase price when property occupancy &gt; 80%
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Guest Capacity</label>
                  <select 
                    value={capacity} 
                    onChange={e => setCapacity(e.target.value)}
                    className="form-control"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="6">6 Guests</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cancellation Policy</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Free cancellation within 24 hours"
                    value={cancellationPolicy}
                    onChange={e => setCancellationPolicy(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Room Photos (Multiple Image URLs)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="Enter image link, e.g. https://images.unsplash.com/..."
                    value={newRoomImageUrl}
                    onChange={e => setNewRoomImageUrl(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={async () => {
                      if (newRoomImageUrl.trim()) {
                        const url = newRoomImageUrl.trim();
                        setNewRoomImageUrl('');
                        await handleAddRoomPhoto(url);
                      }
                    }}
                    style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                  >
                    Add Photo
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minHeight: '60px', padding: '8px', border: '1px dashed var(--border-color)', borderRadius: '6px', background: '#F8FAFC' }}>
                  {roomImagesList.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', margin: 'auto' }}>No photos added yet</span>
                  ) : (
                    roomImagesList.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid ' + (brokenImages[url] ? '#EF4444' : 'var(--border-color)'), background: brokenImages[url] ? '#FEF2F2' : 'transparent' }}>
                        {brokenImages[url] ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', textAlign: 'center' }} title="Broken/Invalid Image Link. Make sure to right-click the image on the web and choose 'Copy Image Link/Address'.">
                            <span style={{ fontSize: '14px' }}>⚠️</span>
                            <span style={{ fontSize: '8px', color: '#EF4444', fontWeight: 'bold', lineHeight: '1' }}>Invalid link</span>
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt={`room-photo-${idx}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={() => setBrokenImages(prev => ({ ...prev, [url]: true }))}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <button 
                          type="button" 
                          onClick={() => {
                            setRoomImagesList(roomImagesList.filter((_, i) => i !== idx));
                            setBrokenImages(prev => {
                              const updated = { ...prev };
                              delete updated[url];
                              return updated;
                            });
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-medium)', display: 'block', marginTop: '6px' }}>
                  💡 <strong>Tip:</strong> Make sure to copy the <strong>direct image link</strong> (ending in .jpg, .png, etc.), not the page URL. For Pinterest/Google, right-click the image and select <strong>"Copy image address"</strong>.
                </span>
              </div>

              <div className="form-group">
                <label>Room Facilities Amenities</label>
                <div className="amenities-selection-grid">
                  {ROOM_AMENITIES.map(a => {
                    const isChecked = selectedAmenities.includes(a.value);
                    return (
                      <div 
                        key={a.value} 
                        className={`amenity-select-card ${isChecked ? 'active' : ''}`}
                        onClick={() => handleAmenityToggle(a.value)}
                      >
                        <span>{a.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '32px' }}>
                <button type="button" onClick={() => setShowSingleModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content bulk-form-modal">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>Bulk Add Room Categories</h4>
              <button onClick={() => setShowBulkModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Configure prices and parameters for standard rooms, deluxe rooms, and suites in one click.
            </p>

            {formError && <div className="login-error-alert" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleBulkSubmit}>
              <div className="bulk-rows-list">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="bulk-row flex-between gap-12" style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1.2 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-medium)' }}>Category</label>
                      <select 
                        value={row.category} 
                        onChange={e => handleBulkRowChange(idx, 'category', e.target.value)}
                        className="form-control"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      >
                        <option value="standard">Standard</option>
                        <option value="deluxe">Deluxe</option>
                        <option value="premium">Premium</option>
                        <option value="suite">Suite</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-medium)' }}>Price (INR)</label>
                      <input 
                        type="number" 
                        value={row.price}
                        onChange={e => handleBulkRowChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="form-control"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        required
                      />
                    </div>

                    <div style={{ flex: 0.8 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-medium)' }}>Capacity</label>
                      <input 
                        type="number" 
                        value={row.capacity}
                        onChange={e => handleBulkRowChange(idx, 'capacity', parseInt(e.target.value) || 2)}
                        className="form-control"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '32px' }}>
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Publishing Rooms...' : 'Publish Bulk Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
