const { Router } = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const LogEntry = require('../models/LogEntry');
const Anomaly = require('../models/Anomaly');
const { validateRow, normalizeRow } = require('../modules/validator');
const anomalyEngine = require('../modules/anomaly/engine');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const LogEntryModel = LogEntry;

async function processRows(rawRows) {
  const rejected = [];
  const valid = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const errs = validateRow(row, i);
    if (errs) {
      rejected.push({ row: i + 1, reason: errs.join('; ') });
    } else {
      valid.push(normalizeRow(row));
    }
  }

  if (valid.length === 0) {
    throw Object.assign(new Error('Dataset contains no valid rows'), { statusCode: 422, body: { error: 'EMPTY_DATASET', message: 'No valid log entries found in input' } });
  }

  const entries = await LogEntryModel.insertMany(valid);

  const flagged = anomalyEngine.run(entries);

  const anomalyDocs = flagged.map(f => ({
    logEntryId: f.logEntry._id,
    score: f.score,
    reasonCodes: f.reasonCodes,
    reasonSummary: f.reasonSummary,
    ruleVersion: '1.0',
  }));

  if (anomalyDocs.length > 0) {
    await Anomaly.insertMany(anomalyDocs);
  }

  await LogEntryModel.updateMany(
    { _id: { $in: flagged.map(f => f.logEntry._id) } },
    { $set: { flagged: true } }
  );

  return {
    totalRows: rawRows.length,
    ingested: valid.length,
    rejected: rejected.length,
    rejectedReasons: rejected,
    flagged: flagged.length,
  };
}

router.post('/ingest', upload.single('file'), async (req, res, next) => {
  try {
    let rawRows;

    if (req.file) {
      const csvText = req.file.buffer.toString('utf-8');
      rawRows = parse(csvText, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
    } else if (req.body && Array.isArray(req.body)) {
      rawRows = req.body;
    } else if (req.body && req.body.rows && Array.isArray(req.body.rows)) {
      rawRows = req.body.rows;
    } else {
      return res.status(422).json({ error: 'EMPTY_DATASET', message: 'No CSV file or JSON array provided' });
    }

    if (!rawRows || rawRows.length === 0) {
      return res.status(422).json({ error: 'EMPTY_DATASET', message: 'Input is empty after parsing' });
    }

    const result = await processRows(rawRows);
    res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(err.body);
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'FILE_TOO_LARGE', message: 'File exceeds 50 MB limit' });
    }
    next(err);
  }
});

// GET /api/logs with pagination+filtering
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 25));

    const filter = {};

    if (req.query.flagged !== undefined) {
      if (req.query.flagged === 'true') filter.flagged = true;
      else if (req.query.flagged === 'false') filter.flagged = false;
    }

    if (req.query.severity) {
      const sev = req.query.severity.toString().trim();
      if (['info', 'low', 'medium', 'critical'].includes(sev)) {
        filter.severity = sev;
      }
    }

    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) {
        const d = new Date(req.query.from);
        if (!isNaN(d.getTime())) filter.timestamp.$gte = d;
      }
      if (req.query.to) {
        const d = new Date(req.query.to);
        if (!isNaN(d.getTime())) filter.timestamp.$lte = d;
      }
      if (Object.keys(filter.timestamp).length === 0) delete filter.timestamp;
    }

    if (req.query.q) {
      const q = req.query.q.toString().trim();
      if (q) {
        const regex = { $regex: q, $options: 'i' };
        filter.$or = [{ source: regex }, { location: regex }];
      }
    }

    const total = await LogEntryModel.countDocuments(filter);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const docs = await LogEntryModel.find(filter)
      .sort({ timestamp: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const items = docs.map(d => {
      const { _id, __v, ...rest } = d;
      return {
        id: _id.toString(),
        ...rest,
        timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : undefined,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
      };
    });

    res.json({ items, page, pageSize, total, totalPages });
  } catch (err) {
    next(err);
  }
});

// GET /api/logs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Log entry not found' });
    }
    const doc = await LogEntryModel.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Log entry not found' });
    }
    const { _id, __v, ...rest } = doc;
    const dto = {
      id: _id.toString(),
      ...rest,
      timestamp: doc.timestamp ? new Date(doc.timestamp).toISOString() : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
    res.json(dto);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
