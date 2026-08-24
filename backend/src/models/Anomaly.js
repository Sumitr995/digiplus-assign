const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  logEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LogEntry', required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  reasonCodes: { type: [String], default: [] },
  reasonSummary: { type: String, default: '' },
  ruleVersion: { type: String, default: '1.0' },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

module.exports = mongoose.model('Anomaly', anomalySchema);