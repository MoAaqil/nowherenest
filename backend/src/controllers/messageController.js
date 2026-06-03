const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Staff = require('../models/Staff');

// Get all messages for a booking
exports.getMessages = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('property');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: only customer, property owner, or staff can view messages
    const isCustomer = booking.customer.toString() === req.user.id;
    const isOwner = booking.property?.owner?.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: booking.property?._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ booking: req.params.bookingId })
      .populate('sender', 'name role profileImage')
      .sort('createdAt');

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message for a booking
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const booking = await Booking.findById(req.params.bookingId).populate('property');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization check
    const isCustomer = booking.customer.toString() === req.user.id;
    const isOwner = booking.property?.owner?.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: booking.property?._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages for this booking' });
    }

    const message = await Message.create({
      booking: req.params.bookingId,
      sender: req.user.id,
      senderRole: req.user.role,
      text: text.trim()
    });

    const populated = await Message.findById(message._id).populate('sender', 'name role profileImage');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
