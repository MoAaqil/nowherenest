import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, MapPin, Star, Flame, Compass, ShieldAlert, Navigation, SlidersHorizontal, X } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import './Home.css';
import { formatPrice } from '../utils/currency';
import { translate } from '../utils/translations';
import { SkeletonCard } from '../components/SkeletonCard';

// Haversine formula to compute distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const TOURIST_SITES = [
  { name: 'Kerala Backwaters', tag: 'Vembanad Lake Houseboat', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80', lat: 9.5929, lng: 76.4227 },
  { name: 'Munnar Tea Gardens', tag: 'Scenic Hill Station', image: 'https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=800&q=80', lat: 10.0889, lng: 77.0595 },
  { name: 'Fort Kochi Nets', tag: 'Historic Fort Kochi', image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80', lat: 9.9312, lng: 76.2673 },
  { name: 'Varkala Beach Cliff', tag: 'Arabian Sea Cliffs', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', lat: 8.7305, lng: 76.7130 },
  { name: 'Vagamon Meadows', tag: 'Foggy Vagamon Meadows', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', lat: 9.6914, lng: 76.9060 },
];

// ─── Filter meta constants ───────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: 'cottage', label: '🏡 Cottage / Villa' },
  { id: 'hotel', label: '🏨 Hotel' },
  { id: 'apartment', label: '🏢 Apartment' },
  { id: 'pg', label: '🛏️ PG / Guesthouse' },
];

const ROOM_OFFER_OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'deluxe', label: 'Deluxe' },
  { id: 'premium', label: 'Premium' },
  { id: 'suite', label: 'Suite' },
];

const ACTIVITY_OPTIONS = [
  { id: 'trekking', label: '🥾 Trekking', kw: ['trek', 'hiking', 'hike', 'walk'] },
  { id: 'campfire', label: '🔥 Campfire', kw: ['campfire', 'camp'] },
  { id: 'group', label: '👥 Group Tours', kw: ['group', 'team'] },
  { id: 'water', label: '🚤 Water Sports', kw: ['water', 'boat', 'cruise', 'shikara', 'lake', 'kayak'] },
  { id: 'cycling', label: '🚴 Cycling', kw: ['cycling', 'cycle', 'bike'] },
  { id: 'yoga', label: '🧘 Yoga & Wellness', kw: ['yoga', 'wellness', 'spa', 'meditation'] },
  { id: 'cuisine', label: '🍛 Local Cuisine', kw: ['food', 'cuisine', 'cooking', 'local'] },
  { id: 'wildlife', label: '🦚 Wildlife & Safari', kw: ['wildlife', 'safari', 'bird', 'nature'] },
];

const FACILITIES_LIST = [
  { id: 'wifi', label: '📶 WiFi' },
  { id: 'pool', label: '🏊 Pool' },
  { id: 'ac', label: '❄️ AC' },
  { id: 'hot_water', label: '🚿 Hot Water' },
  { id: 'parking', label: '🅿️ Parking' },
  { id: 'food', label: '🍽️ Food' },
  { id: 'pets', label: '🐾 Pets Allowed' },
  { id: 'gym', label: '🏋️ Gym' },
  { id: 'spa', label: '💆 Spa' },
  { id: 'electricity', label: '⚡ 24h Power' },
];

const NEIGHBORHOOD_OPTIONS = [
  'Kumarakom', 'Munnar', 'Fort Kochi', 'Varkala', 'Alleppey', 'Kovalam', 'Thekkady', 'Wayanad', 'Thrissur', 'Palakkad',
];

const LOCATION_DATA = {
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

const PAYMENT_OPTIONS = [
  { id: 'pay_at_hotel', label: '🏨 Pay at Hotel' },
  { id: 'pay_now', label: '💳 Pay Now' },
  { id: 'free_cancellation', label: '✅ Free Cancellation' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

const Home = () => {
  const [listings, setListings] = useState([]);
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
  const [selectedCategory, setSelectedCategory] = useState('cottage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter drawer open state
  const [showFilters, setShowFilters] = useState(false);

  // ── Basic filters ──
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);

  // ── Extended filters ──
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState([]);
  const [selectedRoomOffers, setSelectedRoomOffers] = useState([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState('any');
  const [onlyVerifiedHosts, setOnlyVerifiedHosts] = useState(false);
  const [minReviewScore, setMinReviewScore] = useState(0);
  const [quickBudget, setQuickBudget] = useState('');

  // GPS range slider
  const [gpsRange, setGpsRange] = useState(() => {
    const saved = localStorage.getItem('gps_range');
    return saved !== null ? Number(saved) : 40;
  });

  const [sortBy, setSortBy] = useState('proximity');

  const [adults, setAdults] = useState(() => Number(localStorage.getItem('search_adults') || 2));
  const [childrenCount, setChildrenCount] = useState(() => Number(localStorage.getItem('search_children') || 0));
  const [infants, setInfants] = useState(() => Number(localStorage.getItem('search_infants') || 0));
  const [durationDays, setDurationDays] = useState(() => Number(localStorage.getItem('search_days') || 1));

  useEffect(() => {
    localStorage.setItem('gps_range', gpsRange.toString());
  }, [gpsRange]);

  useEffect(() => {
    localStorage.setItem('search_adults', adults.toString());
  }, [adults]);

  useEffect(() => {
    localStorage.setItem('search_children', childrenCount.toString());
  }, [childrenCount]);

  useEffect(() => {
    localStorage.setItem('search_infants', infants.toString());
  }, [infants]);

  useEffect(() => {
    localStorage.setItem('search_days', durationDays.toString());
    
    // Auto-calculate start and end dates
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    const end = new Date();
    end.setDate(today.getDate() + durationDays);
    const endStr = end.toISOString().split('T')[0];
    localStorage.setItem('search_start_date', startStr);
    localStorage.setItem('search_end_date', endStr);
  }, [durationDays]);

  // Radar scanning
  const [isSearching, setIsSearching] = useState(false);
  const [searchStepText, setSearchStepText] = useState('');

  const [mapCenter, setMapCenter] = useState([9.5929, 76.4227]);

  const gpsEnabled = localStorage.getItem('gps_enabled') === 'true';
  const userLat = parseFloat(localStorage.getItem('user_lat')) || 9.5930;
  const userLng = parseFloat(localStorage.getItem('user_lng')) || 76.4230;

  const [activeSite, setActiveSite] = useState(TOURIST_SITES[0]);

  // ── Count active filters for badge ──
  const activeFiltersCount = [
    minPrice, maxPrice, quickBudget,
    ...selectedAmenities, ...selectedPropertyTypes, ...selectedActivities,
    ...selectedPaymentOptions, ...selectedRoomOffers, ...selectedNeighborhoods,
    minRating > 0 ? 'rating' : null,
    minReviewScore > 0 ? 'review' : null,
    selectedBedrooms !== 'any' ? 'bedrooms' : null,
    onlyVerifiedHosts ? 'verified' : null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setQuickBudget('');
    setSelectedAmenities([]);
    setMinRating(0);
    setSelectedPropertyTypes([]);
    setSelectedActivities([]);
    setSelectedPaymentOptions([]);
    setSelectedRoomOffers([]);
    setSelectedNeighborhoods([]);
    setFilterState('');
    setFilterDistrict('');
    setFilterCity('');
    setSelectedBedrooms('any');
    setOnlyVerifiedHosts(false);
    setMinReviewScore(0);
  };

  // ── Trigger refetch when any filter changes ──
  useEffect(() => {
    fetchStays(searchQuery, selectedCategory, gpsRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory, currencyChanged, gpsRange, sortBy,
    minPrice, maxPrice, quickBudget, selectedAmenities, minRating,
    selectedPropertyTypes, selectedActivities, selectedPaymentOptions, selectedRoomOffers,
    selectedNeighborhoods, selectedBedrooms, onlyVerifiedHosts, minReviewScore,
  ]);

  const fetchStays = async (queryVal = searchQuery, catVal = selectedCategory, rangeVal = gpsRange) => {
    setLoading(true);
    setIsSearching(true);
    setError(null);

    const steps = language === 'Tamil' ? [
      'GPS அலகுகளை அணுகுகிறது...', 'அருகிலுள்ள தங்குமிடங்களின் தூரத்தை கணக்கிடுகிறது...',
      'உள்ளூர் தங்குமிடங்களை தேடுகிறது...', 'கட்டண விவரங்களை சரிபார்க்கிறது...',
    ] : [
      'Accessing GPS coordinates...', 'Checking stay availability proximity...',
      'Querying active local inventory...', 'Verifying brokerage-free host pricing...',
    ];

    setSearchStepText(steps[0]);
    setTimeout(() => setSearchStepText(steps[1]), 350);
    setTimeout(() => setSearchStepText(steps[2]), 700);
    setTimeout(() => setSearchStepText(steps[3]), 1050);

    try {
      const isSearchActive = !!queryVal.trim();
      const res = await api.listings.getAll({
        type: 'stay',
        category: isSearchActive ? '' : catVal,
        search: isSearchActive ? queryVal : '',
      });

      let stays = res.listings || [];

      // ── Price filters ──
      if (minPrice) stays = stays.filter(s => s.price >= parseFloat(minPrice));
      if (maxPrice) stays = stays.filter(s => s.price <= parseFloat(maxPrice));
      if (quickBudget) {
        const ranges = { under2k: [0, 2000], '2k5k': [2000, 5000], '5k10k': [5000, 10000], above10k: [10000, Infinity] };
        const [bMin, bMax] = ranges[quickBudget] || [0, Infinity];
        stays = stays.filter(s => s.price >= bMin && s.price <= bMax);
      }

      // ── Amenities ──
      if (selectedAmenities.length > 0) {
        stays = stays.filter(s =>
          selectedAmenities.every(a => s.amenities?.map(x => x.toLowerCase()).includes(a.toLowerCase()))
        );
      }

      // ── Star rating ──
      if (minRating > 0) stays = stays.filter(s => (s.starRating || 4.5) >= minRating);

      // ── Guest review score (10-scale mapped to 5-star) ──
      if (minReviewScore > 0) {
        const minStars = minReviewScore / 2;
        stays = stays.filter(s => (s.starRating || 4.5) >= minStars);
      }

      // ── Property type ──
      if (selectedPropertyTypes.length > 0) {
        stays = stays.filter(s => selectedPropertyTypes.includes(s.category));
      }

      // ── Neighborhood ──
      if (selectedNeighborhoods.length > 0) {
        stays = stays.filter(s =>
          selectedNeighborhoods.some(n =>
            (s.location?.address || '').toLowerCase().includes(n.toLowerCase()) ||
            (s.title || '').toLowerCase().includes(n.toLowerCase())
          )
        );
      }

      // ── Special activities (match against USPs) ──
      if (selectedActivities.length > 0) {
        stays = stays.filter(s => {
          if (!s.usps || s.usps.length === 0) return false;
          return selectedActivities.some(actId => {
            const actOpt = ACTIVITY_OPTIONS.find(a => a.id === actId);
            if (!actOpt) return false;
            return s.usps.some(usp =>
              actOpt.kw.some(kw =>
                (usp.title || '').toLowerCase().includes(kw) ||
                (usp.description || '').toLowerCase().includes(kw)
              )
            );
          });
        });
      }

      // ── Verified host ──
      if (onlyVerifiedHosts) {
        stays = stays.filter(s => s.owner?.isLicensed === true);
      }

      // ── Room offers (price-tier simulation) ──
      if (selectedRoomOffers.length > 0) {
        stays = stays.filter(s => {
          const p = s.price;
          return selectedRoomOffers.some(r => {
            if (r === 'standard') return p < 3000;
            if (r === 'deluxe') return p >= 3000 && p < 6000;
            if (r === 'premium') return p >= 6000 && p < 10000;
            if (r === 'suite') return p >= 10000;
            return true;
          });
        });
      }

      // ── Bedrooms (category/price simulation) ──
      if (selectedBedrooms !== 'any') {
        stays = stays.filter(s => {
          const p = s.price;
          if (selectedBedrooms === '1') return p < 4000 || s.category === 'hotel';
          if (selectedBedrooms === '2') return p >= 4000 && p < 8000;
          if (selectedBedrooms === '3') return p >= 8000 || s.category === 'cottage';
          return true;
        });
      }

      // ── Distance calculation ──
      stays = stays.map(s => {
        let distance = null;
        if (s.location && typeof s.location.lat === 'number' && typeof s.location.lng === 'number') {
          distance = calculateDistance(userLat, userLng, s.location.lat, s.location.lng);
        }
        return { ...s, distance };
      });

      if (!isSearchActive && gpsEnabled) {
        stays = stays.filter(s => s.distance !== null && s.distance <= rangeVal);
      }

      if (sortBy === 'proximity') {
        stays.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      } else if (sortBy === 'priceAsc') {
        stays.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'priceDesc') {
        stays.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sortBy === 'rating') {
        stays.sort((a, b) => (b.starRating || 0) - (a.starRating || 0));
      }

      const refLat = stays[0]?.location?.lat || userLat;
      const refLng = stays[0]?.location?.lng || userLng;
      let closestSite = TOURIST_SITES[0];
      let minDist = Infinity;
      TOURIST_SITES.forEach(site => {
        const d = calculateDistance(refLat, refLng, site.lat, site.lng);
        if (d < minDist) { minDist = d; closestSite = site; }
      });

      setTimeout(() => {
        setListings(stays);
        setActiveSite(closestSite);
        if (stays.length > 0 && stays[0].location) {
          setMapCenter([stays[0].location.lat, stays[0].location.lng]);
        }
        setIsSearching(false);
        setLoading(false);
      }, 1300);
    } catch (err) {
      setError(err.message || 'Failed to load accommodations');
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStays(searchQuery, selectedCategory, gpsRange);
  };

  // Extract USP experiences from listings
  const dynamicExperiences = [];
  listings.forEach(listing => {
    if (listing.usps && Array.isArray(listing.usps)) {
      listing.usps.forEach(usp => {
        if (!dynamicExperiences.some(e => e.title === usp.title && e.propertyId === listing._id)) {
          dynamicExperiences.push({
            ...usp,
            propertyId: listing._id,
            propertyName: listing.title,
            hostName: listing.owner?.name || 'Local Host',
            image: (
              usp.title.toLowerCase().includes('trek') || usp.title.toLowerCase().includes('hike') || usp.title.toLowerCase().includes('walk')
                ? 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=500&q=80'
                : usp.title.toLowerCase().includes('cruise') || usp.title.toLowerCase().includes('boat') || usp.title.toLowerCase().includes('shikara') || usp.title.toLowerCase().includes('lake') || usp.title.toLowerCase().includes('water')
                ? 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=500&q=80'
                : usp.title.toLowerCase().includes('spa') || usp.title.toLowerCase().includes('massage') || usp.title.toLowerCase().includes('wellness') || usp.title.toLowerCase().includes('yoga')
                ? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=500&q=80'
                : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=500&q=80'
            ),
          });
        }
      });
    }
  });
  const displayExperiences = dynamicExperiences.slice(0, 6);

  // ── Toggle helpers ──
  const toggleItem = (setter, id) =>
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ─── Filter Drawer ─────────────────────────────────────────────────────────
  const FilterDrawer = () => (
    <>
      {/* Backdrop */}
      <div className="filter-drawer-backdrop" onClick={() => setShowFilters(false)} />

      {/* Panel */}
      <div className="filter-drawer-panel">
        {/* Header */}
        <div className="filter-drawer-header">
          <div>
            <h4 className="filter-drawer-title">All Filters</h4>
            {activeFiltersCount > 0 && (
              <span className="filter-active-count">{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeFiltersCount > 0 && (
              <button onClick={clearAllFilters} className="filter-clear-btn">Clear All</button>
            )}
            <button onClick={() => setShowFilters(false)} className="filter-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="filter-drawer-body">

          {/* ── Guest Review Score ── */}
          <div className="filter-section">
            <span className="filter-section-label">⭐ Guest Review Score</span>
            <div className="filter-pill-row">
              {[
                { val: 0, label: 'Any' },
                { val: 6, label: '6+ Good' },
                { val: 7, label: '7+ Very Good' },
                { val: 8, label: '8+ Excellent' },
                { val: 9, label: '9+ Wonderful' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setMinReviewScore(opt.val)}
                  className={`filter-pill ${minReviewScore === opt.val ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Star Rating ── */}
          <div className="filter-section">
            <span className="filter-section-label">🌟 Star Rating</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setMinRating(0)} className={`filter-pill ${minRating === 0 ? 'active' : ''}`}>Any</button>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setMinRating(s === minRating ? 0 : s)}
                  className={`filter-star-btn ${minRating > 0 && minRating <= s ? 'active' : minRating === s ? 'active' : ''}`}
                  style={{ color: minRating > 0 && minRating <= s ? '#D97706' : '' }}
                >
                  {'★'.repeat(s)}{s < 5 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* ── Budget ── */}
          <div className="filter-section">
            <span className="filter-section-label">💰 Budget (per night)</span>
            <div className="filter-pill-row" style={{ marginBottom: '12px' }}>
              {[
                { id: 'under2k', label: 'Under ₹2K' },
                { id: '2k5k', label: '₹2K – ₹5K' },
                { id: '5k10k', label: '₹5K – ₹10K' },
                { id: 'above10k', label: '₹10K+' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setQuickBudget(prev => prev === opt.id ? '' : opt.id); setMinPrice(''); setMaxPrice(''); }}
                  className={`filter-pill ${quickBudget === opt.id ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="filter-range-row">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setQuickBudget(''); }}
                className="filter-range-input"
              />
              <span className="filter-range-sep">—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setQuickBudget(''); }}
                className="filter-range-input"
              />
            </div>
          </div>

          {/* ── Property Type ── */}
          <div className="filter-section">
            <span className="filter-section-label">🏘️ Property Type</span>
            <div className="filter-pill-row">
              {PROPERTY_TYPES.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => toggleItem(setSelectedPropertyTypes, pt.id)}
                  className={`filter-pill ${selectedPropertyTypes.includes(pt.id) ? 'active' : ''}`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Neighborhoods ── */}
          <div className="filter-section">
            <span className="filter-section-label">📍 Neighborhood / Location Helper</span>
            
            <div className="location-selectors-grid">
              {/* State Selector */}
              <div className="location-select-wrapper">
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>STATE</label>
                <select 
                  value={filterState} 
                  onChange={e => {
                    const val = e.target.value;
                    setFilterState(val);
                    setFilterDistrict('');
                    setFilterCity('');
                    if (val) {
                      if (!selectedNeighborhoods.includes(val)) {
                        setSelectedNeighborhoods(prev => [...prev, val]);
                      }
                    }
                  }}
                  className="location-select"
                >
                  <option value="">Select State</option>
                  {Object.keys(LOCATION_DATA).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* District Selector */}
              <div className="location-select-wrapper">
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>DISTRICT</label>
                <select 
                  value={filterDistrict} 
                  onChange={e => {
                    const val = e.target.value;
                    setFilterDistrict(val);
                    setFilterCity('');
                    if (val) {
                      if (!selectedNeighborhoods.includes(val)) {
                        setSelectedNeighborhoods(prev => [...prev, val]);
                      }
                    }
                  }}
                  disabled={!filterState}
                  className="location-select"
                >
                  <option value="">Select District</option>
                  {filterState && Object.keys(LOCATION_DATA[filterState]).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* City/Area Selector */}
              <div className="location-select-wrapper">
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>CITY / AREA</label>
                <select 
                  value={filterCity} 
                  onChange={e => {
                    const val = e.target.value;
                    setFilterCity(val);
                    if (val) {
                      if (!selectedNeighborhoods.includes(val)) {
                        setSelectedNeighborhoods(prev => [...prev, val]);
                      }
                    }
                  }}
                  disabled={!filterDistrict}
                  className="location-select"
                >
                  <option value="">Select City</option>
                  {filterState && filterDistrict && LOCATION_DATA[filterState][filterDistrict].map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Selections display */}
            {selectedNeighborhoods.length > 0 && (
              <div className="active-locations-row">
                {selectedNeighborhoods.map(n => (
                  <span key={n} className="location-badge">
                    📍 {n}
                    <button 
                      type="button" 
                      onClick={() => setSelectedNeighborhoods(prev => prev.filter(item => item !== n))}
                      className="location-badge-close"
                      aria-label="Remove location"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Bedrooms ── */}
          <div className="filter-section">
            <span className="filter-section-label">🛏️ Bedrooms / Layout</span>
            <div className="filter-pill-row">
              {[
                { id: 'any', label: 'Any' },
                { id: '1', label: '1 BHK' },
                { id: '2', label: '2 BHK' },
                { id: '3', label: '3+ BHK' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedBedrooms(opt.id)}
                  className={`filter-pill ${selectedBedrooms === opt.id ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Room Offers ── */}
          <div className="filter-section">
            <span className="filter-section-label">🏷️ Room Offers</span>
            <div className="filter-pill-row">
              {ROOM_OFFER_OPTIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleItem(setSelectedRoomOffers, r.id)}
                  className={`filter-pill ${selectedRoomOffers.includes(r.id) ? 'active' : ''}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Facilities ── */}
          <div className="filter-section">
            <span className="filter-section-label">🛁 Facilities &amp; Amenities</span>
            <div className="filter-facilities-grid">
              {FACILITIES_LIST.map(f => (
                <label
                  key={f.id}
                  className={`filter-facility-item ${selectedAmenities.includes(f.id) ? 'active' : ''}`}
                  onClick={() => toggleItem(setSelectedAmenities, f.id)}
                >
                  <span className="facility-check-box">
                    {selectedAmenities.includes(f.id) ? '✓' : ''}
                  </span>
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* ── Special Activities ── */}
          <div className="filter-section">
            <span className="filter-section-label">🎯 Special Experiences</span>
            <div className="filter-pill-row">
              {ACTIVITY_OPTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleItem(setSelectedActivities, a.id)}
                  className={`filter-pill ${selectedActivities.includes(a.id) ? 'active' : ''}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Payment Options ── */}
          <div className="filter-section">
            <span className="filter-section-label">💳 Payment Options</span>
            <div className="filter-pill-row">
              {PAYMENT_OPTIONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleItem(setSelectedPaymentOptions, p.id)}
                  className={`filter-pill ${selectedPaymentOptions.includes(p.id) ? 'active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Verified Host ── */}
          <div className="filter-section" style={{ borderBottom: 'none' }}>
            <div className="filter-verified-row">
              <div>
                <span className="filter-section-label" style={{ marginBottom: '2px' }}>🛡️ Verified Host (HST Licensed)</span>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Show only government-verified &amp; licensed host properties</p>
              </div>
              <label className="filter-toggle-switch">
                <input
                  type="checkbox"
                  checked={onlyVerifiedHosts}
                  onChange={e => setOnlyVerifiedHosts(e.target.checked)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="filter-drawer-footer">
          <button
            onClick={() => {
              fetchStays(searchQuery, selectedCategory, gpsRange);
              setShowFilters(false);
            }}
            className="filter-apply-btn"
          >
            {activeFiltersCount > 0
              ? `Apply ${activeFiltersCount} Filter${activeFiltersCount !== 1 ? 's' : ''}`
              : 'Apply Filters'}
          </button>
        </div>
      </div>
    </>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="home-page container">
      {/* Filter Drawer */}
      {showFilters && <FilterDrawer />}

      {/* 1. Header Hero Panel */}
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">{translate('home_eyebrow', language)}</span>
          <h1>{translate('home_title', language)}</h1>
          <p>{translate('home_desc', language)}</p>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hero-search-bar"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ flex: 1, margin: 0 }}>
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder={translate('search_placeholder', language)}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); fetchStays(e.target.value, selectedCategory, gpsRange); }}
                />
              </div>

              {/* Filter button with badge */}
              <button
                type="button"
                onClick={() => setShowFilters(prev => !prev)}
                className="filter-trigger-btn"
                style={{ background: (showFilters || activeFiltersCount > 0) ? 'var(--primary-color)' : '#0F172A' }}
                title="Open Filters"
              >
                <SlidersHorizontal size={18} />
                {activeFiltersCount > 0 && (
                  <span className="filter-badge-count">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            {/* Neighborhood Location Picker Helper */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '10px' }}>
              <div>
                <select
                  value={filterState}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterState(val);
                    setFilterDistrict('');
                    setFilterCity('');
                    if (val) {
                      setSelectedNeighborhoods([val]);
                      setSearchQuery(val);
                      fetchStays(val, selectedCategory, gpsRange);
                    } else {
                      setSelectedNeighborhoods([]);
                      setSearchQuery('');
                      fetchStays('', selectedCategory, gpsRange);
                    }
                  }}
                  className="location-select"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1.5px solid #E2E8F0', outline: 'none', background: '#F8FAFC', color: '#1E293B', fontFamily: 'inherit' }}
                >
                  <option value="">State (Any)</option>
                  {Object.keys(LOCATION_DATA).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterDistrict}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterDistrict(val);
                    setFilterCity('');
                    if (val) {
                      setSelectedNeighborhoods([val]);
                      setSearchQuery(val);
                      fetchStays(val, selectedCategory, gpsRange);
                    } else {
                      setSelectedNeighborhoods(filterState ? [filterState] : []);
                      setSearchQuery(filterState || '');
                      fetchStays(filterState || '', selectedCategory, gpsRange);
                    }
                  }}
                  disabled={!filterState}
                  className="location-select"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1.5px solid #E2E8F0', outline: 'none', background: '#F8FAFC', color: '#1E293B', opacity: !filterState ? 0.6 : 1, cursor: !filterState ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  <option value="">District (Any)</option>
                  {filterState && Object.keys(LOCATION_DATA[filterState] || {}).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterCity}
                  onChange={e => {
                    const val = e.target.value;
                    setFilterCity(val);
                    if (val) {
                      setSelectedNeighborhoods([val]);
                      setSearchQuery(val);
                      fetchStays(val, selectedCategory, gpsRange);
                    } else {
                      setSelectedNeighborhoods(filterDistrict ? [filterDistrict] : (filterState ? [filterState] : []));
                      setSearchQuery(filterDistrict || filterState || '');
                      fetchStays(filterDistrict || filterState || '', selectedCategory, gpsRange);
                    }
                  }}
                  disabled={!filterDistrict}
                  className="location-select"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1.5px solid #E2E8F0', outline: 'none', background: '#F8FAFC', color: '#1E293B', opacity: !filterDistrict ? 0.6 : 1, cursor: !filterDistrict ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  <option value="">City / Area</option>
                  {filterState && filterDistrict && (LOCATION_DATA[filterState]?.[filterDistrict] || []).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guest Selector & Duration Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'left' }}>Adults</label>
                <select
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', border: 'none', outline: 'none', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'left' }}>Children</label>
                <select
                  value={childrenCount}
                  onChange={e => setChildrenCount(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', border: 'none', outline: 'none', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'left' }}>Infants</label>
                <select
                  value={infants}
                  onChange={e => setInfants(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', border: 'none', outline: 'none', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}
                >
                  {[0, 1, 2, 3].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'left' }}>Duration</label>
                <select
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', border: 'none', outline: 'none', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30].map(d => (
                    <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="hero-visual">
          <div className="visual-card">
            <img
              key={activeSite.image}
              src={activeSite.image}
              alt={activeSite.name}
              style={{ animation: 'fadeInVisual 1s ease' }}
            />
            <div className="visual-tag">{activeSite.name}</div>
          </div>
          <style>{`
            @keyframes fadeInVisual {
              from { opacity: 0.3; transform: scale(1.04); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      </section>

      {/* 2. GPS Proximity Strip */}
      {gpsEnabled && (
        <div className="gps-alert-strip card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #86EFAC', borderRadius: '12px', padding: '16px 20px', gap: '16px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#22C55E', color: 'white', flexShrink: 0 }}>
              <Navigation size={14} style={{ transform: 'rotate(45deg)', animation: 'pulseGpsArrow 1.5s infinite' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#0F5132' }}>GPS Proximity Active (Within {gpsRange}km)</span>
              <span style={{ fontSize: '11px', color: '#14532D' }}>
                Showing nearby stays sorted closest to you: <strong>{userLat.toFixed(4)}° N, {userLng.toFixed(4)}° E</strong>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0F5132' }}>Proximity:</span>
            <input
              type="range" min="0" max="250" value={gpsRange}
              onChange={e => setGpsRange(Number(e.target.value))}
              style={{ accentColor: '#22C55E', cursor: 'pointer', width: '150px', margin: 0 }}
            />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'white', background: '#22C55E', padding: '2px 8px', borderRadius: '20px', minWidth: '55px', textAlign: 'center' }}>
              {gpsRange} km
            </span>
          </div>
          <style>{`
            @keyframes pulseGpsArrow {
              0% { transform: rotate(45deg) scale(1); }
              50% { transform: rotate(45deg) scale(1.2); }
              100% { transform: rotate(45deg) scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* 3. Category Chips */}
      <section className="category-selection-section">
        <h3>{translate('find_perfect', language)}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
          <div className="category-chips flex" style={{ margin: 0 }}>
            <button className={`chip ${selectedCategory === 'cottage' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('cottage'); }}>
              {translate('cottages', language)}
            </button>
            <button className={`chip ${selectedCategory === 'hotel' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('hotel'); }}>
              {translate('hotels', language)}
            </button>
            <button className={`chip ${selectedCategory === 'apartment' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('apartment'); }}>
              {translate('apartments', language)}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-medium)' }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}
            >
              <option value="proximity">Proximity (Nearest)</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. Listings + Map */}
      <div className="listings-map-layout">
        <div className="listings-list-side">
          <div className="list-header flex-between">
            <h4>
              {translate('recommended', language)} ({listings.length})
              {activeFiltersCount > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', background: '#0A3B2A', color: 'white', padding: '2px 10px', borderRadius: '20px', fontWeight: '700' }}>
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                </span>
              )}
            </h4>
            <Link to="/rentals" className="view-all-link">{translate('browse_rentals', language)}</Link>
          </div>

          {isSearching ? (
            <div className="listings-scroll-grid">
              <SkeletonCard type="stay" />
              <SkeletonCard type="stay" />
              <SkeletonCard type="stay" />
              <SkeletonCard type="stay" />
            </div>
          ) : error ? (
            <div className="error-card">
              <ShieldAlert size={28} />
              <span>{error}</span>
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-listings card flex-center" style={{ flexDirection: 'column', gap: '12px', padding: '40px' }}>
              <span>{translate('empty_stays', language)}</span>
              {activeFiltersCount > 0 && (
                <button onClick={clearAllFilters} style={{ background: '#0A3B2A', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="listings-scroll-grid">
              {listings.map(listing => (
                <div key={listing._id} className="stay-horizontal-card card">
                  <div className="card-image-panel">
                    <img
                      src={listing.images[0] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title}
                    />
                    <div className="price-tag-pill">{formatPrice(listing.price)}<span>{translate('checkout_night_suffix', language)}</span></div>
                  </div>

                  <div className="card-info-panel">
                    <div className="flex-between card-top-row">
                      <span className="stay-category">{listing.category}</span>
                      {listing.distance !== null && listing.distance !== undefined && (
                        <span className="distance-badge-gps">
                          📍 {listing.distance < 1 ? `${Math.round(listing.distance * 1000)}m` : `${listing.distance.toFixed(1)}km`} {translate('away_label', language)}
                        </span>
                      )}
                      <div className="rating-tag">
                        <Star size={14} className="star-icon" />
                        <span>{listing.starRating || 4.5}</span>
                      </div>
                    </div>

                    <h5 style={{ display: 'flex', alignItems: 'center', gap: '4.5px' }}>
                      {listing.title}
                      {listing.owner?.isLicensed && (
                        <span
                          className="verified-badge"
                          title="Verified Host"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22c55e', color: 'white', borderRadius: '50%', width: '15px', height: '15px', fontSize: '9px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}
                        >
                          ✓
                        </span>
                      )}
                    </h5>
                    <p className="card-location">
                      <MapPin size={14} />
                      <span>{listing.location.address}</span>
                    </p>

                    <div className="card-amenities-row flex">
                      {listing.amenities.slice(0, 3).map(a => (
                        <span key={a} className="amenity-pill">{a.replace('_', ' ')}</span>
                      ))}
                    </div>

                    <div className="card-action-row flex-between">
                      <span className="owner-name-tag" style={{ color: '#16A34A', fontWeight: '700' }}>✓ Approved Stay</span>
                      <Link to={`/listing/${listing._id}`} className="btn btn-secondary btn-small">{translate('book_now', language)}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="map-view-side">
          <div className="map-wrapper">
            <LeafletMap listings={listings} center={mapCenter} zoom={11} />
          </div>
        </div>
      </div>

      {/* 5. Experiences */}
      <section className="tour-experiences-section">
        <div className="section-header">
          <Compass size={24} className="heading-icon" />
          <h3>{translate('curated_tours', language)}</h3>
          <p>{translate('curated_desc', language)}</p>
        </div>

        <div className="experiences-grid grid grid-cols-3" style={{ gap: '20px', marginTop: '20px' }}>
          {displayExperiences.map((exp, idx) => (
            <div key={idx} className="experience-card card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="exp-img" style={{ position: 'relative', overflow: 'hidden', height: '160px' }}>
                <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="price-badge" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(10, 59, 42, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                  {formatPrice(exp.price)}/{exp.chargeType === 'per_person' ? translate('person_label', language) : 'group'}
                </div>
              </div>
              <div className="exp-info" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                <div>
                  <h6 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>{exp.title}</h6>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>
                    🏡 Listed by: <Link to={`/listing/${exp.propertyId}`} style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'underline' }}>{exp.propertyName}</Link>
                  </p>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-medium)', lineHeight: '1.4' }}>{exp.description}</p>
                </div>
                <div className="exp-footer flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>{translate('by_host', language)} {exp.hostName}</span>
                  <span className="tag-usp" style={{ fontSize: '11px', fontWeight: '700', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '20px' }}>✨ Curated</span>
                </div>
              </div>
            </div>
          ))}
          {displayExperiences.length === 0 && (
            <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
              No experiences available in this location right now.
            </div>
          )}
        </div>
      </section>

      {/* 6. Flash Deals */}
      <section className="flash-deals-banner card">
        <div className="banner-text">
          <div className="flex-center deal-eyebrow">
            <Flame size={16} />
            <span>{translate('flash_deals', language)}</span>
          </div>
          <h3>{translate('claim_off', language)}</h3>
          <p>{translate('claim_desc', language)}</p>
          <div className="deal-timer flex">
            <div className="timer-box">02<span>{translate('hrs', language)}</span></div>
            <div className="timer-box">46<span>{translate('mins', language)}</span></div>
            <div className="timer-box">35<span>{translate('secs', language)}</span></div>
          </div>
        </div>
        <div className="banner-visual">
          <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80" alt="Nature stay" />
        </div>
      </section>
    </div>
  );
};

export default Home;
