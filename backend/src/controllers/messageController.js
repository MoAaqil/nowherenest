const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Staff = require('../models/Staff');

function containsPhoneNumber(text) {
  // Remove all special chars
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Extract all digits
  const justDigits = clean.replace(/\D/g, '');
  if (justDigits.length >= 10 && /(?:\d[ -]*){10}/.test(text.replace(/[a-z]/gi, ''))) return true;

  // Map words to digits
  const wordMap = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    double: 'double', triple: 'triple'
  };
  
  const tokens = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  let digitSeq = '';
  let maxSeq = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (wordMap[t]) {
      if (t === 'double' && i+1 < tokens.length && wordMap[tokens[i+1]] && !['double', 'triple'].includes(wordMap[tokens[i+1]])) {
        digitSeq += wordMap[tokens[i+1]].repeat(2);
        i++;
      } else if (t === 'triple' && i+1 < tokens.length && wordMap[tokens[i+1]] && !['double', 'triple'].includes(wordMap[tokens[i+1]])) {
        digitSeq += wordMap[tokens[i+1]].repeat(3);
        i++;
      } else if (t !== 'double' && t !== 'triple') {
        digitSeq += wordMap[t];
      }
    } else if (/^\d+$/.test(t)) {
      digitSeq += t;
    } else {
      maxSeq = Math.max(maxSeq, digitSeq.length);
      digitSeq = '';
    }
  }
  maxSeq = Math.max(maxSeq, digitSeq.length);
  
  return maxSeq >= 10 || /(?:\d\s*){10}/.test(text);
}

// Get all messages between a customer and a property
exports.getMessages = async (req, res) => {
  try {
    const { propertyId, customerId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Authorization: only the specific customer, property owner, or staff can view
    const isCustomer = customerId === req.user.id;
    const isOwner = property.owner.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: property._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const messages = await Message.find({ 
      property: propertyId, 
      customer: customerId,
      createdAt: { $gte: tenDaysAgo }
    })
      .populate('sender', 'name role profileImage')
      .sort('createdAt');

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message between a customer and a property
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { propertyId, customerId } = req.params;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Combine current text with recent messages from the same user to prevent continuous number sending
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentMessages = await Message.find({
      property: propertyId,
      customer: customerId,
      sender: req.user.id,
      createdAt: { $gte: fiveMinutesAgo }
    }).sort('-createdAt').limit(15);
    
    const combinedText = recentMessages.reverse().map(m => m.text).join(' ') + ' ' + text;

    if (containsPhoneNumber(combinedText)) {
      return res.status(400).json({ success: false, message: 'According to community guidelines, you cannot share mobile numbers in the chat.' });
    }

    // Authorization check
    const isCustomer = customerId === req.user.id;
    const isOwner = property.owner.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: property._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Attempt to link to the latest booking if exists
    const latestBooking = await Booking.findOne({ property: propertyId, customer: customerId }).sort('-createdAt');
    
    if (isCustomer && latestBooking && latestBooking.status === 'checked_out') {
      return res.status(400).json({ success: false, message: 'Chat is disabled after checkout.' });
    }

    const message = await Message.create({
      booking: latestBooking ? latestBooking._id : undefined,
      property: propertyId,
      customer: customerId,
      sender: req.user.id,
      senderRole: req.user.role,
      text: text.trim()
    });

    const populated = await Message.findById(message._id).populate('sender', 'name role profileImage');

    // Emit to socket room: `${propertyId}_${customerId}`
    const io = req.app.get('io');
    if (io) {
      io.to(`${propertyId}_${customerId}`).emit('receive_message', populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all threads for a property
exports.getThreads = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Authorization
    const isOwner = property.owner.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: property._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find all distinct customers for this property's messages
    const customers = await Message.distinct('customer', { property: propertyId });
    
    // Get last message and customer details for each thread
    const threads = [];
    for (const customerId of customers) {
      const lastMessage = await Message.findOne({ property: propertyId, customer: customerId })
        .sort('-createdAt')
        .populate('customer', 'name email phone profileImage')
        .populate('sender', 'name role');
        
      if (lastMessage && lastMessage.customer) {
        threads.push({
          customer: lastMessage.customer,
          lastMessage: {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender,
            senderRole: lastMessage.senderRole
          }
        });
      }
    }

    // Sort threads by most recent message
    threads.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.status(200).json({ success: true, threads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a specific message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    // Emit to socket room to remove from UI
    const io = req.app.get('io');
    if (io) {
      io.to(`${message.property}_${message.customer}`).emit('message_deleted', messageId);
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear chat history between property and customer
exports.clearChat = async (req, res) => {
  try {
    const { propertyId, customerId } = req.params;
    
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Authorization: customer, owner, staff, or admin
    const isCustomer = customerId === req.user.id;
    const isOwner = property.owner.toString() === req.user.id;
    const isStaff = await Staff.exists({ property: property._id, user: req.user.id, status: 'active' });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to clear this chat' });
    }

    await Message.deleteMany({ property: propertyId, customer: customerId });

    // Emit to socket room to clear UI
    const io = req.app.get('io');
    if (io) {
      io.to(`${propertyId}_${customerId}`).emit('chat_cleared');
    }

    res.status(200).json({ success: true, message: 'Chat cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
