const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

const rawOrigins = [process.env.CORS_ORIGINS, process.env.PROD_URL, process.env.FRONTEND_URL, process.env.DEV_URL]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Allow exact origins + any vercel preview deployment automatically
const allowedOrigins = rawOrigins;
const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin: (origin, cb) => {
    // No origin (curl, health checks, serverless) -> allow
    if (!origin) return cb(null, true);
    // If no allowlist configured, allow all (safe fallback for Vercel if env missing)
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (vercelPreviewRegex.test(origin)) return cb(null, true);
    // Fail soft: do NOT throw, just deny CORS (browser will block, but we return proper headers)
    return cb(null, false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// handle preflight for all routes - use '/*' not '*' (Express 5 / path-to-regexp compat)
app.options('/*', cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  // CORS errors surface here if we ever use cb(new Error(...))
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: 'CORS_FORBIDDEN', message: err.message });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json(err.body || { error: 'UNKNOWN', message: err.message });
  }
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

module.exports = app;