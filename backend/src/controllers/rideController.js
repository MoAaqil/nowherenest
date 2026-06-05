const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// Helper to calculate mathematical distance between coordinates (in km)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mock Driver Pool
const drivers = [
  { name: 'Ramesh Kumar', vehicleModel: 'Suzuki Dzire (Silver)', vehicleNo: 'DL 3C AB 1234', phone: '+91 98765 43210' },
  { name: 'Amit Singh', vehicleModel: 'Hyundai Accent (White)', vehicleNo: 'KA 03 MX 5678', phone: '+91 87654 32109' },
  { name: 'Sanjay Sharma', vehicleModel: 'Splendor Pro (Black)', vehicleNo: 'MH 12 CR 9012', phone: '+91 76543 21098' }, // Bike
  { name: 'Vikram Patel', vehicleModel: 'Bajaj RE Auto (Yellow)', vehicleNo: 'HR 26 BY 3456', phone: '+91 65432 10987' } // Auto
];

exports.createRide = async (req, res) => {
  const { bookingId, pickupAddress, destinationAddress, pickupCoords, destinationCoords, rideType } = req.body;
  try {
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Reference stay booking not found' });
      }
    }

    const dist = calculateDistance(
      pickupCoords.lat, pickupCoords.lng,
      destinationCoords.lat, destinationCoords.lng
    );
    const distanceKm = dist > 0.1 ? dist : 3.5; // fallback to 3.5km if coords are identical

    // Fare calculation
    let baseFare = 30; // INR or base units
    let ratePerKm = 10;
    
    if (rideType === 'bike') {
      baseFare = 15;
      ratePerKm = 6;
    } else if (rideType === 'auto') {
      baseFare = 25;
      ratePerKm = 9;
    } else { // cab
      baseFare = 50;
      ratePerKm = 14;
    }

    const fare = Math.round(baseFare + (distanceKm * ratePerKm));

    const rideData = {
      customer: req.user.id,
      pickupAddress,
      destinationAddress,
      pickupCoords,
      destinationCoords,
      fare
    };
    if (bookingId) rideData.booking = bookingId;

    const ride = await Ride.create(rideData);

    res.status(201).json({ success: true, ride, distanceKm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('customer', 'name phone');
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride details not found' });
    }
    res.status(200).json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({ customer: req.user.id })
      .populate('booking')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: rides.length, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.simulateRideProgress = async (req, res) => {
  const { step } = req.body; // 'assign', 'start', 'complete'
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (step === 'assign') {
      // Choose random driver
      const randDriver = drivers[Math.floor(Math.random() * drivers.length)];
      // Set driver starting point slightly away from pickup coords to simulate driving towards user
      const startLat = ride.pickupCoords.lat + (Math.random() - 0.5) * 0.01;
      const startLng = ride.pickupCoords.lng + (Math.random() - 0.5) * 0.01;

      ride.status = 'driver_assigned';
      ride.driver = {
        name: randDriver.name,
        vehicleModel: randDriver.vehicleModel,
        vehicleNo: randDriver.vehicleNo,
        phone: randDriver.phone,
        lat: startLat,
        lng: startLng
      };
      await ride.save();
    } else if (step === 'start') {
      // Driver arrives at pickup and starts the ride
      ride.status = 'in_progress';
      ride.driver.lat = ride.pickupCoords.lat;
      ride.driver.lng = ride.pickupCoords.lng;
      await ride.save();
    } else if (step === 'complete') {
      // Driver completes the trip
      ride.status = 'completed';
      ride.driver.lat = ride.destinationCoords.lat;
      ride.driver.lng = ride.destinationCoords.lng;
      await ride.save();
    }

    res.status(200).json({ 
      success: true, 
      message: `Ride simulation step '${step}' executed successfully`, 
      ride 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generates route coordinates for drawing route polylines on Leaflet map
exports.getRideRoutePath = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Generate 10 interpolation coordinates between pickup and destination to draw path
    const route = [];
    const p1 = ride.pickupCoords;
    const p2 = ride.destinationCoords;
    const stepsCount = 12;

    for (let i = 0; i <= stepsCount; i++) {
      const fraction = i / stepsCount;
      const lat = p1.lat + (p2.lat - p1.lat) * fraction;
      const lng = p1.lng + (p2.lng - p1.lng) * fraction;
      route.push({ lat, lng });
    }

    res.status(200).json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
