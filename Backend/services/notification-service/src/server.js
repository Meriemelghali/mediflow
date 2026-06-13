require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 8086;

app.use(cors());
app.use(express.json());

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Notification Service is running 🚀' });
});

const start = async () => {
  await connectDB();           // ← se connecte à MongoDB d'abord
  
  // Connect to RabbitMQ to start listening for events
  const rabbitMQService = require('./utils/rabbitmq');
  await rabbitMQService.connect();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

start();