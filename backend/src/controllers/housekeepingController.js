const Housekeeping = require('../models/Housekeeping');
const Property = require('../models/Property');
const Staff = require('../models/Staff');

// Create a Housekeeping Task
exports.createTask = async (req, res) => {
  try {
    const { propertyId, roomId, taskType, assignedStaffId, notes, dueDate } = req.body;

    // Verify user is owner/manager/receptionist of this property
    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isAuthorizedStaff = await Staff.exists({
      property: propertyId,
      user: req.user.id,
      role: { $in: ['manager', 'receptionist'] },
      status: 'active'
    });

    if (!isOwner && !isAuthorizedStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create housekeeping tasks' });
    }

    const task = await Housekeeping.create({
      property: propertyId,
      room: roomId,
      taskType: taskType || 'cleaning',
      assignedStaff: assignedStaffId || null,
      notes: notes || '',
      dueDate: dueDate || new Date(),
      status: 'cleaning' // starts as cleaning
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Housekeeping Tasks for a Property
exports.getPropertyTasks = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isStaff = await Staff.exists({ property: propertyId, user: req.user.id, status: 'active' });

    if (!isOwner && !isStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view housekeeping for this property' });
    }

    const tasks = await Housekeeping.find({ property: propertyId })
      .populate('room', 'category price priceCalendar')
      .populate('assignedStaff', 'name email phone')
      .sort('dueDate');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Task (status, staff reassignment, notes)
exports.updateTask = async (req, res) => {
  try {
    const task = await Housekeeping.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Housekeeping task not found' });
    }

    // Auth check: Task assignee, owner of property, or property manager/receptionist
    const isOwner = await Property.exists({ _id: task.property, owner: req.user.id });
    const isAssigned = task.assignedStaff && task.assignedStaff.toString() === req.user.id;
    const isMgmtStaff = await Staff.exists({
      property: task.property,
      user: req.user.id,
      role: { $in: ['manager', 'receptionist'] },
      status: 'active'
    });

    if (!isOwner && !isAssigned && !isMgmtStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this housekeeping task' });
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.assignedStaffId !== undefined) updates.assignedStaff = req.body.assignedStaffId;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    updates.updatedAt = new Date();

    const updatedTask = await Housekeeping.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('room', 'category')
      .populate('assignedStaff', 'name email phone');

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Housekeeper tasks
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Housekeeping.find({ assignedStaff: req.user.id })
      .populate('property', 'name address')
      .populate('room', 'category')
      .sort('dueDate');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
