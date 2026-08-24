const mongoose = require('mongoose');

const severityFromStatus = (code) => {
  switch (code) {
    case 500: return 'critical';
    case 403:
    case 404: return 'medium';
    case 301: return 'low';
    case 200: return 'info';
    default: return 'info';
  }
};

const logEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  source: { type: String, required: true },
  eventType: { type: String, required: true, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
  severity: { type: String, required: true, enum: ['info', 'low', 'medium', 'critical'] },
  statusCode: { type: Number, required: true },
  userAgent: { type: String, required: true },
  sessionId: { type: String, required: true },
  location: { type: String, required: true },
  flagged: { type: Boolean, default: false },
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

logEntrySchema.statics.deriveSeverity = severityFromStatus;

module.exports = mongoose.model('LogEntry', logEntrySchema);