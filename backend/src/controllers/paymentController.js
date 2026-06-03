const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

exports.verifyWebhook = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('property');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Verify Signature if we have actual keys
    if (process.env.RAZORPAY_KEY_ID) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    // Trigger Razorpay Route (Automated Payout to Host)
    const host = await User.findById(booking.property.owner);
    if (host && host.razorpayAccountId && process.env.RAZORPAY_KEY_ID) {
      try {
        await razorpay.transfers.create({
          account: host.razorpayAccountId,
          amount: booking.ownerAmount * 100, // in paise
          currency: 'INR'
        });
      } catch (transferError) {
        console.error('Razorpay Route Transfer Failed:', transferError);
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
