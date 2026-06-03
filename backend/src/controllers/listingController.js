const Property = require('../models/Property');
const Room = require('../models/Room');
const Listing = require('../models/Listing'); // keep for schema refs if needed

const mapPropertyToListing = async (property) => {
  const rooms = await Room.find({ property: property._id });
  const minPrice = rooms.reduce((min, r) => r.price < min ? r.price : min, 1500);

  let category = 'hotel';
  let type = 'stay';
  
  if (property.type === 'resort' || property.type === 'villa' || property.type === 'homestay') {
    category = 'cottage';
  } else if (property.type === 'apartment') {
    category = 'apartment';
  } else if (property.type === 'guesthouse') {
    category = 'pg';
    type = 'rental';
  }

  return {
    _id: property._id,
    owner: property.owner,
    type,
    category,
    title: property.name,
    description: property.description,
    price: minPrice,
    advanceDeposit: type === 'rental' ? minPrice * 2 : 0,
    location: {
      address: property.address,
      lat: property.location?.coordinates?.[1] || 9.5929,
      lng: property.location?.coordinates?.[0] || 76.4227
    },
    landscapeCategory: property.landscapeCategory || 'city',
    amenities: property.amenities,
    images: property.photos,
    starRating: property.starRating,
    usps: property.usps || [],
    createdAt: property.createdAt
  };
};

exports.createListing = async (req, res) => {
  // Redirect to Property creation
  return res.status(400).json({ 
    success: false, 
    message: 'Listing creation is deprecated. Please create properties and rooms in the Host console instead.' 
  });
};

exports.getListings = async (req, res) => {
  try {
    const { type, category, landscapeCategory, search, amenities, lat, lng, radius } = req.query;
    
    // Locate all verified hosts
    const User = require('../models/User');
    const verifiedHosts = await User.find({ role: { $in: ['owner', 'admin'] }, isLicensed: true }).select('_id');
    const hostIds = verifiedHosts.map(u => u._id);

    // We will query Property collection and map
    let query = { 
      status: 'active',
      owner: { $in: hostIds }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    if (amenities) {
      const amenitiesArr = amenities.split(',');
      query.amenities = { $all: amenitiesArr };
    }

    let properties = [];
    if (lat && lng) {
      const maxDist = radius ? parseInt(radius) * 1000 : 50000; // default 50km
      properties = await Property.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance', // calculated distance in meters
            maxDistance: maxDist,
            query: query,
            spherical: true
          }
        }
      ]);
      properties = await Property.populate(properties, { path: 'owner', select: 'name email phone isLicensed profileImage' });
    } else {
      properties = await Property.find(query).populate('owner', 'name email phone isLicensed profileImage');
    }

    const mappedListings = [];

    for (const prop of properties) {
      const mapped = await mapPropertyToListing(prop);
      if (prop.distance !== undefined) {
        mapped.distance = prop.distance / 1000; // Attach distance in km to the listing
      }
      // Filter by type or category if requested
      let match = true;
      if (type && mapped.type !== type) match = false;
      if (category && mapped.category !== category) match = false;
      if (landscapeCategory && mapped.landscapeCategory !== landscapeCategory) match = false;
      
      if (match) {
        mappedListings.push(mapped);
      }
    }

    res.status(200).json({ success: true, count: mappedListings.length, listings: mappedListings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email phone bankDetails walletBalance isLicensed profileImage');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    const mapped = await mapPropertyToListing(property);
    res.status(200).json({ success: true, listing: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOwnerListings = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id });
    const mappedListings = [];
    for (const prop of properties) {
      mappedListings.push(await mapPropertyToListing(prop));
    }
    res.status(200).json({ success: true, count: mappedListings.length, listings: mappedListings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateListing = async (req, res) => {
  // Redirect to Property update
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Listing property not found' });
    }
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const mapped = await mapPropertyToListing(updated);
    res.status(200).json({ success: true, listing: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteListing = async (req, res) => {
  // Redirect to Property delete
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Listing property not found' });
    }
    await property.deleteOne();
    res.status(200).json({ success: true, message: 'Listing property deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
