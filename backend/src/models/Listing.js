const mongoose = require('mongoose');

const uspSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 } // cost of trek/guide package
}, { _id: false });

const listingSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ['stay', 'rental'], 
    required: true // stay = per night (Oyo/Airbnb), rental = monthly PG/room (NoBroker)
  },
  category: { 
    type: String, 
    enum: ['cottage', 'pg', 'hotel', 'apartment'], 
    default: 'hotel' 
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true }, // nightly rate for stays, monthly rent for PG/rentals
  advanceDeposit: { type: Number, default: 0 }, // security deposit, relevant only for 'rental'
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true, default: 0 }, // Leaflet map latitude
    lng: { type: Number, required: true, default: 0 }  // Leaflet map longitude
  },
  amenities: {
    type: [String],
    default: [] // wifi, hot_water, electricity, food, ac, gym, parking
  },
  images: {
    type: [String],
    default: []
  },
  usps: {
    type: [uspSchema],
    default: [] // Unique local experiences like trekking, local tours, guide packages
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);
