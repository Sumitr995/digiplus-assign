import { LOGS, ANOMALIES, EXPLANATIONS } from './mock.js';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Use mock only in DEV when no explicit API base is configured.
// This allows `VITE_API_BASE_URL=http://localhost:4000/api npm run dev` to hit live backend.
const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }
  const res = await fetch(url, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, ...body };
  }
  return res.json();
}

export async function ingestLogs(file) {
  if (USE_MOCK) {
    const totalRows = 55;
    const flagged = ANOMALIES.length;
    return {
      totalRows,
      ingested: totalRows,
      rejected: 0,
      rejectedReasons: [],
      flagged,
    };
  }
  const form = new FormData();
  form.append('file', file);
  return request('/logs/ingest', { method: 'POST', body: form });
}

export async function getLogs(params = {}) {
  if (USE_MOCK) {
    let items = [...LOGS];
    if (params.flagged !== undefined) items = items.filter((l) => String(l.flagged) === params.flagged);
    if (params.severity) items = items.filter((l) => l.severity === params.severity);
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter((l) => l.source.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
    }
    const fromParam = params.from || params.dateFrom;
    const toParam = params.to || params.dateTo;
    if (fromParam) {
      const from = new Date(fromParam);
      if (!isNaN(from)) items = items.filter((l) => new Date(l.timestamp) >= from);
    }
    if (toParam) {
      const to = new Date(toParam);
      to.setHours(23, 59, 59, 999);
      if (!isNaN(to)) items = items.filter((l) => new Date(l.timestamp) <= to);
    }
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 25;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
    };
  }
  const qs = new URLSearchParams(params).toString();
  return request(`/logs${qs ? `?${qs}` : ''}`);
}

export async function getLogById(id) {
  if (USE_MOCK) {
    const log = LOGS.find((l) => l.id === id);
    if (!log) throw { status: 404, error: 'NOT_FOUND', message: 'Log not found' };
    return log;
  }
  return request(`/logs/${id}`);
}

export async function getAnomalies(params = {}) {
  if (USE_MOCK) {
    let items = ANOMALIES.map((a) => {
      const log = LOGS.find((l) => l.id === a.logEntryId);
      return { anomaly: a, logEntry: log || null };
    });
    if (params.logEntryId) items = items.filter((i) => i.anomaly.logEntryId === params.logEntryId);
    if (params.minScore) items = items.filter((i) => i.anomaly.score >= Number(params.minScore));
    if (params.reasonCode) items = items.filter((i) => i.anomaly.reasonCodes.includes(params.reasonCode));
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 25;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
    };
  }
  const qs = new URLSearchParams(params).toString();
  return request(`/anomalies${qs ? `?${qs}` : ''}`);
}

export async function getAnomalyById(id) {
  if (USE_MOCK) {
    const anomaly = ANOMALIES.find((a) => a.id === id);
    if (!anomaly) throw { status: 404, error: 'NOT_FOUND', message: 'Anomaly not found' };
    const log = LOGS.find((l) => l.id === anomaly.logEntryId);
    const explanation = EXPLANATIONS.find((e) => e.anomalyId === id) || null;
    return { anomaly, logEntry: log || null, explanation };
  }
  return request(`/anomalies/${id}`);
}

export async function explainAnomaly(id, force = false) {
  if (USE_MOCK) {
    const existing = EXPLANATIONS.find((e) => e.anomalyId === id);
    const anomaly = ANOMALIES.find((a) => a.id === id);
    if (!anomaly) throw { status: 404, error: 'NOT_FOUND', message: 'Anomaly not found' };
    if (existing && !force) return existing;
    return {
      id: `expl-${Date.now()}`,
      anomalyId: id,
      explanation: `Regenerated explanation for anomaly ${id}. ${anomaly.reasonSummary}`,
      likelyRootCause: 'Automated scanning or bot activity targeting vulnerable endpoints.',
      recommendedNextStep: 'Block the source IP and add WAF rules to mitigate similar requests.',
      model: 'gpt-4o-mini',
      generatedAt: new Date().toISOString(),
    };
  }
  return request(`/anomalies/${id}/explain`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}

export async function getStatsSummary() {
  if (USE_MOCK) {
    const bySeverity = {};
    for (const sev of ['info', 'low', 'medium', 'critical']) {
      bySeverity[sev] = LOGS.filter((l) => l.severity === sev).length;
    }
    const byReasonCode = {};
    for (const a of ANOMALIES) {
      for (const code of a.reasonCodes) {
        byReasonCode[code] = (byReasonCode[code] || 0) + 1;
      }
    }
    return {
      totalLogs: LOGS.length,
      totalFlagged: ANOMALIES.length,
      bySeverity,
      byReasonCode,
      timeRange: {
        from: LOGS[0]?.timestamp || '2023-01-01T00:00:00Z',
        to: LOGS[LOGS.length - 1]?.timestamp || '2023-01-01T00:00:00Z',
      },
    };
  }
  return request('/stats/summary');
}