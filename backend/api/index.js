// Vercel serverless entry - DB is cached via global.mongoose in db.config.js
// dotenv only for local dev, ignore if env already injected by Vercel
if (!process.env.VERCEL) {
  try {
    require('dotenv').config();
  } catch (_) {}
}
const app = require('../src/app');
const { connectDB } = require('../src/config/db.config');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed (serverless):', err.message);
    // Return JSON error instead of silently failing and hitting timeout
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'DB_CONNECTION_FAILED',
        message: err.message,
        hint: 'Check MONGODB_URI + Atlas Network Access (IP allowlist 0.0.0.0/0)',
      });
    }
    return;
  }
  return app(req, res);
};
