const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: { type: Number, required: true },
  bankDetailsSnapshot: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    holderName: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected'],
    default: 'requested'
  },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

module.exports = mongoose.model('Payout', payoutSchema);
