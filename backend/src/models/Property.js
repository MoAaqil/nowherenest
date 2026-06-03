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
  landscapeCategory: {
    type: String,
    enum: ['city', 'hillstation', 'beach', 'forest', 'desert', 'village', 'island', 'other'],
    default: 'city'
  },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  starRating: { type: Number, default: 3, min: 1, max: 5 },
  checkInTime: { type: String, default: '12:00 PM' },
  checkOutTime: { type: String, default: '11:00 AM' },
  amenities: { type: [String], default: [] }, // ac, pool, gym, parking, wifi, etc.
  photos: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'maintenance', 'blocked', 'pending'], default: 'pending' },
  licenseNumber: { type: String, default: '' },
  identityProofType: { type: String, enum: ['aadhar', 'driving_license'], default: 'aadhar' },
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
  identityProofPhotoUrl: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);
