const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');

exports.getAdminStats = async (req, res) => {
  try {
    // 1. Fetch User segmentation counts
    const customersCount = await User.countDocuments({ role: 'customer' });
    const ownersCount = await User.countDocuments({ role: 'owner' });
    
    // 2. Fetch Listing counts by type
    const staysCount = await Listing.countDocuments({ type: 'stay' });
    const rentalsCount = await Listing.countDocuments({ type: 'rental' });
    const totalListings = staysCount + rentalsCount;

    // 3. Aggregate booking totals
    const bookings = await Booking.find();
    const totalBookingsCount = bookings.length;
    
    let totalSalesVolume = 0;
    let platformCommissionEarned = 0;
    let ownerEarnings = 0;

    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        totalSalesVolume += b.totalAmount;
        platformCommissionEarned += b.commissionAmount;
        ownerEarnings += b.ownerAmount;
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

    // 5. Fetch recent 10 bookings
    const recentBookings = await Booking.find()
      .populate('customer', 'name email')
      .populate({
        path: 'listing',
        select: 'title type category'
      })
      .sort('-createdAt')
      .limit(10);

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
          total: totalListings
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
      recentBookings
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
