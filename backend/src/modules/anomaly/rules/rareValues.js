const config = require('../../../config/rules.config');

const CODE_LOCATION = 'RARE_LOCATION';
const CODE_AGENT = 'RARE_USER_AGENT';

function evaluate(allEntries, _context) {
  const total = allEntries.length;
  const threshold = config.RARITY_THRESHOLD;
  const results = [];

  const locCounts = {};
  const agentCounts = {};

  for (const entry of allEntries) {
    locCounts[entry.location] = (locCounts[entry.location] || 0) + 1;
    agentCounts[entry.userAgent] = (agentCounts[entry.userAgent] || 0) + 1;
  }

  for (const entry of allEntries) {
    const locFreq = locCounts[entry.location] / total;
    if (locFreq < threshold) {
      const score = Math.min(100, Math.max(40, 100 * (1 - locFreq / threshold)));
      const idStr = `${entry._id || entry.id || ''}_LOC`;
      if (!results.find(r => r._dedupKey === idStr)) {
        results.push({
          logEntry: entry,
          score: Math.round(score * 100) / 100,
          code: CODE_LOCATION,
          summary: `Location "${entry.location}" appears ${locCounts[entry.location]} times (${(locFreq * 100).toFixed(2)}% of total)`,
          hardFlag: false,
          _dedupKey: idStr,
        });
      }
    }

    const agentFreq = agentCounts[entry.userAgent] / total;
    if (agentFreq < threshold) {
      const score = Math.min(100, Math.max(40, 100 * (1 - agentFreq / threshold)));
      const idStr = `${entry._id || entry.id || ''}_AGENT`;
      if (!results.find(r => r._dedupKey === idStr)) {
        results.push({
          logEntry: entry,
          score: Math.round(score * 100) / 100,
          code: CODE_AGENT,
          summary: `UserAgent "${entry.userAgent}" appears ${agentCounts[entry.userAgent]} times (${(agentFreq * 100).toFixed(2)}% of total)`,
          hardFlag: false,
          _dedupKey: idStr,
        });
      }
    }
  }

  return results;
}

module.exports = { code: 'RARE_VALUES', evaluate };