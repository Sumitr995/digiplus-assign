const { Router } = require('express');
const LogEntry = require('../models/LogEntry');
const Anomaly = require('../models/Anomaly');

const router = Router();

router.get('/summary', async (_req, res, next) => {
  try {
    const totalLogs = await LogEntry.countDocuments();
    const totalFlagged = await LogEntry.countDocuments({ flagged: true });

    const bySeverityAgg = await LogEntry.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const bySeverity = {};
    for (const r of bySeverityAgg) {
      bySeverity[r._id] = r.count;
    }

    const byReasonCodeAgg = await Anomaly.aggregate([
      { $unwind: '$reasonCodes' },
      { $group: { _id: '$reasonCodes', count: { $sum: 1 } } },
    ]);
    const byReasonCode = {};
    for (const r of byReasonCodeAgg) {
      byReasonCode[r._id] = r.count;
    }

    const timeRangeAgg = await LogEntry.aggregate([
      { $group: { _id: null, from: { $min: '$timestamp' }, to: { $max: '$timestamp' } } },
    ]);
    let timeRange = { from: null, to: null };
    if (timeRangeAgg.length > 0) {
      timeRange = {
        from: timeRangeAgg[0].from ? new Date(timeRangeAgg[0].from).toISOString() : null,
        to: timeRangeAgg[0].to ? new Date(timeRangeAgg[0].to).toISOString() : null,
      };
    }

    res.json({ totalLogs, totalFlagged, bySeverity, byReasonCode, timeRange });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
