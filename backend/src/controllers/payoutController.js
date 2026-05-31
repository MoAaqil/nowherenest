const Payout = require('../models/Payout');
const User = require('../models/User');

exports.requestPayout = async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can request payouts' });
    }

    // Check bank details
    if (!user.bankDetails || !user.bankDetails.accountNumber || !user.bankDetails.bankName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please link your bank account details in your dashboard before requesting a payout' 
      });
    }

    // Minimum redemption threshold
    const minRedemption = parseFloat(process.env.MIN_REDEMPTION_AMOUNT) || 100;
    if (amount < minRedemption) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum redemption amount is $${minRedemption}` 
      });
    }

    // Check balance
    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance. You only have $${user.walletBalance.toFixed(2)} available` 
      });
    }

    // Create Payout Request
    const payout = await Payout.create({
      owner: user._id,
      amount,
      bankDetailsSnapshot: user.bankDetails,
      status: 'requested'
    });

    // Deduct from owner's wallet
    user.walletBalance -= amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Payout redemption request submitted successfully',
      payout,
      remainingBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ owner: req.user.id }).sort('-requestedAt');
    res.status(200).json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    // Admin only route
    const payouts = await Payout.find()
      .populate('owner', 'name email phone walletBalance')
      .sort('-requestedAt');

    res.status(200).json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayoutStatus = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Choose approved or rejected' });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    if (payout.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'This payout request has already been processed' });
    }

    payout.status = status;
    payout.processedAt = Date.now();
    await payout.save();

    // If rejected, refund the amount back to owner's wallet
    if (status === 'rejected') {
      const owner = await User.findById(payout.owner);
      if (owner) {
        owner.walletBalance += payout.amount;
        await owner.save();
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Payout request has been successfully ${status}`, 
      payout 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
