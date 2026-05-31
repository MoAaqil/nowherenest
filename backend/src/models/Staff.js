const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['manager', 'receptionist', 'housekeeper', 'accountant'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
});

// Avoid duplicate staff assignments
staffSchema.index({ property: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema);
