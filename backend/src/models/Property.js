const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['hotel', 'resort', 'villa', 'homestay', 'apartment', 'guesthouse'], 
    required: true 
  },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true, default: 0 },
    lng: { type: Number, required: true, default: 0 }
  },
  starRating: { type: Number, default: 3, min: 1, max: 5 },
  checkInTime: { type: String, default: '12:00 PM' },
  checkOutTime: { type: String, default: '11:00 AM' },
  amenities: { type: [String], default: [] }, // ac, pool, gym, parking, wifi, etc.
  photos: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'maintenance', 'blocked'], default: 'active' },
  identityProofType: { type: String, enum: ['passport', 'aadhar', 'driving_license'] },
  identityProofNumber: { type: String, default: '' },
  usps: {
    type: [{
      title: { type: String, required: true },
      description: { type: String, default: '' },
      price: { type: Number, required: true, default: 0 },
      chargeType: { type: String, enum: ['per_person', 'per_family'], default: 'per_family' }
    }],
    default: []
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);
