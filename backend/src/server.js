const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  const seedData = require('./config/seed');
  seedData();
});

// Start Server listening
const server = app.listen(PORT, () => {
  console.log(`Nowhere Nest API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

const socketIo = require('socket.io');
const io = socketIo(server, {
  cors: { origin: '*' }
});

const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('join_booking_room', (bookingId) => {
    socket.join(bookingId);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = await Message.create({
        booking: data.bookingId,
        sender: data.senderId,
        senderRole: data.senderRole,
        text: data.text
      });
      // broadcast to everyone in the room including sender (for confirmation)
      io.to(data.bookingId).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

app.set('io', io);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
