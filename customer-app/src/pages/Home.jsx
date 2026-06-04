import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, MapPin, Star, Flame, Compass, ShieldAlert, Navigation, SlidersHorizontal, X, RefreshCw, Mountain, Umbrella, Building, Home as HomeIcon, Map, List } from 'lucide-react';
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
  const [showMapView, setShowMapView] = useState(false);
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
  const [selectedLandscapeCategory, setSelectedLandscapeCategory] = useState('');
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
  const [quickBudget, setQuickBudget] = useState('');

  // Draft States for filter panel (to prevent instant reloading/flickering)
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftQuickBudget, setDraftQuickBudget] = useState('');
  const [draftSelectedAmenities, setDraftSelectedAmenities] = useState([]);
  const [draftMinRating, setDraftMinRating] = useState(0);
  const [draftSelectedPropertyTypes, setDraftSelectedPropertyTypes] = useState([]);
  const [draftSelectedActivities, setDraftSelectedActivities] = useState([]);
  const [draftSelectedPaymentOptions, setDraftSelectedPaymentOptions] = useState([]);
  const [draftSelectedRoomOffers, setDraftSelectedRoomOffers] = useState([]);
  const [draftSelectedNeighborhoods, setDraftSelectedNeighborhoods] = useState([]);
  const [draftSelectedBedrooms, setDraftSelectedBedrooms] = useState('any');
  const [draftOnlyVerifiedHosts, setDraftOnlyVerifiedHosts] = useState(false);
  const [draftFilterState, setDraftFilterState] = useState('');
  const [draftFilterDistrict, setDraftFilterDistrict] = useState('');
  const [draftFilterCity, setDraftFilterCity] = useState('');

  // Highlight banner removed as per user request

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

  // ── Search Autocomplete ──
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const generateSuggestions = (query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];
    for (const [state, districts] of Object.entries(LOCATION_DATA)) {
      if (state.toLowerCase().includes(q) && results.length < 6) {
        results.push({ label: state, sublabel: 'State', icon: '📍', query: state });
      }
      for (const [district, areas] of Object.entries(districts)) {
        if (district.toLowerCase().includes(q) && results.length < 6) {
          results.push({ label: district, sublabel: state, icon: '🏙️', query: district });
        }
        for (const area of areas) {
          if (area.toLowerCase().includes(q) && results.length < 6) {
            results.push({ label: area, sublabel: `${district}, ${state}`, icon: '📌', query: area });
          }
        }
      }
    }
    return results.slice(0, 6);
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) {
      const s = generateSuggestions(val);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (!val.trim()) {
      fetchStays('', selectedCategory, gpsRange);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.query);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchStays(suggestion.query, selectedCategory, gpsRange);
  };

  const [activeSite, setActiveSite] = useState(TOURIST_SITES[0]);

  // ── Count active filters for badge ──
  const activeFiltersCount = [
    minPrice, maxPrice, quickBudget,
    ...selectedAmenities, ...selectedPropertyTypes, ...selectedActivities,
    ...selectedPaymentOptions, ...selectedRoomOffers, ...selectedNeighborhoods,
    minRating > 0 ? 'rating' : null,
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
  };

  // Sync active filters to draft filters when drawer opens
  useEffect(() => {
    if (showFilters) {
      setDraftMinPrice(minPrice);
      setDraftMaxPrice(maxPrice);
      setDraftQuickBudget(quickBudget);
      setDraftSelectedAmenities([...selectedAmenities]);
      setDraftMinRating(minRating);
      setDraftSelectedPropertyTypes([...selectedPropertyTypes]);
      setDraftSelectedActivities([...selectedActivities]);
      setDraftSelectedPaymentOptions([...selectedPaymentOptions]);
      setDraftSelectedRoomOffers([...selectedRoomOffers]);
      setDraftSelectedNeighborhoods([...selectedNeighborhoods]);
      setDraftSelectedBedrooms(selectedBedrooms);
      setDraftOnlyVerifiedHosts(onlyVerifiedHosts);
      setDraftFilterState(filterState);
      setDraftFilterDistrict(filterDistrict);
      setDraftFilterCity(filterCity);
    }
  }, [showFilters]);

  const applyDraftFilters = () => {
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setQuickBudget(draftQuickBudget);
    setSelectedAmenities(draftSelectedAmenities);
    setMinRating(draftMinRating);
    setSelectedPropertyTypes(draftSelectedPropertyTypes);
    setSelectedActivities(draftSelectedActivities);
    setSelectedPaymentOptions(draftSelectedPaymentOptions);
    setSelectedRoomOffers(draftSelectedRoomOffers);
    setSelectedNeighborhoods(draftSelectedNeighborhoods);
    setSelectedBedrooms(draftSelectedBedrooms);
    setOnlyVerifiedHosts(draftOnlyVerifiedHosts);
    setFilterState(draftFilterState);
    setFilterDistrict(draftFilterDistrict);
    setFilterCity(draftFilterCity);
    setShowFilters(false);
  };

  const clearAllDraftFilters = () => {
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftQuickBudget('');
    setDraftSelectedAmenities([]);
    setDraftMinRating(0);
    setDraftSelectedPropertyTypes([]);
    setDraftSelectedActivities([]);
    setDraftSelectedPaymentOptions([]);
    setDraftSelectedRoomOffers([]);
    setDraftSelectedNeighborhoods([]);
    setDraftFilterState('');
    setDraftFilterDistrict('');
    setDraftFilterCity('');
    setDraftSelectedBedrooms('any');
    setDraftOnlyVerifiedHosts(false);
  };

  // ── Trigger refetch when any filter changes ──
  useEffect(() => {
    fetchStays(searchQuery, selectedCategory, gpsRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory, currencyChanged, gpsRange, sortBy,
    minPrice, maxPrice, quickBudget, selectedAmenities, minRating,
    selectedPropertyTypes, selectedActivities, selectedPaymentOptions, selectedRoomOffers,
    selectedNeighborhoods, selectedBedrooms, onlyVerifiedHosts,
  ]);

  const fetchStays = async (queryVal = searchQuery, catVal = selectedCategory, rangeVal = gpsRange, landscapeVal = selectedLandscapeCategory) => {
    setLoading(true);
    setIsSearching(true);
    setError(null);

    try {
      const isSearchActive = !!queryVal.trim();
      const res = await api.listings.getAll({
        type: 'stay',
        category: isSearchActive ? '' : catVal,
        landscapeCategory: isSearchActive ? '' : landscapeVal,
        search: isSearchActive ? queryVal : '',
        lat: gpsEnabled ? userLat : undefined,
        lng: gpsEnabled ? userLng : undefined,
        radius: gpsEnabled ? rangeVal : undefined
      });

      let stays = res.listings || [];

      // ── Temporarily hide PG / guesthouse rooms from customer app ──
      stays = stays.filter(s => s.category !== 'pg');

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
      if (minRating > 0) stays = stays.filter(s => (s.starRating || 3) >= minRating);

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

      setListings(stays);
      setActiveSite(closestSite);
      if (stays.length > 0 && stays[0].location) {
        setMapCenter([stays[0].location.lat, stays[0].location.lng]);
      }
      setIsSearching(false);
      setLoading(false);
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

  const draftFiltersCount = [
    draftMinPrice, draftMaxPrice, draftQuickBudget,
    ...draftSelectedAmenities, ...draftSelectedPropertyTypes, ...draftSelectedActivities,
    ...draftSelectedPaymentOptions, ...draftSelectedRoomOffers, ...draftSelectedNeighborhoods,
    draftMinRating > 0 ? 'rating' : null,
    draftSelectedBedrooms !== 'any' ? 'bedrooms' : null,
    draftOnlyVerifiedHosts ? 'verified' : null,
  ].filter(Boolean).length;

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="home-page container">
      {/* Filter Drawer */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div className="filter-drawer-backdrop" onClick={() => setShowFilters(false)} />

          {/* Panel */}
          <div className="filter-drawer-panel">
            {/* Header */}
            <div className="filter-drawer-header">
              <div>
                <h4 className="filter-drawer-title">All Filters</h4>
                {draftFiltersCount > 0 && (
                  <span className="filter-active-count">{draftFiltersCount} filter{draftFiltersCount !== 1 ? 's' : ''} active</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {draftFiltersCount > 0 && (
                  <button onClick={clearAllDraftFilters} className="filter-clear-btn">Clear All</button>
                )}
                <button onClick={() => setShowFilters(false)} className="filter-close-btn">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="filter-drawer-body">

              {/* ── Star Rating ── */}
              <div className="filter-section">
                <span className="filter-section-label">🌟 Star Rating</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => setDraftMinRating(0)} className={`filter-pill ${draftMinRating === 0 ? 'active' : ''}`}>Any</button>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setDraftMinRating(s === draftMinRating ? 0 : s)}
                      className={`filter-star-btn ${draftMinRating === s ? 'active' : ''}`}
                      style={{ color: draftMinRating === s ? '#D97706' : '' }}
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
                      onClick={() => { setDraftQuickBudget(prev => prev === opt.id ? '' : opt.id); setDraftMinPrice(''); setDraftMaxPrice(''); }}
                      className={`filter-pill ${draftQuickBudget === opt.id ? 'active' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="filter-range-row">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={draftMinPrice}
                    onChange={e => { setDraftMinPrice(e.target.value); setDraftQuickBudget(''); }}
                    className="filter-range-input"
                  />
                  <span className="filter-range-sep">—</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={draftMaxPrice}
                    onChange={e => { setDraftMaxPrice(e.target.value); setDraftQuickBudget(''); }}
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
                      onClick={() => toggleItem(setDraftSelectedPropertyTypes, pt.id)}
                      className={`filter-pill ${draftSelectedPropertyTypes.includes(pt.id) ? 'active' : ''}`}
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
                      value={draftFilterState} 
                      onChange={e => {
                        const val = e.target.value;
                        setDraftFilterState(val);
                        setDraftFilterDistrict('');
                        setDraftFilterCity('');
                        if (val) {
                          if (!draftSelectedNeighborhoods.includes(val)) {
                            setDraftSelectedNeighborhoods(prev => [...prev, val]);
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
                      value={draftFilterDistrict} 
                      onChange={e => {
                        const val = e.target.value;
                        setDraftFilterDistrict(val);
                        setDraftFilterCity('');
                        if (val) {
                          if (!draftSelectedNeighborhoods.includes(val)) {
                            setDraftSelectedNeighborhoods(prev => [...prev, val]);
                          }
                        }
                      }}
                      disabled={!draftFilterState}
                      className="location-select"
                    >
                      <option value="">Select District</option>
                      {draftFilterState && Object.keys(LOCATION_DATA[draftFilterState]).map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  {/* City/Area Selector */}
                  <div className="location-select-wrapper">
                    <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>CITY / AREA</label>
                    <select 
                      value={draftFilterCity} 
                      onChange={e => {
                        const val = e.target.value;
                        setDraftFilterCity(val);
                        if (val) {
                          if (!draftSelectedNeighborhoods.includes(val)) {
                            setDraftSelectedNeighborhoods(prev => [...prev, val]);
                          }
                        }
                      }}
                      disabled={!draftFilterDistrict}
                      className="location-select"
                    >
                      <option value="">Select City</option>
                      {draftFilterState && draftFilterDistrict && LOCATION_DATA[draftFilterState][draftFilterDistrict].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Selections display */}
                {draftSelectedNeighborhoods.length > 0 && (
                  <div className="active-locations-row">
                    {draftSelectedNeighborhoods.map(n => (
                      <span key={n} className="location-badge">
                        📍 {n}
                        <button 
                          type="button" 
                          onClick={() => setDraftSelectedNeighborhoods(prev => prev.filter(item => item !== n))}
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
                      onClick={() => setDraftSelectedBedrooms(opt.id)}
                      className={`filter-pill ${draftSelectedBedrooms === opt.id ? 'active' : ''}`}
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
                      onClick={() => toggleItem(setDraftSelectedRoomOffers, r.id)}
                      className={`filter-pill ${draftSelectedRoomOffers.includes(r.id) ? 'active' : ''}`}
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
                      className={`filter-facility-item ${draftSelectedAmenities.includes(f.id) ? 'active' : ''}`}
                      onClick={() => toggleItem(setDraftSelectedAmenities, f.id)}
                    >
                      <span className="facility-check-box">
                        {draftSelectedAmenities.includes(f.id) ? '✓' : ''}
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
                      onClick={() => toggleItem(setDraftSelectedActivities, a.id)}
                      className={`filter-pill ${draftSelectedActivities.includes(a.id) ? 'active' : ''}`}
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
                      onClick={() => toggleItem(setDraftSelectedPaymentOptions, p.id)}
                      className={`filter-pill ${draftSelectedPaymentOptions.includes(p.id) ? 'active' : ''}`}
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
                      checked={draftOnlyVerifiedHosts}
                      onChange={e => setDraftOnlyVerifiedHosts(e.target.checked)}
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
                onClick={applyDraftFilters}
                className="filter-apply-btn"
              >
                {draftFiltersCount > 0
                  ? `Apply ${draftFiltersCount} Filter${draftFiltersCount !== 1 ? 's' : ''}`
                  : 'Apply Filters'}
              </button>
            </div>
          </div>
        </>
      )}

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
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              background: '#FFFFFF', 
              padding: '24px', 
              borderRadius: '24px', 
              border: '1.5px solid var(--border-color)', 
              boxShadow: 'var(--shadow-lg)', 
              maxWidth: '640px' 
            }}
          >
            <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
              <div className="search-input-wrapper" ref={searchWrapperRef} style={{ flex: 1, margin: 0, border: '1.5px solid var(--border-color)', borderRadius: '12px', background: '#F8FAFC', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <Search size={20} className="search-icon" style={{ color: 'var(--primary-color)' }} />
                <input
                  type="text"
                  placeholder={translate('search_placeholder', language)}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); fetchStays(searchQuery, selectedCategory, gpsRange); } }}
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); fetchStays('', selectedCategory, gpsRange); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)', display: 'flex', alignItems: 'center', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="suggestion-item"
                        onMouseDown={() => handleSuggestionClick(s)}
                      >
                        <span className="suggestion-icon">{s.icon}</span>
                        <div className="suggestion-text">
                          <span className="suggestion-label">{s.label}</span>
                          <span className="suggestion-sublabel">{s.sublabel}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter button with badge */}
              <button
                type="button"
                onClick={() => setShowFilters(prev => !prev)}
                className="filter-trigger-btn"
                style={{ 
                  background: (showFilters || activeFiltersCount > 0) ? 'var(--primary-color)' : '#F8FAFC', 
                  color: (showFilters || activeFiltersCount > 0) ? '#FFFFFF' : 'var(--primary-color)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '12px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                title="Open Filters"
              >
                <SlidersHorizontal size={18} style={{ margin: 'auto' }} />
                {activeFiltersCount > 0 && (
                  <span className="filter-badge-count" style={{ background: 'var(--accent-color)', color: 'var(--primary-color)' }}>{activeFiltersCount}</span>
                )}
              </button>

              {/* Refresh/Scan Button */}
              <button
                type="button"
                onClick={() => fetchStays(searchQuery, selectedCategory, gpsRange)}
                className="filter-trigger-btn"
                style={{ 
                  background: '#F8FAFC', 
                  color: 'var(--primary-color)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '12px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                title="Search nearby stays"
              >
                <RefreshCw 
                  size={18} 
                  style={{ 
                    margin: 'auto',
                    animation: loading ? 'spin 1.5s linear infinite' : 'none' 
                  }} 
                />
              </button>
            </div>

            {/* Neighborhood Location Picker Helper */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>State</label>
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
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="">State (Any)</option>
                  {Object.keys(LOCATION_DATA).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>District</label>
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
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', opacity: !filterState ? 0.6 : 1, cursor: !filterState ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  <option value="">District (Any)</option>
                  {filterState && Object.keys(LOCATION_DATA[filterState] || {}).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>City / Area</label>
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
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', opacity: !filterDistrict ? 0.6 : 1, cursor: !filterDistrict ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  <option value="">City / Area</option>
                  {filterState && filterDistrict && (LOCATION_DATA[filterState]?.[filterDistrict] || []).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guest Selector & Duration Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', textAlign: 'left' }}>Adults</label>
                <select
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', cursor: 'pointer' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', textAlign: 'left' }}>Children</label>
                <select
                  value={childrenCount}
                  onChange={e => setChildrenCount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', cursor: 'pointer' }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', textAlign: 'left' }}>Infants</label>
                <select
                  value={infants}
                  onChange={e => setInfants(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', cursor: 'pointer' }}
                >
                  {[0, 1, 2, 3].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', textAlign: 'left' }}>Duration</label>
                <select
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '12px', border: '1.5px solid var(--border-color)', outline: 'none', background: '#F8FAFC', color: 'var(--text-dark)', cursor: 'pointer' }}
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
          <div className="category-chips flex" style={{ margin: 0, gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button className={`chip ${selectedCategory === '' && selectedLandscapeCategory === '' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLandscapeCategory(''); fetchStays('', '', gpsRange, ''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} /> {translate('all_stays', language) || 'All Stays'}
            </button>
            <button className={`chip ${selectedCategory === 'cottage' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('cottage'); setSelectedLandscapeCategory(''); fetchStays('', 'cottage', gpsRange, ''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HomeIcon size={14} /> {translate('cottages', language)}
            </button>
            <button className={`chip ${selectedCategory === 'hotel' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('hotel'); setSelectedLandscapeCategory(''); fetchStays('', 'hotel', gpsRange, ''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={14} /> {translate('hotels', language)}
            </button>
            <button className={`chip ${selectedCategory === 'apartment' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory('apartment'); setSelectedLandscapeCategory(''); fetchStays('', 'apartment', gpsRange, ''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={14} /> {translate('apartments', language)}
            </button>
            <button className={`chip ${selectedLandscapeCategory === 'hillstation' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLandscapeCategory('hillstation'); fetchStays('', '', gpsRange, 'hillstation'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mountain size={14} /> Hillstations
            </button>
            <button className={`chip ${selectedLandscapeCategory === 'beach' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLandscapeCategory('beach'); fetchStays('', '', gpsRange, 'beach'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Umbrella size={14} /> Beaches
            </button>
            <button className={`chip ${selectedLandscapeCategory === 'city' ? 'active' : ''}`} onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLandscapeCategory('city'); fetchStays('', '', gpsRange, 'city'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Map size={14} /> City Centers
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
          ) : showMapView ? (
            <div style={{ height: '75vh', width: '100%', borderRadius: '16px', overflow: 'hidden', marginTop: '20px', zIndex: 1, position: 'relative' }}>
              <LeafletMap 
                listings={listings} 
                center={[userLat, userLng]} 
                zoom={10} 
              />
            </div>
          ) : (
            <div className="listings-scroll-grid">
              {listings.map(listing => (
                <div key={listing._id} className="stay-horizontal-card card">
                  <div className="card-image-panel">
                    <img
                      src={listing.images[0] || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title}
                      referrerPolicy="no-referrer"
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
                        <span>{listing.starRating || 3}</span>
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
            <Link 
              key={idx} 
              to={`/listing/${exp.propertyId}`} 
              className="experience-card card" 
              style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
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
                    🏡 Listed by: <span style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'underline' }}>{exp.propertyName}</span>
                  </p>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-medium)', lineHeight: '1.4' }}>{exp.description}</p>
                </div>
                <div className="exp-footer flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>{translate('by_host', language)} {exp.hostName}</span>
                  <span className="tag-usp" style={{ fontSize: '11px', fontWeight: '700', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '20px' }}>✨ Curated</span>
                </div>
              </div>
            </Link>
          ))}
          {displayExperiences.length === 0 && (
            <div className="empty-owl-container">
              <div className="owl-css">
                <div className="owl-ears">
                  <div className="owl-ear left"></div>
                  <div className="owl-ear right"></div>
                </div>
                <div className="owl-face">
                  <div className="owl-eyes-wrap">
                    <div className="owl-eye-css">
                      <div className="owl-pupil"></div>
                    </div>
                    <div className="owl-eye-css">
                      <div className="owl-pupil"></div>
                    </div>
                  </div>
                </div>
                <div className="owl-beak-css"></div>
                <div className="owl-chest-css">
                  <div className="owl-feather"></div>
                  <div className="owl-feather"></div>
                </div>
                <div className="owl-wings-wrap">
                  <div className="owl-wing-css left"></div>
                  <div className="owl-wing-css right"></div>
                </div>
                <div className="owl-feet-css">
                  <div className="owl-foot-css left"></div>
                  <div className="owl-foot-css right"></div>
                </div>
              </div>
              <h5 style={{ fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px', fontSize: '16px' }}>No experiences available</h5>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)', fontWeight: '600' }}>
                No curated stay experiences have been listed by hosts in this area yet.
              </p>
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
      {/* Floating Map Toggle Button */}
      {!isSearching && !error && listings.length > 0 && (
        <button 
          onClick={() => setShowMapView(!showMapView)}
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#222222',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
        >
          {showMapView ? (
            <>
              <List size={18} /> Show list
            </>
          ) : (
            <>
              <Map size={18} /> Show map
            </>
          )}
        </button>
      )}

    </div>
  );
};

export default Home;
