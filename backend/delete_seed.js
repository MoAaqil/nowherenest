const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://nowherenest:nowherenest@cluster0.l5yzqz3.mongodb.net/nowherenest?appName=Cluster0';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected to remote MongoDB Atlas for cleanup');
  const db = mongoose.connection.db;

  // 1. Define IDs and emails of seeded records to delete
  const seededUserEmails = [
    'owner@nowherenest.com',
    'customer@nowherenest.com',
    'staff@nowherenest.com',
    'admin@nowherenest.com'
  ];

  const seededPropertyNames = [
    'Bail Exotica Cottage & Resort',
    'Taj Kumarakom Resort & Spa',
    '11 Green Bank PG & Co-living'
  ];

  const seededListingTitles = [
    'Bail Exotica Cottage',
    'Taj Kumarakom Resort & Spa',
    '11 Green Bank PG & Co-living'
  ];

  // 2. Fetch seeded user IDs
  const seededUsers = await db.collection('users').find({ email: { $in: seededUserEmails } }).toArray();
  const seededUserIds = seededUsers.map(u => u._id);

  // 3. Fetch seeded property IDs
  const seededProperties = await db.collection('properties').find({ name: { $in: seededPropertyNames } }).toArray();
  const seededPropertyIds = seededProperties.map(p => p._id);

  console.log(`Found ${seededUsers.length} seeded users and ${seededProperties.length} seeded properties.`);

  // 4. Perform deletions
  // Delete bookings associated with seeded properties or seeded customers
  const bookingsDelete = await db.collection('bookings').deleteMany({
    $or: [
      { property: { $in: seededPropertyIds } },
      { customer: { $in: seededUserIds } }
    ]
  });
  console.log(`Deleted ${bookingsDelete.deletedCount} bookings.`);

  // Delete rooms associated with seeded properties
  const roomsDelete = await db.collection('rooms').deleteMany({
    property: { $in: seededPropertyIds }
  });
  console.log(`Deleted ${roomsDelete.deletedCount} rooms.`);

  // Delete coupons associated with seeded properties
  const couponsDelete = await db.collection('coupons').deleteMany({
    property: { $in: seededPropertyIds }
  });
  console.log(`Deleted ${couponsDelete.deletedCount} coupons.`);

  // Delete staff assignments associated with seeded properties
  const staffDelete = await db.collection('staffs').deleteMany({
    property: { $in: seededPropertyIds }
  });
  console.log(`Deleted ${staffDelete.deletedCount} staff records.`);

  // Delete housekeeping tasks associated with seeded properties
  const hkDelete = await db.collection('housekeepings').deleteMany({
    property: { $in: seededPropertyIds }
  });
  console.log(`Deleted ${hkDelete.deletedCount} housekeeping records.`);

  // Delete properties
  const propertiesDelete = await db.collection('properties').deleteMany({
    _id: { $in: seededPropertyIds }
  });
  console.log(`Deleted ${propertiesDelete.deletedCount} properties.`);

  // Delete listings
  const listingsDelete = await db.collection('listings').deleteMany({
    $or: [
      { title: { $in: seededListingTitles } },
      { owner: { $in: seededUserIds } }
    ]
  });
  console.log(`Deleted ${listingsDelete.deletedCount} legacy listings.`);

  // Delete users
  const usersDelete = await db.collection('users').deleteMany({
    _id: { $in: seededUserIds }
  });
  console.log(`Deleted ${usersDelete.deletedCount} users.`);

  console.log('Cleanup completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
