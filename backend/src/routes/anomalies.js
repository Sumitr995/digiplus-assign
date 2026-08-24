const { Router } = require('express');
const mongoose = require('mongoose');
const Anomaly = require('../models/Anomaly');
const LogEntry = require('../models/LogEntry');
const Explanation = require('../models/Explanation');
const { generateExplanation } = require('../modules/ai/aiExplainer');

const router = Router();

function toLogEntryDto(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return { id: _id.toString(), ...rest, timestamp: obj.timestamp ? new Date(obj.timestamp).toISOString() : undefined, createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : undefined, updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : undefined };
}

function toAnomalyDto(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, logEntryId, ...rest } = obj;
  const dto = { id: _id.toString(), logEntryId: logEntryId ? logEntryId.toString() : undefined, ...rest };
  if (obj.createdAt) dto.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) dto.updatedAt = new Date(obj.updatedAt).toISOString();
  delete dto.__v;
  delete dto._id;
  return dto;
}

function toExplanationDto(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, anomalyId, ...rest } = obj;
  const dto = { id: _id.toString(), anomalyId: anomalyId ? anomalyId.toString() : undefined, ...rest };
  if (obj.generatedAt) dto.generatedAt = new Date(obj.generatedAt).toISOString();
  // Ensure model field present
  return dto;
}

// GET /api/anomalies?page&pageSize&minScore&reasonCode&logEntryId
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
    const minScore = req.query.minScore !== undefined ? Number(req.query.minScore) : undefined;
    const reasonCode = req.query.reasonCode ? req.query.reasonCode.toString().trim() : undefined;
    const logEntryId = req.query.logEntryId ? req.query.logEntryId.toString().trim() : undefined;

    const filter = {};
    if (minScore !== undefined && !isNaN(minScore)) {
      filter.score = { $gte: minScore };
    }
    if (reasonCode) {
      filter.reasonCodes = reasonCode;
    }
    if (logEntryId) {
      if (!mongoose.Types.ObjectId.isValid(logEntryId)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid logEntryId' });
      }
      filter.logEntryId = new mongoose.Types.ObjectId(logEntryId);
    }

    const total = await Anomaly.countDocuments(filter);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const anomalies = await Anomaly.find(filter)
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const logEntryIds = anomalies.map(a => a.logEntryId);
    const logEntries = await LogEntry.find({ _id: { $in: logEntryIds } }).lean();
    const logMap = new Map(logEntries.map(l => [l._id.toString(), l]));

    const items = anomalies.map(a => {
      const logEntryRaw = logMap.get(a.logEntryId.toString());
      const logEntry = logEntryRaw ? (() => {
        const { _id, __v, ...rest } = logEntryRaw;
        return { id: _id.toString(), ...rest, timestamp: logEntryRaw.timestamp ? new Date(logEntryRaw.timestamp).toISOString() : undefined, createdAt: logEntryRaw.createdAt ? new Date(logEntryRaw.createdAt).toISOString() : undefined, updatedAt: logEntryRaw.updatedAt ? new Date(logEntryRaw.updatedAt).toISOString() : undefined };
      })() : null;
      const anomalyDto = (() => {
        const { _id, __v, ...rest } = a;
        return { id: _id.toString(), logEntryId: a.logEntryId.toString(), ...rest, createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined, updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined };
      })();
      // remove __v if present
      delete anomalyDto.__v;
      delete logEntry?.__v;
      return { logEntry, anomaly: anomalyDto };
    });

    res.json({ items, page, pageSize, total, totalPages });
  } catch (err) {
    next(err);
  }
});

// GET /api/anomalies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Anomaly not found' });
    }
    const anomaly = await Anomaly.findById(id).lean();
    if (!anomaly) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Anomaly not found' });
    }
    const logEntryRaw = await LogEntry.findById(anomaly.logEntryId).lean();
    if (!logEntryRaw) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Log entry not found for anomaly' });
    }
    const explanationRaw = await Explanation.findOne({ anomalyId: anomaly._id }).lean();

    const anomalyDto = (() => {
      const { _id, __v, ...rest } = anomaly;
      return { id: _id.toString(), logEntryId: anomaly.logEntryId.toString(), ...rest, createdAt: anomaly.createdAt ? new Date(anomaly.createdAt).toISOString() : undefined, updatedAt: anomaly.updatedAt ? new Date(anomaly.updatedAt).toISOString() : undefined };
    })();
    const logEntryDto = (() => {
      const { _id, __v, ...rest } = logEntryRaw;
      return { id: _id.toString(), ...rest, timestamp: logEntryRaw.timestamp ? new Date(logEntryRaw.timestamp).toISOString() : undefined, createdAt: logEntryRaw.createdAt ? new Date(logEntryRaw.createdAt).toISOString() : undefined, updatedAt: logEntryRaw.updatedAt ? new Date(logEntryRaw.updatedAt).toISOString() : undefined };
    })();
    let explanationDto = null;
    if (explanationRaw) {
      const { _id, __v, ...rest } = explanationRaw;
      explanationDto = { id: _id.toString(), anomalyId: explanationRaw.anomalyId.toString(), ...rest, generatedAt: explanationRaw.generatedAt ? new Date(explanationRaw.generatedAt).toISOString() : undefined };
      delete explanationDto.__v;
    }

    res.json({ anomaly: anomalyDto, logEntry: logEntryDto, explanation: explanationDto });
  } catch (err) {
    next(err);
  }
});

// POST /api/anomalies/:id/explain
router.post('/:id/explain', async (req, res, next) => {
  try {
    const { id } = req.params;
    const force = req.body && req.body.force === true;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Anomaly not found' });
    }
    const anomaly = await Anomaly.findById(id);
    if (!anomaly) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Anomaly not found' });
    }
    const logEntry = await LogEntry.findById(anomaly.logEntryId);
    if (!logEntry) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Log entry not found for anomaly' });
    }

    const existing = await Explanation.findOne({ anomalyId: anomaly._id });
    if (existing && !force) {
      const dto = (() => {
        const obj = existing.toObject();
        const { _id, __v, ...rest } = obj;
        return { id: _id.toString(), anomalyId: obj.anomalyId.toString(), ...rest, generatedAt: obj.generatedAt ? new Date(obj.generatedAt).toISOString() : undefined };
      })();
      return res.json(dto);
    }

    // Build context stats for prompt
    const totalLogs = await LogEntry.countDocuments();
    const contextStats = { totalLogs };

    let result;
    try {
      result = await generateExplanation({
        logEntry: logEntry.toObject(),
        reasonCodes: anomaly.reasonCodes,
        reasonSummary: anomaly.reasonSummary,
        score: anomaly.score,
        contextStats,
      });
    } catch (err) {
      if (err.statusCode === 502) {
        return res.status(502).json(err.body || { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' });
      }
      throw err;
    }

    let explanationDoc;
    if (existing && force) {
      existing.explanation = result.explanation;
      existing.likelyRootCause = result.likelyRootCause;
      existing.recommendedNextStep = result.recommendedNextStep;
      existing.model = result.model;
      existing.generatedAt = new Date();
      await existing.save();
      explanationDoc = existing;
    } else {
      explanationDoc = await Explanation.create({
        anomalyId: anomaly._id,
        explanation: result.explanation,
        likelyRootCause: result.likelyRootCause,
        recommendedNextStep: result.recommendedNextStep,
        model: result.model,
        generatedAt: new Date(),
      });
    }

    const obj = explanationDoc.toObject();
    const { _id, __v, ...rest } = obj;
    const dto = { id: _id.toString(), anomalyId: obj.anomalyId.toString(), ...rest, generatedAt: obj.generatedAt ? new Date(obj.generatedAt).toISOString() : undefined };
    res.json(dto);
  } catch (err) {
    if (err.statusCode === 502) {
      return res.status(502).json(err.body || { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' });
    }
    next(err);
  }
});

module.exports = router;
