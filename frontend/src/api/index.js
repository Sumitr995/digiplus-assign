const PROD_API = 'https://digiplus-assign-drds.vercel.app/api';
const LOCAL_API = 'http://localhost:4000/api';
const PRIMARY = import.meta.env.VITE_API_BASE_URL || PROD_API;
const FALLBACK = LOCAL_API;

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const isForm = options.body instanceof FormData;
  if (!isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (isForm && headers['Content-Type']) delete headers['Content-Type'];

  const tryFetch = async (base) => {
    const res = await fetch(`${base}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw { status: res.status, ...body };
    }
    return res.json();
  };

  try {
    return await tryFetch(PRIMARY);
  } catch (err) {
    // if prod fails (network or 5xx), try localhost
    const isNetwork = !err.status;
    const isServer = err.status >= 500;
    if ((isNetwork || isServer) && PRIMARY !== FALLBACK) {
      console.warn(`Prod failed, retry localhost:`, err.message || err);
      return await tryFetch(FALLBACK);
    }
    throw err;
  }
}

export const ingestLogs = (file) => {
  const f = new FormData(); f.append('file', file);
  return request('/logs/ingest', { method: 'POST', body: f });
};
export const getLogs = (p={}) => request(`/logs?${new URLSearchParams(p)}`);
export const getLogById = (id) => request(`/logs/${id}`);
export const getAnomalies = (p={}) => request(`/anomalies?${new URLSearchParams(p)}`);
export const getAnomalyById = (id) => request(`/anomalies/${id}`);
export const explainAnomaly = (id, force=false) => request(`/anomalies/${id}/explain`, { method:'POST', body: JSON.stringify({ force }) });
export const getStatsSummary = () => request('/stats/summary');
