import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Car, Bike, Compass, MapPin, Navigation, Phone, CheckCircle, ShieldAlert, Award } from 'lucide-react';
import './CabBooking.css';

const CabBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const bookingId = searchParams.get('bookingId');
  
  const [booking, setBooking] = useState(null);
  const [ride, setRide] = useState(null);
  
  // Form fields
  const [pickupAddress, setPickupAddress] = useState(
    localStorage.getItem('gps_enabled') === 'true' && !isNaN(parseFloat(localStorage.getItem('user_lat')))
      ? `Your Current Location (${parseFloat(localStorage.getItem('user_lat')).toFixed(4)}, ${parseFloat(localStorage.getItem('user_lng')).toFixed(4)})`
      : 'Kottayam Railway Station, Kerala'
  );
  // Destination will be locked to the stay address
  const [destinationAddress, setDestinationAddress] = useState('');
  const [rideType, setRideType] = useState('cab'); // bike, auto, cab

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Live Map and Simulation States
  const mapInstance = useRef(null);
  const driverMarker = useRef(null);
  const [simulationStatus, setSimulationStatus] = useState('idle'); // idle, assigned, starting, moving, completed
  const [driverInfo, setDriverInfo] = useState(null);
  const [distance, setDistance] = useState(3.5); // default mock distance in km
  
  // Coordinates mapping — read real GPS from localStorage (set by App.jsx geolocation), fallback to Kottayam station
  const savedLat = parseFloat(localStorage.getItem('user_lat'));
  const savedLng = parseFloat(localStorage.getItem('user_lng'));
  const gpsAvailable = localStorage.getItem('gps_enabled') === 'true' && !isNaN(savedLat) && !isNaN(savedLng);
  const pickupCoords = gpsAvailable
    ? { lat: savedLat, lng: savedLng }
    : { lat: 9.5915, lng: 76.5221 }; // fallback: Kottayam Railway Station
  const [destinationCoords, setDestinationCoords] = useState({ lat: 9.5929, lng: 76.4227 }); // Stay coords

  useEffect(() => {
    if (!bookingId) {
      setError('A valid stay booking reference is required to book a nearby ride.');
      setLoading(false);
      return;
    }
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.bookings.getById(bookingId);
      setBooking(res.booking);
      setDestinationAddress(res.booking.listing.location.address);
      setDestinationCoords({
        lat: res.booking.listing.location.lat,
        lng: res.booking.listing.location.lng
      });
      
      // Auto estimate distance
      const dist = calculateDistance(
        pickupCoords.lat, pickupCoords.lng,
        res.booking.listing.location.lat, res.booking.listing.location.lng
      );
      setDistance(dist > 0.1 ? dist : 5.8);

    } catch (err) {
      setError(err.message || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getEstimatedFare = () => {
    let base = 30;
    let perKm = 10;
    if (rideType === 'bike') { base = 15; perKm = 6; }
    else if (rideType === 'auto') { base = 25; perKm = 9; }
    return Math.round(base + (distance * perKm));
  };

  // 1. Initial Map Render
  useEffect(() => {
    if (!booking || mapInstance.current || !window.L) return;

    // Initialize Map centered between Pickup and Destination
    const centerLat = (pickupCoords.lat + destinationCoords.lat) / 2;
    const centerLng = (pickupCoords.lng + destinationCoords.lng) / 2;

    mapInstance.current = window.L.map('cab-tracking-map-element').setView([centerLat, centerLng], 12);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance.current);

    // Custom Blue Pin for User Pickup
    const pickupIcon = window.L.divIcon({
      className: 'pickup-pin',
      html: `<div style="background-color: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Custom Red Pin for Stay Destination
    const destinationIcon = window.L.divIcon({
      className: 'dest-pin',
      html: `<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add Markers
    window.L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).addTo(mapInstance.current).bindPopup('📍 Your Pickup Location');
    window.L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destinationIcon }).addTo(mapInstance.current).bindPopup('🏢 Booked Stay (Destination)');

    // Draw route path line
    const routeCoordinates = [
      [pickupCoords.lat, pickupCoords.lng],
      [destinationCoords.lat, destinationCoords.lng]
    ];
    window.L.polyline(routeCoordinates, { color: '#0A3B2A', weight: 4, opacity: 0.7, dashArray: '5, 10' }).addTo(mapInstance.current);

  }, [booking]);

  // 2. Booking the Ride
  const handleBookRide = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.rides.create({
        bookingId,
        pickupAddress,
        destinationAddress,
        pickupCoords,
        destinationCoords,
        rideType
      });

      setRide(res.ride);
      setSimulationStatus('assigned');
      
      // Start Simulation chain trigger
      triggerDriverSimulation(res.ride._id);
    } catch (err) {
      setError(err.message || 'Cab booking dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Driver Live Route movement Simulation
  const triggerDriverSimulation = async (rideId) => {
    if (!window.L || !mapInstance.current) return;

    try {
      // Step A: Assign Driver on server
      await api.rides.simulateProgress(rideId, 'assign');
      const res1 = await api.rides.getById(rideId);
      setRide(res1.ride);
      setDriverInfo(res1.ride.driver);
      
      // Plot Driver initially on Map (offset location)
      const taxiIcon = window.L.divIcon({
        className: 'taxi-marker',
        html: `<div style="background-color: #FBBF24; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); font-size: 16px;">🚖</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      driverMarker.current = window.L.marker(
        [res1.ride.driver.lat, res1.ride.driver.lng],
        { icon: taxiIcon }
      ).addTo(mapInstance.current);
      
      driverMarker.current.bindPopup('🚕 Your Driver is heading to your location.').openPopup();

      // Step B: Start journey towards pickup (after 3 seconds)
      setTimeout(async () => {
        setSimulationStatus('starting');
        await api.rides.simulateProgress(rideId, 'start');
        
        // Move marker to pickup coords
        driverMarker.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
        driverMarker.current.bindPopup('🚕 Driver arrived! Trip has started.').openPopup();
        
        // Step C: Animate and move along interpolation path towards destination (stay)
        setTimeout(async () => {
          setSimulationStatus('moving');
          const pathRes = await api.rides.getRoutePath(rideId); // fetch interpolation path
          const pathPoints = pathRes.route;
          
          let i = 0;
          const interval = setInterval(() => {
            if (i < pathPoints.length) {
              const pt = pathPoints[i];
              driverMarker.current.setLatLng([pt.lat, pt.lng]);
              mapInstance.current.panTo([pt.lat, pt.lng]);
              i++;
            } else {
              clearInterval(interval);
              // Complete trip
              finalizeRide(rideId);
            }
          }, 350); // move marker every 350ms
        }, 3000);

      }, 3000);

    } catch (err) {
      console.error('Simulation error:', err.message);
    }
  };

  const finalizeRide = async (rideId) => {
    try {
      await api.rides.simulateProgress(rideId, 'complete');
      const res = await api.rides.getById(rideId);
      setRide(res.ride);
      setSimulationStatus('completed');
      setSuccessMsg('You have successfully arrived at your Stay destination! Enjoy your nest.');
      
      if (driverMarker.current) {
        driverMarker.current.bindPopup('🎉 Arrived! Trip Completed.').openPopup();
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="cab-booking-page container">
      <div className="flex-between cab-header">
        <div>
          <h2>Nearby Cab Booking (Rapido Style)</h2>
          {booking && <p>Dispatching ride coordinates to <strong>{booking.listing.title}</strong></p>}
        </div>
        <Link to="/" className="btn btn-outline btn-small">Cancel Ride</Link>
      </div>

      {error && <div className="login-error-alert">{error}</div>}
      {successMsg && <div className="login-success-alert">{successMsg}</div>}

      <div className="cab-booking-split">
        {/* Left Side: Booking & Details */}
        <div className="cab-controls-side">
          {simulationStatus === 'idle' ? (
            /* Ride Selection Form */
            <form onSubmit={handleBookRide} className="cab-dispatch-form card" style={{ padding: '24px' }}>
              <h4>Setup Route Parameters</h4>
              
              <div className="form-group">
                <label>Pickup Location</label>
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Destination Stay (Locked)</label>
                <div className="input-with-icon">
                  <Navigation size={16} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={destinationAddress}
                    disabled
                  />
                </div>
              </div>

              {/* Ride type selector cards */}
              <div className="ride-types-grid grid grid-cols-3" style={{ gap: '12px', margin: '20px 0' }}>
                <div 
                  className={`ride-type-card card flex-center flex-direction-col ${rideType === 'bike' ? 'active' : ''}`}
                  onClick={() => setRideType('bike')}
                >
                  <Bike size={24} />
                  <span>Rapido Bike</span>
                  <strong style={{ fontSize: '12px' }}>₹{Math.round(getEstimatedFare() * 8)}</strong>
                </div>

                <div 
                  className={`ride-type-card card flex-center flex-direction-col ${rideType === 'auto' ? 'active' : ''}`}
                  onClick={() => setRideType('auto')}
                >
                  <span>🛺</span>
                  <span>Auto Rickshaw</span>
                  <strong style={{ fontSize: '12px' }}>₹{Math.round(getEstimatedFare() * 12)}</strong>
                </div>

                <div 
                  className={`ride-type-card card flex-center flex-direction-col ${rideType === 'cab' ? 'active' : ''}`}
                  onClick={() => setRideType('cab')}
                >
                  <Car size={24} />
                  <span>Comfort Cab</span>
                  <strong style={{ fontSize: '12px' }}>₹{Math.round(getEstimatedFare() * 18)}</strong>
                </div>
              </div>

              <div className="booking-summary-box" style={{ fontSize: '13px', padding: '12px' }}>
                <div className="flex-between"><span>Estimated Distance:</span><strong>{distance.toFixed(1)} km</strong></div>
                <div className="flex-between"><span>Base Booking fare:</span><strong>${getEstimatedFare()}</strong></div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '16px' }} disabled={loading}>
                {loading ? 'Requesting Driver...' : 'Request Ride Booking'}
              </button>
            </form>
          ) : (
            /* Simulation Details Panel */
            <div className="cab-simulation-panel card" style={{ padding: '24px' }}>
              <div className="simulation-status-header">
                <span className="status-label">Ride Status</span>
                <h4 style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>
                  {simulationStatus === 'assigned' && '🔎 Finding Driver...'}
                  {simulationStatus === 'starting' && '🚕 Driver Arrived! Pickup Boarded.'}
                  {simulationStatus === 'moving' && '🚀 En Route to Stay...'}
                  {simulationStatus === 'completed' && '✅ Trip Completed! Welcome.'}
                </h4>
              </div>

              {driverInfo && (
                <div className="driver-details-card card flex-between" style={{ padding: '16px', margin: '20px 0' }}>
                  <div className="driver-profile-info">
                    <strong>{driverInfo.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                      Vehicle: {driverInfo.vehicleModel} | <strong>{driverInfo.vehicleNo}</strong>
                    </div>
                  </div>
                  <div className="driver-phone flex-center" style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '50%' }}>
                    <Phone size={16} style={{ color: 'var(--primary-color)' }} />
                  </div>
                </div>
              )}

              <div className="booking-summary-box">
                <div className="flex-between"><span>Pickup Point:</span><span>{pickupAddress}</span></div>
                <div className="flex-between"><span>Drop stay:</span><span>{destinationAddress}</span></div>
                <div className="flex-between"><span>Fare Total:</span><strong>${ride?.fare}</strong></div>
              </div>

              {simulationStatus === 'completed' && (
                <button onClick={() => navigate('/')} className="btn btn-primary btn-block" style={{ marginTop: '20px' }}>
                  Return to Home
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Map Canvas */}
        <div className="cab-map-side">
          <div className="map-wrapper card" style={{ height: '480px' }}>
            <div id="cab-tracking-map-element" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabBooking;
