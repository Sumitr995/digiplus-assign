const VALID_EVENT_TYPES = new Set(['GET', 'POST', 'PUT', 'DELETE']);
const VALID_STATUS_CODES = new Set([200, 301, 403, 404, 500]);
const VALID_USER_AGENTS = new Set(['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Bot']);
const VALID_LOCATIONS = new Set(['USA', 'China', 'India', 'Brazil', 'Germany', 'France', 'Canada', 'North Korea']);

function validateRow(row, index) {
  const reasons = [];

  if (!row.Timestamp && !row.timestamp) {
    reasons.push('missing timestamp');
  } else {
    const ts = row.Timestamp || row.timestamp;
    const d = new Date(ts);
    if (isNaN(d.getTime())) reasons.push('invalid timestamp');
  }

  if (!row.IP_Address && !row.source) {
    reasons.push('missing IP address');
  }

  const rawEventType = row.Request_Type || row.eventType;
  const eventType = typeof rawEventType === 'string' ? rawEventType.trim() : rawEventType;
  if (!eventType) reasons.push('missing request type');
  else if (!VALID_EVENT_TYPES.has(eventType)) reasons.push(`invalid request type "${eventType}"`);

  const statusCode = row.Status_Code !== undefined ? Number(String(row.Status_Code).trim()) : (row.statusCode !== undefined ? Number(String(row.statusCode).trim()) : undefined);
  if (statusCode === undefined) reasons.push('missing status code');
  else if (isNaN(statusCode) || !VALID_STATUS_CODES.has(statusCode)) reasons.push(`invalid status code "${row.Status_Code || row.statusCode}"`);

  if (!row.User_Agent && !row.userAgent) reasons.push('missing user agent');
  else {
    const uaRaw = row.User_Agent || row.userAgent;
    const ua = typeof uaRaw === 'string' ? uaRaw.trim() : String(uaRaw).trim();
    if (!VALID_USER_AGENTS.has(ua)) reasons.push(`invalid user agent "${ua}"`);
  }

  if (!row.Session_ID && !row.sessionId) reasons.push('missing session ID');

  if (!row.Location && !row.location) reasons.push('missing location');
  else {
    const locRaw = row.Location || row.location;
    const loc = typeof locRaw === 'string' ? locRaw.trim() : String(locRaw).trim();
    if (!VALID_LOCATIONS.has(loc)) reasons.push(`invalid location "${loc}"`);
  }

  return reasons.length > 0 ? reasons : null;
}

function normalizeRow(row) {
  const ts = (row.Timestamp || row.timestamp || '').toString().trim();
  const statusCode = Number(String(row.Status_Code !== undefined ? row.Status_Code : row.statusCode).trim());
  const severityMap = { 500: 'critical', 403: 'medium', 404: 'medium', 301: 'low', 200: 'info' };
  const srcRaw = row.IP_Address || row.source;
  const uaRaw = row.User_Agent || row.userAgent;
  const sessRaw = row.Session_ID !== undefined ? row.Session_ID : row.sessionId;
  const locRaw = row.Location || row.location;
  const evtRaw = row.Request_Type || row.eventType;
  return {
    timestamp: new Date(ts),
    source: typeof srcRaw === 'string' ? srcRaw.trim() : String(srcRaw).trim(),
    eventType: typeof evtRaw === 'string' ? evtRaw.trim() : String(evtRaw).trim(),
    statusCode,
    severity: severityMap[statusCode] || 'info',
    userAgent: typeof uaRaw === 'string' ? uaRaw.trim() : String(uaRaw).trim(),
    sessionId: String(typeof sessRaw === 'string' ? sessRaw.trim() : sessRaw).trim(),
    location: typeof locRaw === 'string' ? locRaw.trim() : String(locRaw).trim(),
  };
}

module.exports = { validateRow, normalizeRow, VALID_EVENT_TYPES, VALID_STATUS_CODES, VALID_USER_AGENTS, VALID_LOCATIONS };