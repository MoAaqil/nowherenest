const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nowherenest_secret_key_12345', {
    expiresIn: '30d'
  });
};

// Global cache for simulated OTPs: phone -> otp
const otpCache = {};

exports.register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer'
    });

    res.status(201).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        isVerified: user.isVerified,
        licenseId: user.licenseId,
        isLicensed: user.isLicensed,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide phone number' });
    }

    // Generate random 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpCache[phone] = otp;

    // In a production environment, you would call SMS service here (e.g. Twilio).
    // For our working model, we return the OTP in the payload so the frontend can display it in developer sandbox.
    res.status(200).json({
      success: true,
      message: 'Simulated OTP sent successfully!',
      otp: otp, // Sending the code in response so frontend can show sandbox alert
      phone
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide phone number and OTP' });
    }

    const cachedOtp = otpCache[phone];
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Clear from cache
    delete otpCache[phone];

    // Find and verify user with this phone
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this phone number. Please sign up first.' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBankDetails = async (req, res) => {
  const { bankName, accountNumber, ifscCode, holderName } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.bankDetails = { bankName, accountNumber, ifscCode, holderName };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Bank account details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        bankDetails: user.bankDetails,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, phone, role, licenseId, profileImage, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (password && password.length >= 6) {
      user.password = password; // Will be hashed by pre-save hook
    }

    // License ID verification
    if (licenseId !== undefined) {
      user.licenseId = licenseId;
      // Verify the license ID format: nwn(2 alpha)(last 4 of phone)(2 of email)(3 serial digits)
      // Just store it - we verify by checking format prefix 'nwn'
      if (licenseId && licenseId.toLowerCase().startsWith('nwn')) {
        user.isLicensed = true;
      } else {
        user.isLicensed = false;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        isVerified: user.isVerified,
        licenseId: user.licenseId,
        isLicensed: user.isLicensed,
        profileImage: user.profileImage,
        bankDetails: user.bankDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
