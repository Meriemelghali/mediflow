require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 8086;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Notification Service is running 🚀' });
});

const start = async () => {
  await connectDB();           // ← se connecte à MongoDB d'abord
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
};

start();