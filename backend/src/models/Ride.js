const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  vehicleModel: { type: String, default: '' },
  vehicleNo: { type: String, default: '' },
  phone: { type: String, default: '' },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  pickupCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destinationCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  fare: { type: Number, required: true },
  status: {
    type: String,
    enum: ['requested', 'driver_assigned', 'in_progress', 'completed'],
    default: 'requested'
  },
  driver: { type: driverSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
