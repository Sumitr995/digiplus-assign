const mongoose = require('mongoose');

const explanationSchema = new mongoose.Schema({
  anomalyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Anomaly', required: true, index: true },
  explanation: { type: String, required: true },
  likelyRootCause: { type: String, default: '' },
  recommendedNextStep: { type: String, default: '' },
  model: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

module.exports = mongoose.model('Explanation', explanationSchema);