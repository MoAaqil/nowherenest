const Property = require('../models/Property');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const ical = require('ical-generator').default;
const nodeIcal = require('node-ical');

// Simulated OTA channels — in production these would be real API integrations
const OTA_CHANNELS = [
  { id: 'booking_com', name: 'Booking.com', icon: '🏨', color: '#003580' },
  { id: 'agoda', name: 'Agoda', icon: '🌏', color: '#5392FF' },
  { id: 'airbnb', name: 'Airbnb', icon: '🏠', color: '#FF5A5F' },
  { id: 'expedia', name: 'Expedia', icon: '✈️', color: '#00355F' },
  { id: 'makemytrip', name: 'MakeMyTrip', icon: '🧳', color: '#E94560' },
  { id: 'goibibo', name: 'Goibibo', icon: '🐦', color: '#F05941' },
];

// Get Channel Manager Dashboard data
exports.getChannelDashboard = async (req, res) => {
  try {
    // Fetch all active properties
    const properties = await Property.find({ status: 'active' })
      .populate('owner', 'name email')
      .lean();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const dashboard = [];

    for (const property of properties) {
      const rooms = await Room.find({ property: property._id }).lean();

      const roomData = [];
      for (const room of rooms) {
        // Count confirmed/checked_in bookings overlapping today
        const activeBookings = await Booking.countDocuments({
          room: room._id,
          status: { $in: ['confirmed', 'checked_in'] },
          startDate: { $lte: now },
          endDate: { $gte: today },
        });

        // Total inventory (default 1 per room if not explicitly set)
        const totalInventory = room.totalInventory || 1;
        const maintenanceBlocks = room.maintenanceBlocks || 0;
        const available = Math.max(0, totalInventory - activeBookings - maintenanceBlocks);

        // 7-day availability forecast
        const forecast = [];
        for (let d = 0; d < 7; d++) {
          const dayStart = new Date(today);
          dayStart.setDate(today.getDate() + d);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayStart.getDate() + 1);

          const dayBookings = await Booking.countDocuments({
            room: room._id,
            status: { $in: ['confirmed', 'checked_in'] },
            startDate: { $lt: dayEnd },
            endDate: { $gt: dayStart },
          });

          forecast.push({
            date: dayStart.toISOString().split('T')[0],
            available: Math.max(0, totalInventory - dayBookings - maintenanceBlocks),
            booked: Math.min(dayBookings, totalInventory),
          });
        }

        roomData.push({
          roomId: room._id,
          category: room.category,
          price: room.price,
          totalInventory,
          maintenanceBlocks,
          currentlyBooked: activeBookings,
          available,
          availabilityPercent: Math.round((available / totalInventory) * 100),
          forecast,
          // Simulated OTA channel connections
          channelMappings: room.channelMappings || [],
        });
      }

      dashboard.push({
        propertyId: property._id,
        propertyName: property.name,
        propertyType: property.type,
        location: property.address,
        owner: property.owner,
        rooms: roomData,
        totalRooms: rooms.length,
        channelsConnected: OTA_CHANNELS.slice(0, 2), // Simulated — first 2 as connected
      });
    }

    res.status(200).json({
      success: true,
      channels: OTA_CHANNELS,
      dashboard,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Simulate pushing inventory update to all OTA channels
exports.simulateSync = async (req, res) => {
  try {
    const { propertyId, roomId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeBookings = await Booking.countDocuments({
      room: room._id,
      status: { $in: ['confirmed', 'checked_in'] },
      startDate: { $lte: now },
      endDate: { $gte: today },
    });

    const totalInventory = room.totalInventory || 1;
    const available = Math.max(0, totalInventory - activeBookings - (room.maintenanceBlocks || 0));

    // Simulate OTA push results
    const syncResults = OTA_CHANNELS.map(channel => ({
      channel: channel.name,
      icon: channel.icon,
      status: 'success',
      availabilitySent: available,
      syncedAt: new Date().toISOString(),
      message: available === 0 ? 'Sold Out pushed' : `${available} rooms available pushed`,
    }));

    res.status(200).json({
      success: true,
      message: `Inventory sync completed for ${OTA_CHANNELS.length} channels`,
      available,
      syncResults,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update room total inventory
exports.updateRoomInventory = async (req, res) => {
  try {
    const { totalInventory, maintenanceBlocks } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      {
        ...(totalInventory !== undefined ? { totalInventory: parseInt(totalInventory) } : {}),
        ...(maintenanceBlocks !== undefined ? { maintenanceBlocks: parseInt(maintenanceBlocks) } : {}),
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export Room iCal
exports.exportRoomIcal = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate('property');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const bookings = await Booking.find({
      room: room._id,
      status: { $in: ['confirmed', 'checked_in'] }
    });

    const calendar = ical({ name: `Nowhere Nest - ${room.property?.name} (${room.category})` });

    bookings.forEach(b => {
      calendar.createEvent({
        start: new Date(b.startDate),
        end: new Date(b.endDate),
        summary: 'Nowhere Nest Booking',
        description: `Booking ID: ${b._id}`,
        uid: b._id.toString()
      });
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="room-${room._id}.ics"`);
    return res.status(200).send(calendar.toString());
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncExternalIcal = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    let newBlockedDates = [];
    
    for (const link of room.externalIcalLinks || []) {
      const events = await nodeIcal.async.fromURL(link.url);
      for (const key in events) {
        if (events.hasOwnProperty(key)) {
          const ev = events[key];
          if (ev.type === 'VEVENT') {
            const start = new Date(ev.start);
            const end = new Date(ev.end);
            for (let dt = new Date(start); dt < end; dt.setDate(dt.getDate() + 1)) {
              newBlockedDates.push(new Date(dt));
            }
          }
        }
      }
    }
    
    room.blockedDates = [...room.blockedDates, ...newBlockedDates];
    
    const uniqueDates = Array.from(new Set(room.blockedDates.map(d => d.getTime()))).map(t => new Date(t));
    room.blockedDates = uniqueDates;
    
    await room.save();
    
    res.status(200).json({ success: true, message: 'iCal sync completed', blockedDatesCount: room.blockedDates.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addExternalIcalLink = async (req, res) => {
  try {
    const { name, url } = req.body;
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    room.externalIcalLinks = room.externalIcalLinks || [];
    room.externalIcalLinks.push({ name, url });
    await room.save();
    
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeExternalIcalLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    room.externalIcalLinks = room.externalIcalLinks.filter(l => l._id.toString() !== linkId);
    await room.save();
    
    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
