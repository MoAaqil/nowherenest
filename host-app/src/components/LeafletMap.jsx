import React, { useState, useEffect, useRef } from 'react';

// Haversine formula to compute distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // returns distance in km
};

// Turn-by-Turn directions generator based on transit mode
const generateDirections = (distance, destName, mode = 'driving') => {
  const isWalking = mode === 'walking';
  const isBiking = mode === 'bicycling';
  
  const highwayLabel = isWalking ? 'pedestrian pathway' : isBiking ? 'designated cycle lane' : 'District Highway';
  const actionLabel = isWalking ? 'Walk straight' : isBiking ? 'Ride along' : 'Drive onto';

  if (distance <= 1) {
    return [
      { instruction: "Depart from your current coordinates.", dist: "200 m" },
      { instruction: `Proceed straight ahead. The destination [${destName}] will be on your right.`, dist: `${Math.round((distance - 0.2) * 1000)} m` },
      { instruction: "Arrive at Nowhere Nest destination.", dist: "0 m" }
    ];
  }

  const step1Dist = 0.5;
  const step4Dist = 0.7;
  const remaining = distance - step1Dist - step4Dist;
  const step2Dist = remaining > 0 ? remaining * 0.75 : 0.5;
  const step3Dist = remaining > 0 ? remaining * 0.25 : 0.5;

  return [
    { instruction: "Depart from current location toward the nearest access road.", dist: `${step1Dist} km` },
    { instruction: `${actionLabel} the ${highwayLabel} heading toward ${destName}.`, dist: `${step2Dist.toFixed(1)} km` },
    { instruction: "Merge onto local bypass approach lane.", dist: `${step3Dist.toFixed(1)} km` },
    { instruction: "Turn right onto destination approach street.", dist: `${step4Dist} km` },
    { instruction: `Arrive at Nowhere Nest: ${destName}. Welcome!`, dist: "0 m" }
  ];
};

const LeafletMap = ({ listings = [], center = [9.5929, 76.4227], zoom = 11, onSelectCoords }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [activeRoute, setActiveRoute] = useState(null);
  const [mapType, setMapType] = useState('road'); // 'road' or 'satellite'
  const [liveTracking, setLiveTracking] = useState(false);
  const [transitMode, setTransitMode] = useState('driving'); // 'driving', 'bicycling', 'walking'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // Coordinates from localStorage
  const [userLocation, setUserLocation] = useState(() => {
    const lat = parseFloat(localStorage.getItem('user_lat'));
    const lng = parseFloat(localStorage.getItem('user_lng'));
    return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
  });

  // Helper to calculate estimated driving time based on transit mode speed
  const calculateRouteTime = (dist, mode = transitMode) => {
    let speed = 40; // driving (km/h)
    if (mode === 'bicycling') speed = 15;
    if (mode === 'walking') speed = 5.5;

    const totalMinutes = Math.round((dist / speed) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} hr ${mins} mins`;
    }
    return `${mins} mins`;
  };

  const clearRoute = () => {
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    setActiveRoute(null);
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  };

  const drawRouteLine = (userCoords, destCoords) => {
    if (!mapRef.current || !window.L) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    const routeLine = window.L.polyline(
      [userCoords, destCoords],
      {
        color: '#0A3B2A',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 6'
      }
    ).addTo(mapRef.current);

    routePolylineRef.current = routeLine;

    // Fit map bounds to show both points
    const bounds = window.L.latLngBounds([userCoords, destCoords]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // Watch position live tracking
  useEffect(() => {
    if (liveTracking) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            localStorage.setItem('user_lat', latitude.toString());
            localStorage.setItem('user_lng', longitude.toString());
            localStorage.setItem('gps_enabled', 'true');
            setUserLocation({ lat: latitude, lng: longitude });

            // Smoothly pan map to user location
            if (mapRef.current) {
              mapRef.current.panTo([latitude, longitude]);
            }
          },
          (err) => {
            console.error('WatchPosition failed: ', err);
            setLiveTracking(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        alert('Live location tracking not supported on this browser.');
        setLiveTracking(false);
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [liveTracking]);

  // Handle map type tile layers swap
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      const roadUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      const activeUrl = mapType === 'satellite' ? satelliteUrl : roadUrl;
      tileLayerRef.current.setUrl(activeUrl);
    }
  }, [mapType]);

  // Recalculate route instructions if mode changes
  const handleTransitModeChange = (mode) => {
    setTransitMode(mode);
    if (activeRoute && userLocation) {
      const distance = activeRoute.distance;
      const timeToReach = calculateRouteTime(distance, mode);
      const steps = generateDirections(distance, activeRoute.destName, mode);
      setActiveRoute({
        ...activeRoute,
        timeToReach,
        steps
      });
    }
  };

  // Fly map to user location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          localStorage.setItem('user_lat', latitude.toString());
          localStorage.setItem('user_lng', longitude.toString());
          localStorage.setItem('gps_enabled', 'true');
          setUserLocation({ lat: latitude, lng: longitude });
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14);
          }
        },
        (err) => {
          alert('Failed to fetch your location: ' + err.message);
        }
      );
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current && window.L) {
      mapRef.current = window.L.map('leaflet-map-element', { zoomControl: false }).setView(center, zoom);

      // Default to road tile
      const roadUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileLayerRef.current = window.L.tileLayer(roadUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add Zoom control at bottom right instead of default top left
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      if (onSelectCoords) {
        mapRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          onSelectCoords({ lat, lng });
        });
      }
    } else if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }

    return () => {
      // Cleanups
    };
  }, [center, zoom, onSelectCoords]);

  // 2. Render Markers and User Dot
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clear active route line
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    setActiveRoute(null);

    // Remove old property markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Render User Blue Dot
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userDotIcon = window.L.divIcon({
        className: 'user-location-dot-pulse',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            background-color: #3B82F6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 6px;
              height: 6px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      userMarkerRef.current = window.L.marker(
        [userLocation.lat, userLocation.lng],
        { icon: userDotIcon }
      ).addTo(mapRef.current);
    }

    // Custom themed Pin Icon
    const customPinIcon = window.L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background-color: #0A3B2A; 
          width: 32px; 
          height: 32px; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: 2px solid white; 
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            background-color: #A3E635; 
            width: 12px; 
            height: 12px; 
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Filter listings based on map state selections
    const filteredListings = listings.filter(item => {
      // Category filter
      if (selectedCategoryFilter !== 'all') {
        const cat = selectedCategoryFilter === 'resort' ? 'cottage' : selectedCategoryFilter;
        if (item.category !== cat) return false;
      }
      // Text search filter
      if (mapSearchQuery.trim()) {
        const query = mapSearchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const addressMatch = item.location?.address?.toLowerCase().includes(query);
        if (!titleMatch && !addressMatch) return false;
      }
      return true;
    });

    // Add Markers to map
    filteredListings.forEach(listing => {
      if (listing.location?.lat && listing.location?.lng) {
        const marker = window.L.marker(
          [listing.location.lat, listing.location.lng],
          { icon: customPinIcon }
        ).addTo(mapRef.current);

        if (onSelectCoords) {
          markersRef.current.push(marker);
          return;
        }

        const priceLabel = (listing.price !== undefined && listing.price !== null)
          ? (listing.type === 'stay' ? `₹${listing.price.toLocaleString('en-IN')}/night` : `₹${listing.price.toLocaleString('en-IN')}/month`)
          : '₹0';

        const popupHTML = `
          <div style="font-family: var(--font-family, sans-serif); min-width: 160px; padding: 4px;">
            <strong style="color: #0F172A; display: block; margin-bottom: 2px; font-size: 13px;">${listing.title}</strong>
            <span style="color: #64748B; font-size: 11px; display: block; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${listing.location.address}</span>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-weight: 800; color: #0A3B2A; font-size: 13px;">${priceLabel}</span>
              <a href="/listing/${listing._id}" style="
                background-color: #0A3B2A; 
                color: white; 
                padding: 4px 10px; 
                font-size: 11px; 
                border-radius: 6px;
                text-decoration: none;
                font-weight: 700;
              ">View Stay</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupHTML);

        marker.on('click', () => {
          if (userLocation) {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, listing.location.lat, listing.location.lng);
            const timeToReach = calculateRouteTime(distance);
            const steps = generateDirections(distance, listing.title, transitMode);

            setActiveRoute({
              distance,
              timeToReach,
              destName: listing.title,
              steps
            });

            drawRouteLine([userLocation.lat, userLocation.lng], [listing.location.lat, listing.location.lng]);
          }
        });

        markersRef.current.push(marker);
      }
    });

  }, [listings, userLocation, selectedCategoryFilter, mapSearchQuery]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="leaflet-map-element" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}></div>

      {/* FLOATING GOOGLE MAPS UI CONTROLS */}

      {/* 1. Floating Search & Categories Panel (Only for customer view) */}
      {!onSelectCoords && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 1000,
          width: 'calc(100% - 24px)',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '4px 14px',
            boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
            border: '1px solid #E2E8F0'
          }}>
            <span style={{ marginRight: '8px', color: '#94A3B8', fontSize: '16px' }}>🔍</span>
            <input 
              type="text"
              placeholder="Search hotels, landmarks, cities..."
              value={mapSearchQuery}
              onChange={e => setMapSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                padding: '8px 0',
                color: '#1E293B',
                fontFamily: 'inherit'
              }}
            />
            {mapSearchQuery && (
              <button 
                onClick={() => setMapSearchQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#94A3B8', padding: '0 4px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '2px 0 6px 2px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {[
              { id: 'all', label: '📍 All Stays' },
              { id: 'hotel', label: '🏨 Hotels' },
              { id: 'resort', label: '🌳 Resorts' },
              { id: 'apartment', label: '🏡 Villas' },
              { id: 'pg', label: '🏘️ PG Rentals' }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => {
                  setSelectedCategoryFilter(chip.id);
                  clearRoute();
                }}
                style={{
                  border: 'none',
                  background: selectedCategoryFilter === chip.id ? '#0A3B2A' : 'white',
                  color: selectedCategoryFilter === chip.id ? 'white' : '#475569',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Satellite / Map Mode Switcher */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <button
          onClick={() => setMapType(prev => prev === 'road' ? 'satellite' : 'road')}
          style={{
            border: 'none',
            background: 'white',
            color: '#0A3B2A',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'transform 0.2s'
          }}
          title={mapType === 'road' ? 'Satellite View' : 'Default View'}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {mapType === 'road' ? '🛰️' : '🗺️'}
        </button>
      </div>

      {/* 3. Floating Bottom Controls: Locate Me & Live Tracking */}
      <div style={{
        position: 'absolute',
        bottom: '80px', // Raised so it doesn't block Leaflet attribution
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Live GPS tracking toggle */}
        <button
          onClick={() => setLiveTracking(prev => !prev)}
          style={{
            border: 'none',
            background: liveTracking ? '#3B82F6' : 'white',
            color: liveTracking ? 'white' : '#475569',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.3s'
          }}
          title={liveTracking ? 'Disable Live Tracking' : 'Enable Live GPS Tracking'}
        >
          {liveTracking ? '📡' : '👁️'}
        </button>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          style={{
            border: 'none',
            background: 'white',
            color: '#3B82F6',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'transform 0.2s'
          }}
          title="Zoom to My Location"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          🎯
        </button>
      </div>

      {/* 4. Google Maps Style Route Directions Card Overlay */}
      {activeRoute && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '12px',
          zIndex: 1001,
          background: 'white',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          width: 'calc(100% - 24px)',
          maxWidth: '330px',
          borderLeft: '5px solid #0A3B2A',
          fontFamily: 'var(--font-family, sans-serif)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0A3B2A' }}>🗺️ Route Navigation</span>
            <button 
              onClick={clearRoute} 
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#94A3B8' }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            To: {activeRoute.destName}
          </div>

          {/* Transportation Mode Select Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            {[
              { mode: 'driving', icon: '🚗', lbl: 'Drive' },
              { mode: 'bicycling', icon: '🚲', lbl: 'Cycle' },
              { mode: 'walking', icon: '🚶', lbl: 'Walk' }
            ].map(tab => (
              <button
                key={tab.mode}
                onClick={() => handleTransitModeChange(tab.mode)}
                style={{
                  border: 'none',
                  background: transitMode === tab.mode ? 'white' : 'transparent',
                  color: transitMode === tab.mode ? '#0A3B2A' : '#64748B',
                  borderRadius: '6px',
                  padding: '6px 4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: transitMode === tab.mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.lbl}</span>
              </button>
            ))}
          </div>

          {/* Travel Metrics */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94A3B8', display: 'block', fontWeight: '700' }}>Distance</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>{activeRoute.distance.toFixed(1)} km</strong>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94A3B8', display: 'block', fontWeight: '700' }}>Travel Duration</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>{activeRoute.timeToReach}</strong>
            </div>
          </div>

          {/* Turn-by-Turn Steps */}
          {activeRoute.steps && activeRoute.steps.length > 0 && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeRoute.steps.map((step, idx) => {
                  let arrow = '⬆️';
                  if (idx === 1) arrow = '⬅️';
                  if (idx === 2) arrow = '↗️';
                  if (idx === 3) arrow = '➡️';
                  if (idx === activeRoute.steps.length - 1) arrow = '🏁';
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#334155', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', flexShrink: 0 }}>{arrow}</span>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>{step.instruction}</div>
                        {step.dist !== '0 m' && (
                          <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '700' }}>({step.dist})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {onSelectCoords && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 14px',
          borderRadius: '24px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#0A3B2A',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #E2E8F0'
        }}>
          📍 Click anywhere on the map to choose coordinates
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
