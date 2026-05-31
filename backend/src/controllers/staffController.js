const Staff = require('../models/Staff');
const User = require('../models/User');
const Property = require('../models/Property');

// Invite/Add Staff
exports.addStaff = async (req, res) => {
  try {
    const { propertyId, email, role } = req.body;

    // Verify req.user is the owner or manager of the property
    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isManager = await Staff.exists({
      property: propertyId,
      user: req.user.id,
      role: 'manager',
      status: 'active'
    });

    if (!isOwner && !isManager && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage staff for this property' });
    }

    if (!['manager', 'receptionist', 'housekeeper', 'accountant'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role provided' });
    }

    // 1. Find or create user by email
    let user = await User.findOne({ email });
    if (!user) {
      // Auto-create placeholder user profile for new staff
      user = await User.create({
        name: email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-10), // secure random password
        role: 'staff',
        isVerified: false
      });
      console.log(`Auto-created staff user profile in MongoDB: ${email}`);
    } else {
      // Update role to 'staff' if they are 'customer' currently
      if (user.role === 'customer') {
        user.role = 'staff';
        await user.save();
      }
    }

    // 2. Add to Staff assignments
    const existingStaff = await Staff.findOne({ property: propertyId, user: user._id });
    if (existingStaff) {
      if (existingStaff.status === 'active') {
        return res.status(400).json({ success: false, message: 'User is already an active staff member of this property' });
      }
      // Reactivate staff member with new role
      existingStaff.role = role;
      existingStaff.status = 'active';
      await existingStaff.save();
      return res.status(200).json({ success: true, staff: existingStaff });
    }

    const staff = await Staff.create({
      property: propertyId,
      user: user._id,
      role,
      status: 'active'
    });

    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Staff list for a property
exports.getPropertyStaff = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const isOwner = await Property.exists({ _id: propertyId, owner: req.user.id });
    const isStaff = await Staff.exists({ property: propertyId, user: req.user.id, status: 'active' });

    if (!isOwner && !isStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view staff list' });
    }

    const staffList = await Staff.find({ property: propertyId })
      .populate('user', 'name email phone role');

    res.status(200).json({ success: true, count: staffList.length, staff: staffList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Staff role or status
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member assignment not found' });
    }

    const isOwner = await Property.exists({ _id: staff.property, owner: req.user.id });
    const isManager = await Staff.exists({
      property: staff.property,
      user: req.user.id,
      role: 'manager',
      status: 'active'
    });

    if (!isOwner && !isManager && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit staff configurations' });
    }

    const { role, status } = req.body;
    if (role) staff.role = role;
    if (status) staff.status = status;

    await staff.save();
    
    // Refresh user role if they are no longer staff anywhere
    if (status === 'inactive') {
      const activeAssignmentsCount = await Staff.countDocuments({ user: staff.user, status: 'active' });
      if (activeAssignmentsCount === 0) {
        const u = await User.findById(staff.user);
        if (u && u.role === 'staff') {
          u.role = 'customer'; // demote back to customer
          await u.save();
        }
      }
    }

    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove Staff Member
exports.removeStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff assignment not found' });
    }

    const isOwner = await Property.exists({ _id: staff.property, owner: req.user.id });
    const isManager = await Staff.exists({
      property: staff.property,
      user: req.user.id,
      role: 'manager',
      status: 'active'
    });

    if (!isOwner && !isManager && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to remove staff' });
    }

    const userId = staff.user;
    await staff.deleteOne();

    // Check if user is staff anywhere else
    const activeAssignmentsCount = await Staff.countDocuments({ user: userId, status: 'active' });
    if (activeAssignmentsCount === 0) {
      const u = await User.findById(userId);
      if (u && u.role === 'staff') {
        u.role = 'customer';
        await u.save();
      }
    }

    res.status(200).json({ success: true, message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
