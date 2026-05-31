const mongoose = require('mongoose');

const housekeepingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  taskType: {
    type: String,
    enum: ['cleaning', 'maintenance', 'laundry'],
    default: 'cleaning'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance', 'blocked'],
    default: 'cleaning'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // references User profile with housekeeper staff role
    default: null
  },
  dueDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Housekeeping', housekeepingSchema);
