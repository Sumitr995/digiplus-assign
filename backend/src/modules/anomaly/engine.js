const config = require('../../config/rules.config');

const rules = [
  require('./rules/rateBurst'),
  require('./rules/errorBurst'),
  require('./rules/rareValues'),
  require('./rules/sessionAnomaly'),
];

function run(entries) {
  const allAnomalies = [];

  for (const rule of rules) {
    try {
      const results = rule.evaluate(entries, {});
      allAnomalies.push(...results);
    } catch (err) {
      console.error(`Rule ${rule.code} failed:`, err.message);
    }
  }

  const flaggedIds = new Set();
  const entryAnomalies = {};

  for (const a of allAnomalies) {
    const entryKey = a.logEntry._id || a.logEntry.id || JSON.stringify(a.logEntry);
    if (!entryAnomalies[entryKey]) entryAnomalies[entryKey] = [];
    entryAnomalies[entryKey].push(a);
  }

  const results = [];
  for (const [entryKey, anomalies] of Object.entries(entryAnomalies)) {
    const entry = anomalies[0].logEntry;
    const scores = anomalies.map(a => a.score);
    const maxScore = Math.max(...scores);
    const otherSum = scores.reduce((s, v) => s + v, 0) - maxScore;
    const finalScore = Math.min(100, maxScore + 0.25 * otherSum);

    const hasHardFlag = anomalies.some(a => a.hardFlag);
    const shouldFlag = hasHardFlag || finalScore >= config.FLAG_THRESHOLD;

    if (shouldFlag) {
      const reasonCodes = [...new Set(anomalies.map(a => a.code))];
      const topReasons = anomalies
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(a => a.summary);

      results.push({
        logEntry: entry,
        score: Math.round(finalScore * 100) / 100,
        reasonCodes,
        reasonSummary: topReasons.join('; '),
      });
    }
  }

  return results;
}

module.exports = { run };