import { useEffect, useState } from 'react';
import { getStatsSummary, getLogs, getAnomalies } from '../../api';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, l, a] = await Promise.all([
          getStatsSummary(),
          getLogs({ page: 1, pageSize: 10 }),
          getAnomalies({ page: 1, pageSize: 10 }),
        ]);
        setStats(s);
        setRecentLogs(l.items);
        setRecentAnomalies(a.items);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div>
      <h2>Dashboard</h2>

      {stats && (
        <div style={{ display: 'flex', gap: 16, margin: '16px 0', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Logs</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalLogs}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Flagged</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#991b1b' }}>{stats.totalFlagged}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Severity Breakdown</div>
            <div style={{ fontSize: 14 }}>
              {Object.entries(stats.bySeverity).map(([sev, count]) => (
                <span key={sev} className={`badge badge-${sev}`} style={{ marginRight: 4 }}>
                  {sev}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Recent Logs</h3>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source</th>
                <th>Event</th>
                <th>Status</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><Link to={`/logs/${log.id}`}>{log.source}</Link></td>
                  <td>{log.eventType}</td>
                  <td>{log.statusCode}</td>
                  <td><span className={`badge badge-${log.severity}`}>{log.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Recent Anomalies</h3>
          <table>
            <thead>
              <tr>
                <th>Score</th>
                <th>Source</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {recentAnomalies.map(({ anomaly, logEntry }) => (
                <tr key={anomaly.id}>
                  <td><span className="badge badge-critical">{anomaly.score}</span></td>
                  <td>{logEntry?.source || '-'}</td>
                  <td>{anomaly.reasonSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}