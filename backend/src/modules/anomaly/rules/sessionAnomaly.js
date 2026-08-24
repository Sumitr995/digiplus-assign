const config = require('../../../config/rules.config');

const CODE_MULTI_IP = 'SESSION_ANOMALY';
const CODE_HIGH_VOLUME = 'SESSION_ANOMALY';

function evaluate(allEntries, _context) {
  const results = [];

  const sessionIPs = {};
  const sessionCounts = {};

  for (const entry of allEntries) {
    const sid = entry.sessionId;
    if (!sessionIPs[sid]) sessionIPs[sid] = new Set();
    sessionIPs[sid].add(entry.source);
    sessionCounts[sid] = (sessionCounts[sid] || 0) + 1;
  }

  for (const [sid, ips] of Object.entries(sessionIPs)) {
    if (ips.size > 1) {
      const matched = allEntries.filter(e => e.sessionId === sid);
      for (const entry of matched) {
        results.push({
          logEntry: entry,
          score: 90,
          code: CODE_MULTI_IP,
          summary: `Session ${sid} spans ${ips.size} different IP addresses`,
          hardFlag: true,
        });
      }
    }
  }

  const counts = Object.values(sessionCounts);
  counts.sort((a, b) => a - b);
  const p99Idx = Math.ceil(config.SESSION_VOLUME_PERCENTILE * counts.length) - 1;
  const p99 = counts[p99Idx] || 0;

  if (p99 > 0) {
    for (const [sid, count] of Object.entries(sessionCounts)) {
      if (count >= p99) {
        const score = Math.min(100, (count / p99) * 60);
        const matched = allEntries.filter(e => e.sessionId === sid);
        for (const entry of matched) {
          if (results.find(r => r.logEntry === entry && r.summary.includes('spans'))) continue;
          results.push({
            logEntry: entry,
            score: Math.round(score * 100) / 100,
            code: CODE_HIGH_VOLUME,
            summary: `Session ${sid} has ${count} requests (>= p99 threshold of ${p99})`,
            hardFlag: false,
          });
        }
      }
    }
  }

  return results;
}

module.exports = { code: 'SESSION_ANOMALY', evaluate };