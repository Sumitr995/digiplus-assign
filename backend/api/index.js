require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/db.config');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('MongoDB connected (serverless)');
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
    }
  }
  return app(req, res);
};
