if (!process.env.VERCEL) {
  try { require('dotenv').config(); } catch {}
}
const app = require('../src/app');
const { connectDB } = require('../src/config/db.config');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (e) {
    console.error('DB failed', e.message);
    if (!res.headersSent) return res.status(500).json({ error: 'DB_CONNECTION_FAILED', message: e.message });
    return;
  }
  return app(req, res);
};
