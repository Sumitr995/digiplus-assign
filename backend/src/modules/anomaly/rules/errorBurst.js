const config = require('../../../config/rules.config');

const CODE = 'ERROR_BURST';

function evaluate(allEntries, _context) {
  const windowMs = config.ERROR_BURST_WINDOW_MIN * 60 * 1000;
  const minSample = config.ERROR_BURST_MIN_SAMPLE;
  const errorFraction = config.ERROR_BURST_FRACTION;
  const results = [];

  const ipGroups = {};
  for (const entry of allEntries) {
    const ip = entry.source;
    if (!ipGroups[ip]) ipGroups[ip] = [];
    ipGroups[ip].push(entry);
  }

  for (const [ip, entries] of Object.entries(ipGroups)) {
    const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = new Date(sorted[i].timestamp).getTime();
      const windowEnd = windowStart + windowMs;
      const windowed = [];
      for (let j = i; j < sorted.length; j++) {
        const ts = new Date(sorted[j].timestamp).getTime();
        if (ts <= windowEnd) windowed.push(sorted[j]);
        else break;
      }
      if (windowed.length < minSample) continue;
      const errorCount = windowed.filter(e => e.statusCode >= 400).length;
      const fraction = errorCount / windowed.length;
      if (fraction >= errorFraction) {
        const score = fraction * 70;
        for (const entry of windowed) {
          results.push({
            logEntry: entry,
            score: Math.round(score * 100) / 100,
            code: CODE,
            summary: `IP ${ip} had ${errorCount}/${windowed.length} error requests in a ${config.ERROR_BURST_WINDOW_MIN}-minute window`,
            hardFlag: false,
          });
        }
        break;
      }
    }
  }

  return results;
}

module.exports = { code: CODE, evaluate };
