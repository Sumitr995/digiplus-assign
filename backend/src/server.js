require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db.config');

const PORT = parseInt(process.env.PORT, 10) || 4000;

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;