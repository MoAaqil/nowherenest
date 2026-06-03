import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Star, 
  Wifi, 
  Flame, 
  Zap, 
  Utensils, 
  Trash2, 
  Edit3, 
  X,
  Compass
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import './Properties.css';

const GEOGRAPHY_DATA = {
  'Tamil Nadu': {
    'Madurai': ['Melur', 'Madurai City', 'Thirumangalam'],
    'Chennai': ['Adyar', 'T. Nagar', 'Velachery', 'Marina', 'OMR'],
    'Coimbatore': ['Pollachi', 'Coimbatore City'],
    'Kanyakumari': ['Nagercoil', 'Kanyakumari Town'],
    'Nilgiris': ['Ooty', 'Coonoor', 'Kotagiri'],
    'Dindigul': ['Kodaikanal']
  },
  'Kerala': {
    'Kottayam': ['Kumarakom', 'Kottayam City', 'Changanassery'],
    'Ernakulam': ['Kochi', 'Aluva', 'Kakkanad', 'Fort Kochi'],
    'Wayanad': ['Kalpetta', 'Mananthavady', 'Sulthan Bathery'],
    'Alappuzha': ['Alleppey', 'Cherthala'],
    'Idukki': ['Munnar', 'Thekkady', 'Adimali'],
    'Trivandrum': ['Varkala', 'Kovalam', 'Trivandrum City'],
    'Thrissur': ['Thrissur', 'Guruvayur'],
    'Palakkad': ['Palakkad', 'Ottapalam']
  },
  'Karnataka': {
    'Bangalore': ['Indiranagar', 'Whitefield', 'Koramangala'],
    'Mysore': ['Mysore City', 'Gokulam'],
    'Coorg': ['Madikeri', 'Kushalnagar', 'Coorg'],
    'Uttara Kannada': ['Gokarna', 'Murudeshwar', 'Karwar']
  },
  'Maharashtra': {
    'Mumbai': ['Bandra', 'Andheri', 'Colaba'],
    'Pune': ['Koregaon Park', 'Kothrud', 'Baner'],
    'Nashik': ['Panchavati', 'Indira Nagar'],
    'Mahabaleshwar': ['Panchgani', 'Mahabaleshwar Town']
  },
  'Delhi': {
    'New Delhi': ['Connaught Place', 'Chanakyapuri', 'Saket'],
    'South Delhi': ['Greater Kailash', 'Hauz Khas', 'Vasant Kunj'],
    'North Delhi': ['Model Town', 'Civil Lines']
  },
  'Goa': {
    'North Goa': ['Calangute', 'Baga', 'Anjuna', 'Panaji'],
    'South Goa': ['Margao', 'Colva', 'Palolem', 'Vasco da Gama']
  },
  'Rajasthan': {
    'Jaipur': ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme'],
    'Udaipur': ['Lake City', 'Fateh Sagar'],
    'Jodhpur': ['Sardarpura', 'Shastri Nagar']
  },
  'Himachal Pradesh': {
    'Shimla': ['Mall Road', 'Chhota Shimla'],
    'Manali': ['Old Manali', 'New Manali', 'Solang Valley']
  },
  'West Bengal': {
    'Kolkata': ['Salt Lake', 'Park Street', 'New Town'],
    'Darjeeling': ['Mall Road', 'Ghum', 'Kurseong']
  },
  'Telangana': {
    'Hyderabad': ['Gachibowli', 'Jubilee Hills', 'Banjara Hills', 'Secunderabad'],
    'Warangal': ['Hanamkonda', 'Kazipet']
  },
  'Andhra Pradesh': {
    'Visakhapatnam': ['Gajuwaka', 'Madhurawada', 'Waltair Uplands'],
    'Vijayawada': ['Benz Circle', 'One Town']
  }
};

const AMENITY_OPTIONS = [
  { value: 'wifi', label: '🛜 Wifi' },
  { value: 'hot_water', label: '🔥 Hot Water' },
  { value: 'electricity', label: '⚡ 24/7 Power' },
  { value: 'food', label: '🍲 Food Services' },
  { value: 'pool', label: '🏊 Swimming Pool' },
  { value: 'gym', label: '🏋️ Gymnasium' },
  { value: 'parking', label: '🚗 Free Parking' }
];

const PROPERTY_TYPES = [
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'resort', label: '🌳 Resort' },
  { value: 'villa', label: '🏡 Luxury Villa' },
  { value: 'homestay', label: '🏠 Local Homestay' },
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'guesthouse', label: '🏘️ Guest House' }
];

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('hotel');
  const [landscapeCategory, setLandscapeCategory] = useState('city');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('9.5929');
  const [lng, setLng] = useState('76.4227');
  const [starRating, setStarRating] = useState('3');
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [photosList, setPhotosList] = useState([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [brokenImages, setBrokenImages] = useState({});
  const [identityProofType, setIdentityProofType] = useState('aadhar');
  const [identityProofNumber, setIdentityProofNumber] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Address selection state
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  // Custom USPs state
  const [formUsps, setFormUsps] = useState([]);
  const [newUspTitle, setNewUspTitle] = useState('');
  const [newUspDesc, setNewUspDesc] = useState('');
  const [newUspPrice, setNewUspPrice] = useState('');
  const [newUspChargeType, setNewUspChargeType] = useState('per_family');

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleAutoFetchCoordinates = async () => {
    if (!selectedState || !selectedDistrict || !selectedCity || !streetAddress) {
      alert("Please fill in State, District, City, and Street Address first.");
      return;
    }
    setIsFetchingLocation(true);
    try {
      const query = `${streetAddress}, ${selectedCity}, ${selectedDistrict}, ${selectedState}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' }});
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat).toFixed(6));
        setLng(parseFloat(data[0].lon).toFixed(6));
      } else {
        alert("Couldn't automatically find the coordinates. Please manually click on the map or enter lat/lng.");
      }
    } catch (err) {
      alert("Error fetching location.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleAddPhoto = async (urlToResolve) => {
    const trimmed = urlToResolve.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/utils/resolve-image?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const resolved = data.success && data.resolvedUrl ? data.resolvedUrl : trimmed;
      setPhotosList(prev => [...prev, resolved]);
    } catch (err) {
      setPhotosList(prev => [...prev, trimmed]);
    }
  };

  const handleAddUsp = () => {
    if (!newUspTitle.trim()) return;
    const priceVal = parseFloat(newUspPrice) || 0;
    setFormUsps([...formUsps, {
      title: newUspTitle.trim(),
      description: newUspDesc.trim(),
      price: priceVal,
      chargeType: newUspChargeType
    }]);
    setNewUspTitle('');
    setNewUspDesc('');
    setNewUspPrice('');
    setNewUspChargeType('per_family');
  };

  const handleRemoveUsp = (idx) => {
    setFormUsps(formUsps.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.properties.getOwnerProperties();
      setProperties(res.properties);
    } catch (err) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setName('');
    setDescription('');
    setType('hotel');
    setLandscapeCategory('city');
    setAddress('');
    setLat('9.5929');
    setLng('76.4227');
    setStarRating('3');
    setCheckInTime('12:00 PM');
    setCheckOutTime('11:00 AM');
    setSelectedAmenities([]);
    setPhotosList([]);
    setNewPhotoUrl('');
    setIdentityProofType('aadhar');
    setIdentityProofNumber('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedCity('');
    setStreetAddress('');
    setFormUsps([]);
    setNewUspTitle('');
    setNewUspDesc('');
    setNewUspPrice('');
    setNewUspChargeType('per_family');
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (property) => {
    setEditingProperty(property);
    setName(property.name);
    setDescription(property.description || '');
    setType(property.type);
    setLandscapeCategory(property.landscapeCategory || 'city');
    setAddress(property.address);
    setLat(property.location?.coordinates?.[1]?.toString() || '0');
    setLng(property.location?.coordinates?.[0]?.toString() || '0');
    setStarRating(property.starRating?.toString() || '3');
    setCheckInTime(property.checkInTime || '12:00 PM');
    setCheckOutTime(property.checkOutTime || '11:00 AM');
    setSelectedAmenities(property.amenities || []);
    
    let photosArray = [];
    if (Array.isArray(property.photos)) {
      photosArray = property.photos;
    } else if (typeof property.photos === 'string' && property.photos) {
      photosArray = [property.photos];
    }
    setPhotosList(photosArray);
    
    setNewPhotoUrl('');
    setIdentityProofType(property.identityProofType || 'aadhar');
    setIdentityProofNumber(property.identityProofNumber || '');
    
    // Parse address parts for dropdowns
    const addressStr = property.address || '';
    const parts = addressStr.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Remove pin codes from state name if present (e.g. "Kerala - 686563" -> "Kerala")
      let statePart = parts[parts.length - 1];
      const pinIndex = statePart.search(/-\s*\d+/);
      if (pinIndex !== -1) {
        statePart = statePart.substring(0, pinIndex).trim();
      }
      
      const districtPart = parts[parts.length - 2];
      const cityPart = parts[parts.length - 3];
      const streetPart = parts.slice(0, parts.length - 3).join(', ');
      
      setSelectedState(statePart);
      setSelectedDistrict(districtPart);
      setSelectedCity(cityPart);
      setStreetAddress(streetPart || cityPart);
    } else {
      setStreetAddress(addressStr);
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedCity('');
    }

    // Set custom experiences
    setFormUsps(property.usps || []);
    setNewUspTitle('');
    setNewUspDesc('');
    setNewUspPrice('');
    setNewUspChargeType('per_family');
    setFormError('');
    setShowFormModal(true);
  };

  const handleAmenityToggle = (val) => {
    if (selectedAmenities.includes(val)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== val));
    } else {
      setSelectedAmenities([...selectedAmenities, val]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Combine street, city, district, state into single address
    const compiledAddress = streetAddress && selectedCity && selectedDistrict && selectedState
      ? `${streetAddress}, ${selectedCity}, ${selectedDistrict}, ${selectedState}`
      : address;

    let finalPhotos = [...photosList];
    if (newPhotoUrl.trim()) {
      const trimmed = newPhotoUrl.trim();
      try {
        const res = await fetch(`http://localhost:5000/api/utils/resolve-image?url=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const resolved = data.success && data.resolvedUrl ? data.resolvedUrl : trimmed;
        if (!finalPhotos.includes(resolved)) {
          finalPhotos.push(resolved);
        }
      } catch (err) {
        if (!finalPhotos.includes(trimmed)) {
          finalPhotos.push(trimmed);
        }
      }
    }

    const propertyData = {
      name,
      description,
      type,
      landscapeCategory,
      address: compiledAddress,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
      },
      starRating: parseInt(starRating) || 3,
      checkInTime,
      checkOutTime,
      amenities: selectedAmenities,
      photos: finalPhotos.length > 0 ? finalPhotos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
      identityProofType,
      identityProofNumber,
      usps: formUsps,
      state: selectedState || '',
      district: selectedDistrict || '',
    };

    try {
      if (editingProperty) {
        await api.properties.update(editingProperty._id, propertyData);
      } else {
        await api.properties.create(propertyData);
      }
      setShowFormModal(false);
      fetchProperties();
    } catch (err) {
      setFormError(err.message || 'Failed to save property');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProperty = async (id, name) => {
    if (!window.confirm(`Warning: Are you sure you want to delete "${name}"? This will delete all rooms associated with this property.`)) return;
    try {
      await api.properties.delete(id);
      fetchProperties();
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="container properties-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Manage Properties</h2>
          <p className="subtitle">List and configure accommodation parameters, metadata details, and locations</p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Property
        </button>
      </section>

      {error && <div className="error-card">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>Loading Properties...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Building2 size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Properties Listed</h5>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Get started by adding your first hotel or resort listing.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            Add Property Now
          </button>
        </div>
      ) : (
        <div className="properties-grid grid grid-cols-3">
          {properties.map(p => (
            <div key={p._id} className="card property-card card-premium-border">
              <div className="property-card-image">
                <img 
                  src={Array.isArray(p.photos) 
                    ? (p.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80')
                    : (typeof p.photos === 'string' && p.photos ? p.photos : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80')
                  } 
                  alt={p.name} 
                  referrerPolicy="no-referrer"
                />
                <span className="type-badge">{p.type}</span>
              </div>

              <div className="property-card-details">
                <div className="flex-between">
                  <h5>{p.name}</h5>
                  <div className="stars flex-center">
                    <Star size={14} className="star-icon-filled" />
                    <span>{p.starRating}</span>
                  </div>
                </div>

                <p className="address flex">
                  <MapPin size={14} style={{ marginRight: '4px', flexShrink: 0 }} />
                  <span>{p.address}</span>
                </p>

                <div className="details-checklist flex">
                  {p.amenities?.slice(0, 3).map(a => (
                    <span key={a} className="amenity-badge">{a.replace('_', ' ')}</span>
                  ))}
                  {p.amenities?.length > 3 && (
                    <span className="amenity-badge">+{p.amenities.length - 3} more</span>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

                <div className="flex-between flex-wrap gap-8">
                  <span className="check-time">Check-in: {p.checkInTime}</span>
                  <div className="actions flex">
                    <button 
                      onClick={() => handleOpenEdit(p)}
                      className="btn-action-circle" 
                      title="Edit details"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProperty(p._id, p.name)}
                      className="btn-action-circle danger" 
                      title="Delete property"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content property-form-modal">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>{editingProperty ? 'Edit Property Details' : 'Add New Property'}</h4>
              <button onClick={() => setShowFormModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="property-form">
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Property Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Bail Exotica Cottage"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Property Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    className="form-control"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Landscape Category</label>
                  <select 
                    value={landscapeCategory} 
                    onChange={e => setLandscapeCategory(e.target.value)} 
                    className="form-control"
                  >
                    <option value="city">City / Urban</option>
                    <option value="hillstation">Hillstation / Mountains</option>
                    <option value="beach">Beach / Coastal</option>
                    <option value="forest">Forest / Jungle</option>
                    <option value="desert">Desert / Safari</option>
                    <option value="village">Village / Rural</option>
                    <option value="island">Island / Backwaters</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  placeholder="Provide general features and local surrounding details..."
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Address Details Selection</label>
                <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-medium)' }}>State</label>
                    <select 
                      value={selectedState} 
                      onChange={e => {
                        setSelectedState(e.target.value);
                        setSelectedDistrict('');
                        setSelectedCity('');
                      }} 
                      className="form-control"
                      required
                    >
                      <option value="">Select State</option>
                      {Object.keys(GEOGRAPHY_DATA).map(stateName => (
                        <option key={stateName} value={stateName}>{stateName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-medium)' }}>District</label>
                    <select 
                      value={selectedDistrict} 
                      onChange={e => {
                        setSelectedDistrict(e.target.value);
                        setSelectedCity('');
                      }} 
                      className="form-control"
                      disabled={!selectedState}
                      required
                    >
                      <option value="">Select District</option>
                      {selectedState && Object.keys(GEOGRAPHY_DATA[selectedState] || {}).map(distName => (
                        <option key={distName} value={distName}>{distName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-medium)' }}>City / Town</label>
                    <select 
                      value={selectedCity} 
                      onChange={e => setSelectedCity(e.target.value)} 
                      className="form-control"
                      disabled={!selectedDistrict}
                      required
                    >
                      <option value="">Select City</option>
                      {selectedDistrict && (GEOGRAPHY_DATA[selectedState]?.[selectedDistrict] || []).map(cityName => (
                        <option key={cityName} value={cityName}>{cityName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-medium)' }}>Street Address / Landmark</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 21 Mankatti Theppakulam, Melur"
                    value={streetAddress}
                    onChange={e => {
                      setStreetAddress(e.target.value);
                      setAddress(`${e.target.value}, ${selectedCity || ''}, ${selectedDistrict || ''}, ${selectedState || ''}`);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>Select Location on Map</label>
                  <button type="button" onClick={handleAutoFetchCoordinates} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }} disabled={isFetchingLocation}>
                    {isFetchingLocation ? 'Fetching...' : '📍 Auto-fetch from Address'}
                  </button>
                </div>
                <div style={{ height: '220px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <LeafletMap 
                    listings={[{
                      location: {
                        lat: parseFloat(lat) || 9.5929,
                        lng: parseFloat(lng) || 76.4227
                      }
                    }]}
                    center={[parseFloat(lat) || 9.5929, parseFloat(lng) || 76.4227]}
                    zoom={12}
                    onSelectCoords={(coords) => {
                      setLat(coords.lat.toFixed(6));
                      setLng(coords.lng.toFixed(6));
                    }}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label><Compass size={12} /> Latitude</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 9.5929"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label><Compass size={12} /> Longitude</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 76.4227"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Star Rating</label>
                  <select 
                    value={starRating} 
                    onChange={e => setStarRating(e.target.value)}
                    className="form-control"
                  >
                    <option value="1">1 Star</option>
                    <option value="2">2 Star</option>
                    <option value="3">3 Star</option>
                    <option value="4">4 Star</option>
                    <option value="5">5 Star</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Check-in Policy</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 12:00 PM"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Policy</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 11:00 AM"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Property Photos (Multiple Image URLs)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="Enter image link, e.g. https://images.unsplash.com/..."
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={async () => {
                      if (newPhotoUrl.trim()) {
                        const url = newPhotoUrl.trim();
                        setNewPhotoUrl('');
                        await handleAddPhoto(url);
                      }
                    }}
                    style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                  >
                    Add Photo
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minHeight: '60px', padding: '8px', border: '1px dashed var(--border-color)', borderRadius: '6px', background: '#F8FAFC' }}>
                  {photosList.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', margin: 'auto' }}>No photos added yet</span>
                  ) : (
                    photosList.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid ' + (brokenImages[url] ? '#EF4444' : 'var(--border-color)'), background: brokenImages[url] ? '#FEF2F2' : 'transparent' }}>
                        {brokenImages[url] ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', textAlign: 'center' }} title="Broken/Invalid Image Link. Make sure to right-click the image on the web and choose 'Copy Image Link/Address'.">
                            <span style={{ fontSize: '14px' }}>⚠️</span>
                            <span style={{ fontSize: '8px', color: '#EF4444', fontWeight: 'bold', lineHeight: '1' }}>Invalid link</span>
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt={`photo-${idx}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={() => setBrokenImages(prev => ({ ...prev, [url]: true }))}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <button 
                          type="button" 
                          onClick={() => {
                            setPhotosList(photosList.filter((_, i) => i !== idx));
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

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Host Identity Verification Proof</label>
                  <select 
                    value={identityProofType} 
                    onChange={e => setIdentityProofType(e.target.value)} 
                    className="form-control"
                  >
                    <option value="passport">Passport</option>
                    <option value="aadhar">Aadhar Copy</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Proof ID / Document Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Card or Doc number"
                    value={identityProofNumber}
                    onChange={e => setIdentityProofNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Custom Host Experiences (USPs) */}
              <div className="form-group" style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '20px', background: '#F8FAFC' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px', display: 'block', color: 'var(--primary-color)' }}>
                  Host Direct Experiences (Optional)
                </label>
                <span className="subtitle" style={{ fontSize: '11px', display: 'block', marginBottom: '12px' }}>
                  Offer unique local treks, food services, or camp stays for extra revenue
                </span>

                {formUsps.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {formUsps.map((usp, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ textAlign: 'left' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{usp.title}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-medium)', display: 'block' }}>{usp.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--primary-color)' }}>
                            ₹{usp.price} {usp.chargeType === 'per_person' ? '/ guest' : '/ stay'}
                          </strong>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveUsp(idx)} 
                            style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.7fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Experience Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Guided Trekking" 
                      value={newUspTitle}
                      onChange={e => setNewUspTitle(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2hr walk to tea gardens" 
                      value={newUspDesc}
                      onChange={e => setNewUspDesc(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Price (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1200" 
                      value={newUspPrice}
                      onChange={e => setNewUspPrice(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-medium)' }}>Charge Model</label>
                    <select 
                      value={newUspChargeType} 
                      onChange={e => setNewUspChargeType(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    >
                      <option value="per_family">Per Stay (Flat)</option>
                      <option value="per_person">Per Guest (Head)</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddUsp} 
                    className="btn btn-primary"
                    style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Amenities Selection</label>
                <div className="amenities-selection-grid">
                  {AMENITY_OPTIONS.map(a => {
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
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingProperty ? 'Save Changes' : 'Publish Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
