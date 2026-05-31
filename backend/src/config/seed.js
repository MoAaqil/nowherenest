const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Property = require('../models/Property');
const Room = require('../models/Room');
const Coupon = require('../models/Coupon');
const Staff = require('../models/Staff');
const Housekeeping = require('../models/Housekeeping');
const Booking = require('../models/Booking');
const Vibe = require('../models/Vibe');

const seedData = async () => {
  try {
    // Check if database is already populated
    const userCount = await User.countDocuments();
    if (userCount > 0) {

      // Check if bookings are empty to seed reviews retroactively
      const bookingCount = await Booking.countDocuments();
      if (bookingCount === 0) {
        const customer = await User.findOne({ role: 'customer' });
        const owner = await User.findOne({ role: 'owner' });
        const properties = await Property.find();
        if (customer && owner && properties.length >= 3) {
          const roomsProp0 = await Room.find({ property: properties[0]._id });
          const roomsProp1 = await Room.find({ property: properties[1]._id });
          const roomsProp2 = await Room.find({ property: properties[2]._id });

          if (roomsProp0.length > 0 && roomsProp1.length > 0 && roomsProp2.length > 0) {
            const reviewsBookings = [
              {
                customer: customer._id,
                property: properties[0]._id,
                room: roomsProp0[0]._id,
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
                endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
                baseAmount: 440,
                totalAmount: 440,
                commissionAmount: 44,
                ownerAmount: 396,
                status: 'checked_out',
                paymentStatus: 'paid',
                checkInOTP: '482012',
                isOtpVerified: true,
                checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
                checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
                guests: [{ name: 'Jemision', age: 28 }],
                review: {
                  rating: 5,
                  comment: 'I recently had the pleasure of staying in this charming cottage, and it exceeded all my expectations. The pool view is spectacular and host Albert was extremely helpful!',
                  reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
                }
              },
              {
                customer: customer._id,
                property: properties[0]._id,
                room: roomsProp0.length > 1 ? roomsProp0[1]._id : roomsProp0[0]._id,
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
                endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
                baseAmount: 700,
                totalAmount: 700,
                commissionAmount: 70,
                ownerAmount: 630,
                status: 'checked_out',
                paymentStatus: 'paid',
                checkInOTP: '908234',
                isOtpVerified: true,
                checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
                checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
                guests: [{ name: 'Jemision', age: 28 }],
                review: {
                  rating: 4,
                  comment: 'Lovely resort in Kumarakom. Great location near the lake. The standard rooms are comfortable, and breakfast was delicious.',
                  reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
                }
              },
              {
                customer: customer._id,
                property: properties[1]._id,
                room: roomsProp1[0]._id,
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
                endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
                baseAmount: 1350,
                totalAmount: 1350,
                commissionAmount: 135,
                ownerAmount: 1215,
                status: 'checked_out',
                paymentStatus: 'paid',
                checkInOTP: '741258',
                isOtpVerified: true,
                checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
                checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
                guests: [{ name: 'Jemision', age: 28 }],
                review: {
                  rating: 5,
                  comment: 'Absolute paradise! The heritage suites are gorgeous, private pools are clean, and the staff treats you like royalty. Highly recommended!',
                  reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9)
                }
              },
              {
                customer: customer._id,
                property: properties[2]._id,
                room: roomsProp2[0]._id,
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
                endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
                baseAmount: 750,
                totalAmount: 750,
                commissionAmount: 75,
                ownerAmount: 675,
                status: 'checked_out',
                paymentStatus: 'paid',
                checkInOTP: '159753',
                isOtpVerified: true,
                checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
                checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
                guests: [{ name: 'Jemision', age: 28 }],
                review: {
                  rating: 3,
                  comment: 'Affordable co-living space. Proximity to MG road is great, and high-speed wifi is good for work. Food was average.',
                  reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
                }
              }
            ];
            await Booking.insertMany(reviewsBookings);
            console.log('Seeded reviews bookings retroactively!');

            // Recompute property average ratings
            for (const prop of properties) {
              const allB = reviewsBookings.filter(b => b.property.toString() === prop._id.toString());
              if (allB.length > 0) {
                const sum = allB.reduce((acc, b) => acc + b.review.rating, 0);
                const avg = Math.round((sum / allB.length) * 10) / 10;
                await Property.findByIdAndUpdate(prop._id, { starRating: avg });
                console.log(`Retroactively recomputed rating for ${prop.name}: ${avg}`);
              }
            }
          }
        }
      }

      console.log('Database already has data. Skipping automatic database seeding.');
      return;
    }

    console.log('Seeding initial data into Nowhere Nest database...');

    // 1. Create Users
    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'aaqilezio@gmail.com',
      password: '1234567890',
      phone: '+919999900000',
      role: 'admin',
      isVerified: true
    });

    // Owner
    const owner = await User.create({
      name: 'Albert (Host)',
      email: 'owner@nowherenest.com',
      password: 'password123',
      phone: '+918888877777',
      role: 'owner',
      isVerified: true,
      walletBalance: 25000,
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '50100223344556',
        ifscCode: 'HDFC0000123',
        holderName: 'Albert D'
      }
    });

    // Customer
    const customer = await User.create({
      name: 'Jemision (Guest)',
      email: 'customer@nowherenest.com',
      password: 'password123',
      phone: '+919999988888',
      role: 'customer',
      isVerified: true
    });

    // Staff
    const staffUser = await User.create({
      name: 'Ramu (Staff)',
      email: 'staff@nowherenest.com',
      password: 'password123',
      phone: '+919999911111',
      role: 'staff',
      isVerified: true
    });

    console.log('Users Seeded: admin@nowherenest.com, owner@nowherenest.com, customer@nowherenest.com, staff@nowherenest.com');

    // 2. Create Properties
    const properties = [
      {
        owner: owner._id,
        name: 'Bail Exotica Cottage & Resort',
        description: 'Bail Exotica is a private luxury cottage in Kumarakom, Kerala. Known for its tranquil atmosphere. Ideal for a relaxing escape with pool view.',
        type: 'resort',
        address: 'Kumarakom, Kottayam, Kerala - 686563',
        location: { lat: 9.5929, lng: 76.4227 },
        starRating: 4,
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool', 'parking'],
        photos: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80']
      },
      {
        owner: owner._id,
        name: 'Taj Kumarakom Resort & Spa',
        description: 'Luxury heritage resort with premium pool villas, Ayurvedic spas, and outdoor private pools. Features exquisite dining options.',
        type: 'hotel',
        address: '1/404, Kavanattinkara, Kumarakom, Kerala - 686566',
        location: { lat: 9.5915, lng: 76.4258 },
        starRating: 5,
        checkInTime: '02:00 PM',
        checkOutTime: '12:00 PM',
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool', 'gym', 'parking'],
        photos: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80']
      },
      {
        owner: owner._id,
        name: '11 Green Bank PG & Co-living',
        description: 'Luxury city PG accommodation for students and young professionals. High-speed wifi, food inclusive, clean power backup and 24/7 security.',
        type: 'guesthouse',
        address: 'MG Road, Kochi, Kerala - 682016',
        location: { lat: 9.9723, lng: 76.2805 },
        starRating: 3,
        checkInTime: '10:00 AM',
        checkOutTime: '10:00 AM',
        amenities: ['wifi', 'hot_water', 'electricity', 'food'],
        photos: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80']
      }
    ];

    const insertedProperties = await Property.insertMany(properties);
    console.log('Properties Seeded!');

    // 3. Create Rooms under Properties
    const rooms = [
      // Rooms for Bail Exotica
      {
        property: insertedProperties[0]._id,
        category: 'deluxe',
        price: 220,
        capacity: 2,
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool'],
        images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'],
        cancellationPolicy: 'Free cancellation within 24 hours'
      },
      {
        property: insertedProperties[0]._id,
        category: 'suite',
        price: 350,
        capacity: 4,
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool', 'minibar'],
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
        cancellationPolicy: 'Free cancellation within 48 hours'
      },
      // Rooms for Taj Kumarakom
      {
        property: insertedProperties[1]._id,
        category: 'premium',
        price: 450,
        capacity: 3,
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool', 'gym', 'parking'],
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'],
        cancellationPolicy: 'Free cancellation within 24 hours'
      },
      // Rooms for PG
      {
        property: insertedProperties[2]._id,
        category: 'standard',
        price: 150,
        capacity: 1,
        amenities: ['wifi', 'hot_water', 'electricity', 'food'],
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
        cancellationPolicy: 'Non-refundable'
      }
    ];

    const insertedRooms = await Room.insertMany(rooms);
    console.log('Rooms Seeded!');

    // 4. Create Coupons
    await Coupon.create([
      {
        property: insertedProperties[0]._id,
        code: 'SUMMER20',
        discountPercent: 20,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days expiry
        maxUses: 100,
        usesCount: 0
      },
      {
        property: insertedProperties[1]._id,
        code: 'WELCOME10',
        discountPercent: 10,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days expiry
        maxUses: 200,
        usesCount: 0
      }
    ]);
    console.log('Coupons Seeded!');

    // 5. Create Staff assignments
    await Staff.create([
      {
        property: insertedProperties[0]._id,
        user: staffUser._id,
        role: 'housekeeper',
        status: 'active'
      }
    ]);
    console.log('Staff assignments Seeded!');

    // 6. Housekeeping Tasks
    await Housekeeping.create([
      {
        property: insertedProperties[0]._id,
        room: insertedRooms[0]._id,
        taskType: 'cleaning',
        status: 'cleaning',
        assignedStaff: staffUser._id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
        notes: 'Prepare the room for next guest check-in.'
      }
    ]);
    console.log('Housekeeping task Seeded!');

    // 7. Seed legacy Listings to ensure customer-app doesn't break initially
    const listings = [
      {
        owner: owner._id,
        type: 'stay',
        category: 'cottage',
        title: 'Bail Exotica Cottage',
        description: 'Bail Exotica is a private luxury cottage in Kumarakom, Kerala. Known for its tranquil atmosphere. Ideal for a relaxing escape with pool view.',
        price: 220,
        location: {
          address: 'Kumarakom, Kottayam, Kerala - 686563',
          lat: 9.5929,
          lng: 76.4227
        },
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool'],
        images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'],
        usps: [
          { title: 'Sunset Lake Cruise', description: '2-hour private boat cruise in Vembanad Lake', price: 45 },
          { title: 'Trekking to Aruvikkuzhi', description: 'Guided morning trek to waterfalls and tea gardens', price: 20 }
        ]
      },
      {
        owner: owner._id,
        type: 'stay',
        category: 'hotel',
        title: 'Taj Kumarakom Resort & Spa',
        description: 'Luxury heritage resort with premium pool villas, Ayurvedic spas, and outdoor private pools. Features exquisite dining options.',
        price: 350,
        location: {
          address: '1/404, Kavanattinkara, Kumarakom, Kerala - 686566',
          lat: 9.5915,
          lng: 76.4258
        },
        amenities: ['wifi', 'hot_water', 'electricity', 'food', 'pool', 'gym', 'parking'],
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'],
        usps: [
          { title: 'Ayurvedic Massage Treatment', description: 'Full body traditional therapy by experts', price: 80 }
        ]
      },
      {
        owner: owner._id,
        type: 'rental',
        category: 'pg',
        title: '11 Green Bank PG & Co-living',
        description: 'Luxury city PG accommodation for students and young professionals. High-speed wifi, food inclusive, clean power backup and 24/7 security.',
        price: 150, // monthly rent
        advanceDeposit: 300, // advance deposit
        location: {
          address: 'MG Road, Kochi, Kerala - 682016',
          lat: 9.9723,
          lng: 76.2805
        },
        amenities: ['wifi', 'hot_water', 'electricity', 'food'],
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80']
      }
    ];

    await Listing.insertMany(listings);
    console.log('Legacy Listings Seeded successfully!');

    // 7.5 Seed Bookings with Reviews
    const reviewsBookings = [
      {
        customer: customer._id,
        property: insertedProperties[0]._id,
        room: insertedRooms[0]._id,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        baseAmount: 440,
        totalAmount: 440,
        commissionAmount: 44,
        ownerAmount: 396,
        status: 'checked_out',
        paymentStatus: 'paid',
        checkInOTP: '482012',
        isOtpVerified: true,
        checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        guests: [{ name: 'Jemision', age: 28 }],
        review: {
          rating: 5,
          comment: 'I recently had the pleasure of staying in this charming cottage, and it exceeded all my expectations. The pool view is spectacular and host Albert was extremely helpful!',
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
        }
      },
      {
        customer: customer._id,
        property: insertedProperties[0]._id,
        room: insertedRooms[1]._id,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        baseAmount: 700,
        totalAmount: 700,
        commissionAmount: 70,
        ownerAmount: 630,
        status: 'checked_out',
        paymentStatus: 'paid',
        checkInOTP: '908234',
        isOtpVerified: true,
        checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        guests: [{ name: 'Jemision', age: 28 }],
        review: {
          rating: 4,
          comment: 'Lovely resort in Kumarakom. Great location near the lake. The standard rooms are comfortable, and breakfast was delicious.',
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
        }
      },
      {
        customer: customer._id,
        property: insertedProperties[1]._id,
        room: insertedRooms[2]._id,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
        baseAmount: 1350,
        totalAmount: 1350,
        commissionAmount: 135,
        ownerAmount: 1215,
        status: 'checked_out',
        paymentStatus: 'paid',
        checkInOTP: '741258',
        isOtpVerified: true,
        checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
        guests: [{ name: 'Jemision', age: 28 }],
        review: {
          rating: 5,
          comment: 'Absolute paradise! The heritage suites are gorgeous, private pools are clean, and the staff treats you like royalty. Highly recommended!',
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9)
        }
      },
      {
        customer: customer._id,
        property: insertedProperties[2]._id,
        room: insertedRooms[3]._id,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        baseAmount: 750,
        totalAmount: 750,
        commissionAmount: 75,
        ownerAmount: 675,
        status: 'checked_out',
        paymentStatus: 'paid',
        checkInOTP: '159753',
        isOtpVerified: true,
        checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        checkedOutAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        guests: [{ name: 'Jemision', age: 28 }],
        review: {
          rating: 3,
          comment: 'Affordable co-living space. Proximity to MG road is great, and high-speed wifi is good for work. Food was average.',
          reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
        }
      }
    ];
    await Booking.insertMany(reviewsBookings);
    console.log('Bookings with Reviews Seeded successfully!');

    // Recompute property average ratings based on reviews
    for (const prop of insertedProperties) {
      const allB = reviewsBookings.filter(b => b.property.toString() === prop._id.toString());
      if (allB.length > 0) {
        const sum = allB.reduce((acc, b) => acc + b.review.rating, 0);
        const avg = Math.round((sum / allB.length) * 10) / 10;
        await Property.findByIdAndUpdate(prop._id, { starRating: avg });
        console.log(`Recomputed rating for ${prop.name}: ${avg}`);
      }
    }


  } catch (error) {
    console.error('Database seeding failed:', error.message);
  }
};

module.exports = seedData;
