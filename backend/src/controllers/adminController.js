const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');
const Property = require('../models/Property');

exports.getAdminStats = async (req, res) => {
  try {
    // 1. Fetch User segmentation counts
    const customersCount = await User.countDocuments({ role: 'customer' });
    const ownersCount = await User.countDocuments({ role: 'owner' });
    
    // 2. Fetch Property counts by type (de-simulated)
    const staysCount = await Property.countDocuments({ type: { $ne: 'guesthouse' } });
    const rentalsCount = await Property.countDocuments({ type: 'guesthouse' });
    const totalProperties = staysCount + rentalsCount;

    // 3. Aggregate booking totals
    const bookings = await Booking.find();
    const totalBookingsCount = bookings.length;
    
    let totalSalesVolume = 0;
    let platformCommissionEarned = 0;
    let ownerEarnings = 0;

    bookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out') {
        totalSalesVolume += b.totalAmount || 0;
        platformCommissionEarned += b.commissionAmount || Math.round((b.totalAmount || 0) * 0.08);
        ownerEarnings += b.ownerAmount || Math.round((b.totalAmount || 0) * 0.92);
      }
    });

    // 4. Payout stats
    const payouts = await Payout.find();
    let pendingPayoutsTotal = 0;
    let approvedPayoutsTotal = 0;

    payouts.forEach(p => {
      if (p.status === 'requested') {
        pendingPayoutsTotal += p.amount;
      } else if (p.status === 'approved') {
        approvedPayoutsTotal += p.amount;
      }
    });

    // 5. Fetch all bookings for invoices grouping
    const recentBookings = await Booking.find()
      .populate('customer', 'name email')
      .populate('property', 'name category type location address')
      .populate({
        path: 'listing',
        select: 'title type category'
      })
      .sort('-createdAt');

    // 6. Fetch all active properties for complete invoices coverage
    const properties = await Property.find({ status: 'active' })
      .select('name type location status')
      .sort('name');

    const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.08');

    res.status(200).json({
      success: true,
      stats: {
        users: {
          customers: customersCount,
          owners: ownersCount,
          total: customersCount + ownersCount
        },
        listings: {
          stays: staysCount,
          rentals: rentalsCount,
          total: totalProperties
        },
        financials: {
          totalSales: totalSalesVolume,
          platformCommission: platformCommissionEarned,
          ownerPayoutsAccumulated: ownerEarnings,
          pendingPayouts: pendingPayoutsTotal,
          approvedPayouts: approvedPayoutsTotal
        },
        bookingsCount: totalBookingsCount
      },
      recentBookings,
      properties,
      commissionRate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGlobalCommissionRate = async (req, res) => {
  const { rate } = req.body; // value between 0.05 (5%) and 0.12 (12%)
  try {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate) || numericRate < 0.05 || numericRate > 0.12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Commission rate must be a numeric value between 0.05 (5%) and 0.12 (12%)' 
      });
    }

    // Set process env or update system config. In a full production system, this would write to a Config collection.
    // We will save it in process.env so that it persists during runtime.
    process.env.COMMISSION_RATE = numericRate.toString();

    res.status(200).json({ 
      success: true, 
      message: `Global platform commission rate updated successfully to ${(numericRate * 100).toFixed(1)}%`,
      currentRate: numericRate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all hosts (with optional phone/search filter)
exports.getHosts = async (req, res) => {
  try {
    const { phone, search } = req.query;
    let filter = { role: 'owner' };
    if (phone && phone.trim()) {
      filter.phone = { $regex: phone.trim(), $options: 'i' };
    }
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    const hosts = await User.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, hosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify/License host
exports.verifyHost = async (req, res) => {
  try {
    const { licenseId } = req.body;
    if (!licenseId || licenseId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid license ID for this host' });
    }

    const host = await User.findById(req.params.id);
    if (!host || host.role !== 'owner') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    host.licenseId = licenseId;
    host.isLicensed = true;
    await host.save();

    res.status(200).json({ success: true, message: 'Host successfully verified and licensed!', host });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all properties (populating aadhar fields from owner)
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate('owner', 'name email phone isLicensed aadharNumber aadharPhotoUrl hostAddress nestPartner').sort('-createdAt');
    res.status(200).json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Issue Stay License and Approve
exports.licenseProperty = async (req, res) => {
  try {
    const { licenseNumber } = req.body;
    if (!licenseNumber || licenseNumber.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid license number for this stay' });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Stay property not found' });
    }

    property.licenseNumber = licenseNumber;
    property.status = 'active';
    await property.save();

    res.status(200).json({ success: true, message: 'Stay successfully approved and licensed!', property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get region/area wise stats
exports.getRegionStats = async (req, res) => {
  try {
    const properties = await Property.find({}, 'name type status state district address').sort('state district');
    const regionMap = {};

    // Helper: parse state/district from address string "street, city, district, state"
    const parseAddressParts = (address) => {
      if (!address) return { state: null, district: null };
      const parts = address.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Last part = state, second-to-last = district
        let statePart = parts[parts.length - 1];
        // Strip pin codes if present e.g. "Kerala - 686563"
        const pinIdx = statePart.search(/-\s*\d+/);
        if (pinIdx !== -1) statePart = statePart.substring(0, pinIdx).trim();
        const districtPart = parts[parts.length - 2];
        return { state: statePart || null, district: districtPart || null };
      }
      return { state: null, district: null };
    };

    for (const p of properties) {
      let state = p.state && p.state.trim() ? p.state.trim() : null;
      let district = p.district && p.district.trim() ? p.district.trim() : null;

      // Fallback: parse from address string if fields are empty
      if (!state || !district) {
        const parsed = parseAddressParts(p.address);
        if (!state && parsed.state) state = parsed.state;
        if (!district && parsed.district) district = parsed.district;

        // Auto-heal: save parsed values back to DB so next load is instant
        if (state || district) {
          await Property.findByIdAndUpdate(p._id, {
            ...(state ? { state } : {}),
            ...(district ? { district } : {})
          });
        }
      }

      // Final fallback labels
      const stateName = state || 'Unspecified State';
      const districtName = district || 'Unspecified District';

      if (!regionMap[stateName]) regionMap[stateName] = {};
      if (!regionMap[stateName][districtName]) {
        regionMap[stateName][districtName] = { total: 0, active: 0, pending: 0, byType: {} };
      }
      regionMap[stateName][districtName].total++;
      if (p.status === 'active') regionMap[stateName][districtName].active++;
      else regionMap[stateName][districtName].pending++;
      const t = p.type || 'other';
      regionMap[stateName][districtName].byType[t] = (regionMap[stateName][districtName].byType[t] || 0) + 1;
    }

    // Convert to sorted array format
    const regions = Object.entries(regionMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, districts]) => ({
        state,
        totalInState: Object.values(districts).reduce((s, d) => s + d.total, 0),
        districts: Object.entries(districts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([district, stats]) => ({ district, ...stats }))
      }));

    res.status(200).json({ success: true, regions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get pending vibes queue (for admin approval)
exports.getPendingVibes = async (req, res) => {
  try {
    const Vibe = require('../models/Vibe');
    const vibes = await Vibe.find({ status: 'pending' })
      .populate('owner', 'name email phone nestPartner')
      .populate('property', 'name address type')
      .sort('-createdAt');
    res.status(200).json({ success: true, vibes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify a vibe (approve for public display)
exports.verifyVibe = async (req, res) => {
  try {
    const Vibe = require('../models/Vibe');
    const vibe = await Vibe.findById(req.params.id);
    if (!vibe) return res.status(404).json({ success: false, message: 'Vibe not found' });
    vibe.status = 'verified';
    vibe.rejectionReason = '';
    await vibe.save();
    res.status(200).json({ success: true, message: 'Vibe approved and now visible to customers!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a vibe with reason
exports.rejectVibe = async (req, res) => {
  try {
    const Vibe = require('../models/Vibe');
    const { reason } = req.body;
    const vibe = await Vibe.findById(req.params.id);
    if (!vibe) return res.status(404).json({ success: false, message: 'Vibe not found' });
    vibe.status = 'rejected';
    vibe.rejectionReason = reason || 'Rejected by administrator';
    await vibe.save();
    res.status(200).json({ success: true, message: 'Vibe rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Nest Partner status for a host
exports.toggleNestPartner = async (req, res) => {
  try {
    const host = await User.findById(req.params.id);
    if (!host || host.role !== 'owner') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }
    host.nestPartner = !host.nestPartner;
    host.nestPartnerSince = host.nestPartner ? new Date() : null;
    await host.save();
    const msg = host.nestPartner ? 'Nest Partner status GRANTED!' : 'Nest Partner status REVOKED';
    res.status(200).json({ success: true, message: msg, nestPartner: host.nestPartner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: add vibe credits to a host
exports.addVibeCredits = async (req, res) => {
  try {
    const { credits } = req.body;
    if (!credits || isNaN(credits) || credits <= 0) {
      return res.status(400).json({ success: false, message: 'Provide a positive number of credits' });
    }
    const host = await User.findById(req.params.id);
    if (!host || host.role !== 'owner') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }
    host.vibeCredits = (host.vibeCredits || 0) + parseInt(credits);
    await host.save();
    res.status(200).json({ success: true, message: `${credits} vibe credits added. New balance: ${host.vibeCredits}`, vibeCredits: host.vibeCredits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
