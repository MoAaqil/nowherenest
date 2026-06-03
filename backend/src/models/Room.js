const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true,
    index: true
  },
  category: { 
    type: String, 
    enum: ['standard', 'deluxe', 'premium', 'suite', 'custom'], 
    default: 'standard' 
  },
  price: { type: Number, required: true }, // price per night
  capacity: { type: Number, required: true, default: 2 }, // guest occupancy limit
  amenities: { type: [String], default: [] }, // ac, ac_tv, balcony, minibar
  images: { type: [String], default: [] },
  availability: { type: Boolean, default: true }, // global active block flag
  blockedDates: { type: [Date], default: [] }, // specific dates blocked by bookings
  cancellationPolicy: { type: String, default: 'Free cancellation within 24 hours' },
  // Channel Manager inventory fields
  totalInventory: { type: Number, default: 1 },         // total physical rooms of this type
  maintenanceBlocks: { type: Number, default: 0 },      // rooms blocked for maintenance/owner
  channelMappings: { type: [{ channel: String, externalRoomId: String }], default: [] },
  externalIcalLinks: { type: [{ name: String, url: String }], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
