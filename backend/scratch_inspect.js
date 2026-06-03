const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://nowherenest:nowherenest@cluster0.l5yzqz3.mongodb.net/nowherenest?appName=Cluster0';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected to remote MongoDB Atlas');
  const db = mongoose.connection.db;
  
  const properties = await db.collection('properties').find({}).toArray();
  const bookings = await db.collection('bookings').find({}).toArray();
  const users = await db.collection('users').find({}).toArray();
  
  console.log('--- PROPERTIES ---');
  properties.forEach(p => {
    console.log(`ID: ${p._id}, Name: ${p.name}, Status: ${p.status}, Owner: ${p.owner}`);
  });
  
  console.log('\n--- BOOKINGS ---');
  bookings.forEach(b => {
    console.log(`ID: ${b._id}, Customer: ${b.customer}, Property: ${b.property}, Status: ${b.status}, Amount: ${b.totalAmount}`);
  });
  
  console.log('\n--- USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`);
  });
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
