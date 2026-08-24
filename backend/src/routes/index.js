const { Router } = require('express');

const health = require('./health');
const logs = require('./logs');
const anomalies = require('./anomalies');
const stats = require('./stats');

const router = Router();

router.use('/health', health);
router.use('/logs', logs);
router.use('/anomalies', anomalies);
router.use('/stats', stats);

module.exports = router;