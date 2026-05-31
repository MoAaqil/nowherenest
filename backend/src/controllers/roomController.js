const Room = require('../models/Room');
const Property = require('../models/Property');
const Staff = require('../models/Staff');

// Helper to check property write access
const hasPropertyWriteAccess = async (userId, role, propertyId) => {
  if (role === 'admin') return true;
  
  const property = await Property.findById(propertyId);
  if (!property) return false;

  if (role === 'owner' && property.owner.toString() === userId.toString()) return true;
  
  if (role === 'staff') {
    const staff = await Staff.findOne({ property: propertyId, user: userId, role: { $in: ['manager', 'receptionist'] }, status: 'active' });
    return !!staff;
  }
  return false;
};

// Create a Room category
exports.createRoom = async (req, res) => {
  try {
    const { propertyId, category, price, capacity, amenities, images, cancellationPolicy } = req.body;

    const hasAccess = await hasPropertyWriteAccess(req.user.id, req.user.role, propertyId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to add rooms to this property' });
    }

    const room = await Room.create({
      property: propertyId,
      category,
      price,
      capacity,
      amenities: amenities || [],
      images: images || [],
      cancellationPolicy
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Rooms for a Property
exports.getRoomsByProperty = async (req, res) => {
  try {
    const rooms = await Room.find({ property: req.params.propertyId });
    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Room By ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('property', 'name address location type checkInTime checkOutTime');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room category not found' });
    }
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Room Details (prices, blockedDates, amenities)
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room category not found' });
    }

    const hasAccess = await hasPropertyWriteAccess(req.user.id, req.user.role, room.property);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to update rooms for this property' });
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Room Category
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room category not found' });
    }

    const hasAccess = await hasPropertyWriteAccess(req.user.id, req.user.role, room.property);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete rooms for this property' });
    }

    await room.deleteOne();
    res.status(200).json({ success: true, message: 'Room category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Add Room Categories
exports.bulkAddRooms = async (req, res) => {
  try {
    const { propertyId, roomsList } = req.body; // Array of rooms configurations

    const hasAccess = await hasPropertyWriteAccess(req.user.id, req.user.role, propertyId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to add rooms to this property' });
    }

    if (!Array.isArray(roomsList) || roomsList.length === 0) {
      return res.status(400).json({ success: false, message: 'Rooms list must be a non-empty array' });
    }

    const roomsToInsert = roomsList.map(r => ({
      property: propertyId,
      category: r.category || 'standard',
      price: r.price,
      capacity: r.capacity || 2,
      amenities: r.amenities || [],
      images: r.images || [],
      cancellationPolicy: r.cancellationPolicy || 'Free cancellation within 24 hours'
    }));

    const insertedRooms = await Room.insertMany(roomsToInsert);
    res.status(201).json({ success: true, count: insertedRooms.length, rooms: insertedRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
