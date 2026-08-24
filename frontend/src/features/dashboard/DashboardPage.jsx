import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStatsSummary, getLogs, getAnomalies } from '../../api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Activity, Database, AlertTriangle, Clock, BarChart3, Shield, ArrowRight, RefreshCw, Download } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, l, a] = await Promise.all([
        getStatsSummary(),
        getLogs({ page: 1, pageSize: 8 }),
        getAnomalies({ page: 1, pageSize: 8 }),
      ]);
      setStats(s); setRecentLogs(l.items); setRecentAnomalies(a.items);
    } catch (err) { setError(err.message || 'Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-ink animate-spin" />
      <span className="text-sm text-designBody">Loading analytics...</span>
    </div>
  );
  if (error) return <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] text-[#991b1b] p-4 text-sm">{error}</div>;

  const sevData = stats ? Object.entries(stats.bySeverity).sort((a,b)=>b[1]-a[1]) : [];
  const sevMax = Math.max(...sevData.map(([,c])=>c),1);
  const reasonData = stats ? Object.entries(stats.byReasonCode).sort((a,b)=>b[1]-a[1]) : [];
  const reasonMax = Math.max(...reasonData.map(([,c])=>c),1);
  const flagRate = stats ? ((stats.totalFlagged/stats.totalLogs)*100).toFixed(1) : 0;
  const timeRange = stats?.timeRange ? `${new Date(stats.timeRange.from).toLocaleDateString()} → ${new Date(stats.timeRange.to).toLocaleDateString()}` : '-';

  return (
    <div className="space-y-6">
      {/* Header — tabular dashboard title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics Dashboard</h1>
          <p className="text-sm text-designBody mt-1">Tabular overview of 10k logs • deterministic rules • last ingest {timeRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Link to="/logs"><Button variant="primary" size="sm" className="gap-1.5">View Logs <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </div>

      {/* KPI 4-up — tabular metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-mute uppercase tracking-wide">Total Logs</span>
              <span className="w-7 h-7 rounded-full bg-surfaceSoft flex items-center justify-center"><Database className="w-3.5 h-3.5" /></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-display text-[28px] font-semibold leading-none">{stats.totalLogs.toLocaleString()}</div>
            <div className="text-xs text-designBody mt-1">Ingested • paginated 25/page</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-mute uppercase tracking-wide">Flagged</span>
              <span className="w-7 h-7 rounded-full bg-[#fef2f2] flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-[#991b1b]" /></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-display text-[28px] font-semibold leading-none text-[#991b1b]">{stats.totalFlagged.toLocaleString()}</div>
            <div className="text-xs text-designBody mt-1">{flagRate}% of total</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-mute uppercase tracking-wide">Flag Rate</span>
          </CardHeader>
          <CardContent>
            <div className="font-display text-[28px] font-semibold leading-none">{flagRate}%</div>
            <div className="w-full h-1.5 bg-surfaceSoft rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{width: `${Math.min(100, parseFloat(flagRate))}%`}} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surfaceDark text-onDark border-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-onDarkMute uppercase tracking-wide">Time Range</span>
              <Clock className="w-4 h-4 text-onDarkMute" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm font-medium">{timeRange}</div>
            <div className="text-xs text-onDarkMute mt-1 flex items-center gap-1"><Shield className="w-3 h-3" /> 7 days • 1/min cadence</div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis row — 3 tables */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Severity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sevData.map(([sev,count])=>(
              <div key={sev} className="flex items-center gap-3">
                <Badge variant={sev} className="w-[70px] justify-center capitalize text-xs">{sev}</Badge>
                <div className="flex-1 h-2 bg-surfaceSoft rounded-full overflow-hidden">
                  <div className="h-full bg-ink rounded-full transition-all" style={{width: `${(count/sevMax)*100}%`}} />
                </div>
                <span className="text-xs font-mono w-10 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Reason Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {reasonData.map(([code,count])=>(
              <div key={code} className="flex items-center gap-3">
                <span className="text-xs font-mono bg-surfaceSoft rounded-full px-2.5 py-1 w-[130px] truncate text-center">{code}</span>
                <div className="flex-1 h-2 bg-surfaceSoft rounded-full overflow-hidden">
                  <div className="h-full bg-charcoal rounded-full" style={{width: `${(count/reasonMax)*100}%`}} />
                </div>
                <span className="text-xs font-mono w-10 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-hairline"><span className="text-designBody">Engine</span><Badge variant="soft" className="gap-1"><span className="w-2 h-2 rounded-full bg-terminalGreen" /> Deterministic</Badge></div>
            <div className="flex justify-between py-2 border-b border-hairline"><span className="text-designBody">AI</span><span className="font-mono text-xs">Groq llama3-70b</span></div>
            <div className="flex justify-between py-2"><span className="text-designBody">Ground truth</span><span className="text-xs">15.6.62.53 • North Korea 10/10</span></div>
            <Link to="/logs"><Button variant="secondary" size="sm" className="w-full mt-2">Open Log Table</Button></Link>
          </CardContent>
        </Card>
      </div>

      {/* Tabular tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Recent Logs</CardTitle>
            <Link to="/logs" className="text-xs font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </CardHeader>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Source</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
                <TableHead>Sev</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {recentLogs.map((log)=>(
                <TableRow key={log.id} className="cursor-pointer hover:bg-surfaceSoft" onClick={()=> navigate(`/logs/${log.id}`)}>
                  <TableCell>
                    <span className="font-mono text-xs font-medium flex items-center gap-1.5">
                      {log.source} {log.flagged && <span className="w-1.5 h-1.5 rounded-full bg-terminalRed" />}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-designBody">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={log.severity} className="text-[11px] capitalize">{log.severity}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{log.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Recent Anomalies</CardTitle>
            <span className="text-xs text-mute flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-terminalRed animate-pulse" /> Live</span>
          </CardHeader>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reason</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {recentAnomalies.map(({anomaly, logEntry})=>(
                <TableRow key={anomaly.id} className="cursor-pointer hover:bg-surfaceSoft" onClick={()=> navigate(`/anomalies/${anomaly.id}`)}>
                  <TableCell><Badge variant="critical" className="font-mono">{anomaly.score}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{logEntry?.source || '-'}</TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate" title={anomaly.reasonSummary}>{anomaly.reasonSummary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
