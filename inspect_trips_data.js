const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://nowherenest:nowherenest@cluster0.l5yzqz3.mongodb.net/nowherenest?appName=Cluster0';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB Atlas');
  const db = mongoose.connection.db;
  
  const bookings = await db.collection('bookings').find({}).toArray();
  
  console.log(`Found ${bookings.length} bookings.`);
  bookings.forEach((b, idx) => {
    console.log(`\nBooking #${idx + 1}:`);
    console.log(`ID: ${b._id}`);
    console.log(`Status: ${b.status}`);
    console.log(`Property ID: ${b.property}`);
    console.log(`Room ID: ${b.room}`);
    console.log(`selectedUsps:`, b.selectedUsps);
    console.log(`noteToOwner:`, b.noteToOwner);
  });
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
