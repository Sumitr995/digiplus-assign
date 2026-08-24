const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'https://digiplus-assign-frontend.vercel.app,https://digiplus-assign-drds.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:4000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return cb(null, true);
      return cb(null, true); // allow all, log for debugging
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);
app.options('*', cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err.statusCode) {
    return res.status(err.statusCode).json(err.body || { error: 'UNKNOWN', message: err.message });
  }
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

module.exports = app;