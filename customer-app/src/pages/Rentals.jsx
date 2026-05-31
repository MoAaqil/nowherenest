import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, MapPin, Shield, Star, DollarSign, ListFilter, Activity, Award, Navigation } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import './Rentals.css';
import { formatPrice } from '../utils/currency';
import { translate } from '../utils/translations';

// Haversine formula to compute distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // returns distance in km
};

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const [currencyChanged, setCurrencyChanged] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrencyChanged(prev => prev + 1);
      setLanguage(localStorage.getItem('language') || 'English');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('pg'); // 'pg' or 'apartment'
  const [maxRent, setMaxRent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search Radar Loader States
  const [isSearching, setIsSearching] = useState(false);
  const [searchStepText, setSearchStepText] = useState('');

  // Center (MG Road, Kochi as default)
  const [mapCenter, setMapCenter] = useState([9.9723, 76.2805]);

  // GPS coordinates
  const gpsEnabled = localStorage.getItem('gps_enabled') === 'true';
  const userLat = parseFloat(localStorage.getItem('user_lat')) || 9.5930;
  const userLng = parseFloat(localStorage.getItem('user_lng')) || 76.4230;

  useEffect(() => {
    fetchRentals(searchQuery, selectedCategory, maxRent);
  }, [selectedCategory, maxRent, currencyChanged]);

  const fetchRentals = async (queryVal = searchQuery, catVal = selectedCategory, maxRentVal = maxRent) => {
    setLoading(true);
    setIsSearching(true);
    setError(null);

    const steps = language === 'Tamil' ? [
      'GPS அலகுகளை அணுகுகிறது...',
      'அருகிலுள்ள வாடகை வீடுகளின் தூரத்தை கணக்கிடுகிறது...',
      'அறைகள் & PG-களை தேடுகிறது...',
      'கட்டண விவரங்களை சரிபார்க்கிறது...'
    ] : [
      'Accessing GPS coordinates...',
      'Checking PG availability proximity...',
      'Querying active local rooms & PGs...',
      'Verifying brokerage-free pricing...'
    ];

    setSearchStepText(steps[0]);
    const t1 = setTimeout(() => setSearchStepText(steps[1]), 350);
    const t2 = setTimeout(() => setSearchStepText(steps[2]), 700);
    const t3 = setTimeout(() => setSearchStepText(steps[3]), 1050);

    try {
      const isSearchActive = !!queryVal.trim();

      const res = await api.listings.getAll({
        type: 'rental',
        category: isSearchActive ? '' : catVal,
        search: isSearchActive ? queryVal : ''
      });

      let filtered = res.listings || [];
      if (maxRentVal) {
        filtered = filtered.filter(item => item.price <= parseFloat(maxRentVal));
      }

      // Calculate distance for all listings
      filtered = filtered.map(item => {
        let distance = null;
        if (item.location && typeof item.location.lat === 'number' && typeof item.location.lng === 'number') {
          distance = calculateDistance(userLat, userLng, item.location.lat, item.location.lng);
        }
        return { ...item, distance };
      });

      // Strict 40km radius filtering if no search query is active and GPS is enabled
      if (!isSearchActive && gpsEnabled) {
        filtered = filtered.filter(item => item.distance !== null && item.distance <= 40);
      }

      // Sort closest first
      filtered.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      setTimeout(() => {
        setRentals(filtered);
        if (filtered.length > 0 && filtered[0].location) {
          setMapCenter([filtered[0].location.lat, filtered[0].location.lng]);
        }
        setIsSearching(false);
        setLoading(false);
      }, 1300);

    } catch (err) {
      setError(err.message || 'Failed to load PG rentals');
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRentals(searchQuery, selectedCategory, maxRent);
  };

  return (
    <div className="rentals-page container">
      {/* Hero header panel */}
      <section className="rentals-hero card">
        <div className="rentals-hero-content">
          <span className="badge badge-success">{translate('rentals_badge', language)}</span>
          <h2>{translate('rentals_title', language)}</h2>
          <p>{translate('rentals_desc', language)}</p>
          
          <form onSubmit={handleSearchSubmit} className="rentals-search-bar">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder={translate('search_pg_placeholder', language)} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-accent">{translate('search_pg_btn', language)}</button>
          </form>
        </div>
      </section>

      {/* GPS Location Proximity Indicator */}
      {gpsEnabled && (
        <div className="gps-alert-strip card flex" style={{ background: 'linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%)', borderLeft: '4px solid var(--accent-color)', padding: '12px 20px', fontSize: '13.5px', color: 'var(--text-dark)', alignItems: 'center', gap: '10px', marginBottom: '24px', borderRadius: '12px' }}>
          <Navigation size={18} style={{ color: 'var(--primary-color)', animation: 'pulse-gps 2s infinite' }} />
          <span>
            📍 {translate('gps_rentals_active', language)}
          </span>
        </div>
      )}

      {/* Main filters section */}
      <section className="filters-bar flex-between flex-wrap">
        <div className="category-toggles flex">
          <button 
            className={`btn-toggle ${selectedCategory === 'pg' ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('pg');
            }}
          >
            🏫 {translate('pg_category_shared', language)}
          </button>
          <button 
            className={`btn-toggle ${selectedCategory === 'apartment' ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('apartment');
            }}
          >
            🏢 {translate('pg_category_entire', language)}
          </button>
        </div>

        <div className="filter-inputs flex-center">
          <ListFilter size={18} className="filter-icon" />
          <div className="price-filter-wrapper flex-center">
            <span>{translate('max_rent_label', language)}</span>
            <input 
              type="number" 
              placeholder={translate('any_price', language)} 
              value={maxRent}
              onChange={e => setMaxRent(e.target.value)}
              className="price-filter-input"
            />
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="rentals-layout">
        {/* Left column: List */}
        <div className="rentals-list-column">
          {isSearching ? (
            <div className="radar-search-container flex-center flex-col" style={{ padding: '60px 20px', minHeight: '340px', background: 'white', borderRadius: '16px', border: '1px solid rgba(10,59,42,0.06)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="radar-scanner-circle">
                <div className="radar-sweep-vector"></div>
                <div className="radar-pulse-ring ring-1"></div>
                <div className="radar-pulse-ring ring-2"></div>
                <div className="radar-pulse-ring ring-3"></div>
                <div className="radar-ping ping-a"></div>
                <div className="radar-ping ping-b"></div>
              </div>
              <p className="radar-status-text" style={{ marginTop: '24px', fontWeight: '700', color: '#0A3B2A', fontSize: '13.5px', letterSpacing: '0.1px', minHeight: '20px', textAlign: 'center' }}>
                {searchStepText}
              </p>
            </div>
          ) : error ? (
            <div className="error-card">
              <span>{error}</span>
            </div>
          ) : rentals.length === 0 ? (
            <div className="empty-listings card flex-center">
              <span>{translate('empty_pgs', language)}</span>
            </div>
          ) : (
            <div className="rentals-grid">
              {rentals.map(item => (
                <div key={item._id} className="pg-vertical-card card">
                  <div className="pg-card-banner">
                    <img 
                      src={item.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'} 
                      alt={item.title} 
                    />
                    <div className="no-brokerage-tag">{translate('no_brokerage', language)}</div>
                  </div>

                  <div className="pg-card-body">
                    <div className="flex-between pg-card-meta">
                      <span className="pg-card-cat">{item.category}</span>
                      
                      {item.distance !== null && item.distance !== undefined && (
                        <span className="distance-badge-gps" style={{ fontSize: '10px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                          📍 {item.distance.toFixed(1)} km {translate('away_label', language)}
                        </span>
                      )}

                      <div className="rating-pill">
                        <Star size={12} className="star-icon" />
                        <span>4.7</span>
                      </div>
                    </div>

                    <h4>{item.title}</h4>
                    
                    <p className="pg-address">
                      <MapPin size={14} />
                      <span>{item.location.address}</span>
                    </p>

                    <div className="pg-financials flex-between">
                      <div className="pg-rent">
                        <span className="label">{translate('monthly_rent', language)}</span>
                        <span className="price">{formatPrice(item.price)}<span>/{translate('month_label', language)}</span></span>
                      </div>
                      <div className="pg-deposit">
                        <span className="label">{translate('security_deposit', language)}</span>
                        <span className="price">{formatPrice(item.advanceDeposit || 0)}</span>
                      </div>
                    </div>

                    <div className="pg-amenities flex">
                      {item.amenities.map(a => (
                        <span key={a} className="amenity-chip">{a}</span>
                      ))}
                    </div>

                    <Link to={`/listing/${item._id}`} className="btn btn-primary btn-small btn-block">
                      {translate('view_room_details', language)}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Sticky map */}
        <div className="rentals-map-column">
          <div className="sticky-map-wrapper">
            <LeafletMap listings={rentals} center={mapCenter} zoom={11} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rentals;
