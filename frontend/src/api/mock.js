const countries = [
  'Brazil', 'China', 'France', 'Germany', 'India', 'Canada', 'USA', 'North Korea',
];

const userAgents = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Bot'];

const eventTypes = ['GET', 'POST', 'PUT', 'DELETE'];

const severities = ['info', 'low', 'medium', 'critical'];

const sources = [
  '202.118.116.11', '38.30.40.178', '209.5.148.15', '211.116.60.71',
  '170.166.36.145', '147.178.175.124', '185.82.155.197', '141.123.71.55',
  '40.83.200.82', '177.220.98.191', '123.155.87.205', '46.140.242.46',
  '188.12.135.72', '76.73.42.216', '173.46.159.172', '19.246.46.181',
  '4.4.190.187', '22.61.238.44', '7.195.87.63', '94.122.137.2',
  '228.119.208.58', '232.247.210.7', '155.44.197.16', '128.203.15.135',
  '194.122.185.22', '2.99.58.11', '84.142.16.44', '72.134.175.94',
  '205.235.130.80', '28.102.140.226',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function randomTimestamp(index) {
  const day = 1 + Math.floor(index / 200);
  const hour = Math.floor((index % 200) / 8) % 24;
  const minute = (index * 3) % 60;
  const second = (index * 7) % 60;
  return `2023-01-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`;
}

function severityFromStatus(code) {
  if (code >= 500) return 'critical';
  if (code === 403 || code === 404) return 'medium';
  if (code >= 300) return 'low';
  return 'info';
}

const statusCodes = [200, 301, 403, 404, 500];

function generateLogs(count) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const statusCode = statusCodes[i % statusCodes.length];
    const sev = severityFromStatus(statusCode);
    const flagged = sev === 'critical' || (sev === 'medium' && Math.random() > 0.7);
    logs.push({
      id: `log-${i + 1}`,
      timestamp: randomTimestamp(i),
      source: sources[i % sources.length],
      eventType: eventTypes[i % eventTypes.length],
      severity: sev,
      statusCode,
      userAgent: userAgents[i % userAgents.length],
      sessionId: String(1000 + (i % 4000)),
      location: countries[i % countries.length],
      flagged,
      createdAt: randomTimestamp(i),
    });
  }
  return logs;
}

const LOGS = generateLogs(55);
const ANOMALIES = LOGS.filter((l) => l.flagged).map((log, i) => ({
  id: `anom-${i + 1}`,
  logEntryId: log.id,
  score: Math.round(50 + Math.random() * 50),
  reasonCodes: ['HIGH_SEVERITY', 'SUSPICIOUS_SOURCE', 'RAPID_FIRE'].slice(0, 1 + (i % 3)),
  reasonSummary: `Anomalous ${log.eventType} request from ${log.location} with status ${log.statusCode}`,
  ruleVersion: 'v1.0.0',
  createdAt: log.createdAt,
}));

const EXPLANATIONS = ANOMALIES.slice(0, 3).map((anom, i) => ({
  id: `expl-${i + 1}`,
  anomalyId: anom.id,
  explanation: `This ${anom.reasonSummary}. The request originated from a known suspicious range and exhibited behavior consistent with automated scanning.`,
  likelyRootCause: 'Automated scanning or bot activity targeting vulnerable endpoints.',
  recommendedNextStep: 'Block the source IP and add WAF rules to mitigate similar requests.',
  model: 'gpt-4o-mini',
  generatedAt: anom.createdAt,
}));

export { LOGS, ANOMALIES, EXPLANATIONS };