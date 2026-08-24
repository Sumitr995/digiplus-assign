const { Router } = require('express');
const mongoose = require('mongoose');

const router = Router();

router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'ok',
    db: dbStatus[dbState] || 'unknown',
  });
});

module.exports = router;