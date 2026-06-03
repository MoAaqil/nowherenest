const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  holderName: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'admin', 'staff'], 
    default: 'customer' 
  },
  walletBalance: { type: Number, default: 0 }, // For owners to accumulate earnings
  bankDetails: { type: bankDetailsSchema, default: () => ({}) }, // For owners to link bank accounts
  isVerified: { type: Boolean, default: false }, // Simulating OTP verified status
  // Host License system
  licenseId: { type: String, default: '' },       // NWN generated license ID
  isLicensed: { type: Boolean, default: false },  // True once host enters matching license ID
  profileImage: { type: String, default: '' },    // Host profile image URL
  owlsPoints: { type: Number, default: 0 },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  aadharNumber: { type: String, default: '' },
  aadharPhotoUrl: { type: String, default: '' },
  hostAddress: { type: String, default: '' },
  nestPartner: { type: Boolean, default: false },
  nestPartnerSince: { type: Date, default: null },
  vibeCredits: { type: Number, default: 0 },
  razorpayAccountId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});


// Pre-save hashing for password security
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Verify input password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
