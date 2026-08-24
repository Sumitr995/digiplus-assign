import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getLogById, getAnomalyById, explainAnomaly, getAnomalies } from '../../api';
import './LogDetailPage.css';

export default function LogDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const isAnomalyRoute = location.pathname.startsWith('/anomalies/');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [log, setLog] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLog(null);
    setAnomaly(null);
    setExplanation(null);
    setExplainError(null);
    try {
      if (isAnomalyRoute) {
        const result = await getAnomalyById(id);
        setLog(result.logEntry);
        setAnomaly(result.anomaly);
        setExplanation(result.explanation || null);
      } else {
        const logResult = await getLogById(id);
        setLog(logResult);
        if (logResult.flagged) {
          // Try to find associated anomaly by scanning anomalies list (mock + live fallback)
          try {
            // Fetch first page, if not found iterate few pages
            let found = null;
            let page = 1;
            const maxPagesToScan = 5;
            for (; page <= maxPagesToScan; page++) {
              const res = await getAnomalies({ page, pageSize: 100 });
              const match = res.items.find((it) => it.logEntry && it.logEntry.id === logResult.id);
              if (match) {
                found = match;
                break;
              }
              if (page >= res.totalPages) break;
            }
            if (found) {
              setAnomaly(found.anomaly);
              // Try to fetch full anomaly detail to get explanation
              try {
                const detail = await getAnomalyById(found.anomaly.id);
                if (detail.explanation) setExplanation(detail.explanation);
              } catch {
                // ignore – explanation may be null
              }
            }
          } catch {
            // non-fatal: anomaly lookup failed
          }
        }
      }
    } catch (err) {
      const msg = err.message || err.error || 'Failed to load detail';
      const code = err.error ? `${err.error}: ${msg}` : msg;
      setError({ status: err.status, message: code, raw: err });
    } finally {
      setLoading(false);
    }
  }, [id, isAnomalyRoute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExplain = async (force = false) => {
    if (!anomaly) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const result = await explainAnomaly(anomaly.id, force);
      setExplanation(result);
    } catch (err) {
      const is502 = err.status === 502 || err.error === 'AI_PROVIDER_ERROR';
      const msg = err.message || err.error || 'Explanation generation failed';
      setExplainError({
        status: err.status,
        is502,
        message: is502 ? 'AI provider failed. Please retry.' : msg,
        raw: err,
      });
    } finally {
      setExplainLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Loading detail...</span>
      </div>
    );
  }

  if (error) {
    const is404 = error.status === 404;
    return (
      <div>
        <Link to="/logs" className="back-link">&larr; Back to Logs</Link>
        <div className="error-box" role="alert">
          <div>
            <strong>{is404 ? 'Not found' : 'Error'}</strong>
            <p>{error.message}</p>
            {is404 && <p>The requested {isAnomalyRoute ? 'anomaly' : 'log entry'} does not exist.</p>}
          </div>
          <button onClick={fetchData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div>
        <Link to="/logs" className="back-link">&larr; Back to Logs</Link>
        <div className="error-box" role="alert">Log not found</div>
      </div>
    );
  }

  const fields = [
    ['ID', log.id],
    ['Timestamp', log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'],
    ['Source', log.source],
    ['Event Type', log.eventType],
    ['Severity', <span key="sev" className={`badge badge-${log.severity}`}>{log.severity}</span>],
    ['Status Code', String(log.statusCode)],
    ['User Agent', log.userAgent],
    ['Session ID', log.sessionId],
    ['Location', log.location],
    ['Flagged', log.flagged ? <span className="badge badge-flagged">Yes</span> : 'No'],
    ['Created At', log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'],
  ];

  return (
    <div className="detail-page">
      <Link to="/logs" className="back-link">&larr; Back to Logs</Link>

      <section className="card detail-card" aria-labelledby="detail-heading">
        <h2 id="detail-heading">{isAnomalyRoute ? 'Anomaly Detail' : 'Log Detail'}</h2>
        {isAnomalyRoute && anomaly && (
          <p className="detail-subtitle">Anomaly {anomaly.id} for log {log.id}</p>
        )}
        <dl className="detail-grid">
          {fields.map(([label, value]) => (
            <div key={label} className="detail-field">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {log.flagged && (
        <section className="card anomaly-card" aria-labelledby="anomaly-heading">
          <h3 id="anomaly-heading">Anomaly Analysis</h3>
          {!anomaly ? (
            <div className="anomaly-empty">
              <p>This log is flagged but no anomaly record was found in the sampled pages.</p>
              <p className="hint">Try viewing via the anomaly ID if you navigated from the log list, or check the Anomalies endpoint.</p>
            </div>
          ) : (
            <>
              <div className="anomaly-meta">
                <div className="anomaly-score">
                  <span className="anomaly-label">Score</span>
                  <span className="badge badge-critical" style={{ fontSize: 16, padding: '4px 10px' }}>{anomaly.score}</span>
                </div>
                <div className="anomaly-codes">
                  <span className="anomaly-label">Reason Codes</span>
                  <div className="reason-codes">
                    {anomaly.reasonCodes.map((code) => (
                      <span key={code} className="reason-code">{code}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="reason-summary">
                <span className="anomaly-label">Deterministic Summary</span>
                <p>{anomaly.reasonSummary}</p>
              </div>
              <div className="anomaly-meta-secondary">
                <span>Rule version: {anomaly.ruleVersion}</span>
                <span>Anomaly ID: {anomaly.id}</span>
              </div>
            </>
          )}
        </section>
      )}

      {anomaly && (
        <section className="card ai-panel" aria-labelledby="ai-heading">
          <div className="ai-header">
            <h3 id="ai-heading">AI Explanation</h3>
            <div className="ai-actions">
              <button
                onClick={() => handleExplain(false)}
                disabled={explainLoading}
                aria-busy={explainLoading}
                className="explain-btn"
              >
                {explanation ? 'Regenerate' : 'Generate Explanation'}
              </button>
              {explanation && (
                <button
                  onClick={() => handleExplain(true)}
                  disabled={explainLoading}
                  className="explain-btn explain-btn--secondary"
                  title="Force regenerate"
                >
                  Force Regenerate
                </button>
              )}
            </div>
          </div>

          {explainLoading && (
            <div className="loading loading--inline" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <span>Generating explanation...</span>
            </div>
          )}

          {explainError && !explainLoading && (
            <div className="error-box" role="alert">
              <div>
                <strong>{explainError.is502 ? 'AI Provider Error (502)' : 'Generation Failed'}</strong>
                <p>{explainError.message}</p>
                {explainError.raw?.error && <p className="error-code">Code: {explainError.raw.error}</p>}
              </div>
              <button onClick={() => handleExplain(false)} className="retry-btn">Retry</button>
            </div>
          )}

          {!explainLoading && !explainError && !explanation && (
            <div className="empty-state empty-state--inline">
              <p>No explanation generated yet.</p>
              <p className="hint">Click Generate to create an AI-powered analysis of this anomaly.</p>
            </div>
          )}

          {!explainLoading && explanation && (
            <div className="explanation-content">
              <div className="explanation-field">
                <h4>Explanation</h4>
                <p>{explanation.explanation}</p>
              </div>
              <div className="explanation-field">
                <h4>Likely Root Cause</h4>
                <p>{explanation.likelyRootCause}</p>
              </div>
              <div className="explanation-field">
                <h4>Recommended Next Step</h4>
                <p>{explanation.recommendedNextStep}</p>
              </div>
              <div className="explanation-meta">
                <span>Model: {explanation.model}</span>
                <span>Generated: {explanation.generatedAt ? new Date(explanation.generatedAt).toLocaleString() : '-'}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {!log.flagged && (
        <section className="card" aria-label="No anomaly">
          <p style={{ color: '#6b7280' }}>This log entry is not flagged as anomalous. No anomaly or AI explanation is available.</p>
        </section>
      )}
    </div>
  );
}
