import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLogs, getAnomalies, getStatsSummary } from '../../api';
import { useNavigate } from 'react-router-dom';
import './LogListPage.css';

export default function LogListPage() {
  const navigate = useNavigate();
  const [logsData, setLogsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [anomalyMap, setAnomalyMap] = useState({});

  const pageSize = 25;

  const handleFilterChange = (updater) => {
    updater();
    setPage(1);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, pageSize };
      if (severity) params.severity = severity;
      if (flaggedOnly) params.flagged = 'true';
      if (search.trim()) params.q = search.trim();
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const [logsResult, anomaliesResult, statsResult] = await Promise.all([
        getLogs(params),
        getAnomalies({ page: 1, pageSize: 100 }),
        getStatsSummary(),
      ]);

      setLogsData(logsResult);
      setStats(statsResult);

      const map = {};
      for (const { anomaly, logEntry } of anomaliesResult.items) {
        if (logEntry) {
          map[logEntry.id] = anomaly;
        }
      }
      setAnomalyMap(map);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, severity, flaggedOnly, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pageNumbers = useMemo(() => {
    if (!logsData) return [];
    const { page: cur, totalPages } = logsData;
    const pages = [];
    const start = Math.max(1, cur - 2);
    const end = Math.min(totalPages, cur + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [logsData]);

  return (
    <div className="log-list-page">
      <h2>Log Entries</h2>

      {stats && (
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">Total Logs</span>
            <span className="summary-value">{stats.totalLogs}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Flagged</span>
            <span className="summary-value summary-value--flagged">{stats.totalFlagged}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Severity</span>
            <span className="summary-badges">
              {Object.entries(stats.bySeverity).map(([sev, count]) => (
                <span key={sev} className={`badge badge-${sev}`}>
                  {sev}: {count}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="sev-filter">Severity</label>
            <select
              id="sev-filter"
              value={severity}
              onChange={(e) => handleFilterChange(() => setSeverity(e.target.value))}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-from">From</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange(() => setDateFrom(e.target.value))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="date-to">To</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange(() => setDateTo(e.target.value))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="search-input">Search</label>
            <input
              id="search-input"
              type="text"
              placeholder="IP or location..."
              value={search}
              onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
            />
          </div>

          <div className="filter-group filter-checkbox">
            <input
              id="flagged-toggle"
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => handleFilterChange(() => setFlaggedOnly(e.target.checked))}
            />
            <label htmlFor="flagged-toggle">Flagged only</label>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>Loading log entries...</span>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span>{error}</span>
          <button onClick={() => fetchData()} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && logsData && logsData.items.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">&#128270;</div>
          <h3>No log entries found</h3>
          <p>Try adjusting your filters or uploading new log data.</p>
        </div>
      )}

      {!loading && !error && logsData && logsData.items.length > 0 && (
        <>
          <div className="log-table-wrapper">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Status Code</th>
                  <th>Location</th>
                  <th>Flagged</th>
                </tr>
              </thead>
              <tbody>
                {logsData.items.map((log) => {
                  const anomaly = anomalyMap[log.id];
                  const handleRowClick = () => {
                    if (log.flagged && anomaly) {
                      navigate(`/anomalies/${anomaly.id}`);
                    } else {
                      navigate(`/logs/${log.id}`);
                    }
                  };
                  return (
                    <tr
                      key={log.id}
                      className={`log-row${log.flagged ? ' log-row--flagged' : ''}`}
                      onClick={handleRowClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick();
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View log ${log.id} from ${log.source} flagged ${log.flagged ? 'yes' : 'no'}`}
                    >
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.source}</td>
                      <td>{log.eventType}</td>
                      <td>
                        <span className={`badge badge-${log.severity}`}>{log.severity}</span>
                      </td>
                      <td>{log.statusCode}</td>
                      <td>{log.location}</td>
                      <td>
                        {log.flagged ? (
                          <span className="flagged-badge">
                            Flagged {anomaly ? `(${anomaly.score})` : ''}
                          </span>
                        ) : (
                          <span className="not-flagged">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>

            {pageNumbers[0] > 1 && (
              <>
                <button className="page-btn" onClick={() => setPage(1)}>1</button>
                {pageNumbers[0] > 2 && <span className="page-ellipsis">...</span>}
              </>
            )}

            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`page-btn${p === page ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < logsData.totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < logsData.totalPages - 1 && (
                  <span className="page-ellipsis">...</span>
                )}
                <button
                  className="page-btn"
                  onClick={() => setPage(logsData.totalPages)}
                >
                  {logsData.totalPages}
                </button>
              </>
            )}

            <button
              disabled={page >= logsData.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>

            <span className="page-info">
              Page {logsData.page} of {logsData.totalPages} ({logsData.total} entries)
            </span>
          </div>
        </>
      )}
    </div>
  );
}