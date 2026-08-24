const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Simple CORS - allow prod frontend + localhost (prod first)
app.use(cors({
  origin: true, // allow any origin, simplest for Vercel
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json(err.body || { error: 'INTERNAL_ERROR', message: err.message || 'Error' });
});

module.exports = app;
