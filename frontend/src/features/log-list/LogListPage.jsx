import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLogs, getAnomalies, getStatsSummary } from '../../api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Download } from 'lucide-react';

export default function LogListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [logsData, setLogsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState(initialQ);
  const [stats, setStats] = useState(null);
  const [anomalyMap, setAnomalyMap] = useState({});
  const pageSize = 25;
  const handleFilterChange = (updater) => { updater(); setPage(1); };
  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
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
      setLogsData(logsResult); setStats(statsResult);
      const map = {}; for (const { anomaly, logEntry } of anomaliesResult.items) if (logEntry) map[logEntry.id] = anomaly;
      setAnomalyMap(map);
    } catch (err) { setError(err.message || 'Failed to load logs'); } finally { setLoading(false); }
  }, [page, pageSize, severity, flaggedOnly, search, dateFrom, dateTo]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setSearch(initialQ); }, [initialQ]);
  const pageNumbers = useMemo(() => {
    if (!logsData) return [];
    const { page: cur, totalPages } = logsData;
    const pages = []; const start = Math.max(1, cur - 2); const end = Math.min(totalPages, cur + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [logsData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Log Table</h1>
          <p className="text-sm text-designBody mt-1">Tabular view • 25/page • click row for detail • flagged in red</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5 self-start"><Download className="w-4 h-4" /> Export CSV</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-hairline p-4 flex items-center justify-between">
            <div><div className="text-xs text-mute uppercase tracking-wide">Total</div><div className="font-display text-lg font-semibold">{stats.totalLogs.toLocaleString()}</div></div>
            <Filter className="w-5 h-5 text-mute" />
          </div>
          <div className="rounded-lg border border-hairline p-4 flex items-center justify-between">
            <div><div className="text-xs text-mute uppercase tracking-wide">Flagged</div><div className="font-display text-lg font-semibold text-[#991b1b]">{stats.totalFlagged.toLocaleString()}</div></div>
            <Badge variant="flagged"><AlertTriangle className="w-3 h-3 mr-1" />{((stats.totalFlagged/stats.totalLogs)*100).toFixed(1)}%</Badge>
          </div>
          <div className="rounded-lg bg-surfaceDark text-onDark p-4">
            <div className="text-xs text-onDarkMute uppercase tracking-wide">Filters</div>
            <div className="text-sm mt-1">{severity||'All'} • {flaggedOnly ? 'Flagged only' : 'All rows'} • {search||'no search'}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-hairline p-4 bg-canvas">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-mute block mb-1.5">Search</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute group-focus-within:text-ink" />
              <input value={search} onChange={(e)=> handleFilterChange(()=> setSearch(e.target.value))} placeholder="IP or location..." className="w-full bg-surfaceSoft border border-transparent rounded-full h-9 pl-10 pr-4 text-sm placeholder:text-mute focus:bg-canvas focus:border-hairline focus:ring-2 focus:ring-focusRing outline-none transition-all" />
            </div>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-mute block mb-1.5">Severity</label>
            <select value={severity} onChange={(e)=> handleFilterChange(()=> setSeverity(e.target.value))} className="w-full bg-canvas border border-hairline rounded-full h-9 px-4 text-sm focus:border-ink focus:ring-2 focus:ring-focusRing outline-none">
              <option value="">All</option><option value="critical">Critical</option><option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-mute block mb-1.5">From</label>
            <input type="date" value={dateFrom} onChange={(e)=> handleFilterChange(()=> setDateFrom(e.target.value))} className="bg-canvas border border-hairline rounded-full h-9 px-4 text-sm focus:border-ink focus:ring-2 focus:ring-focusRing outline-none" />
          </div>
          <div>
            <label className="text-xs text-mute block mb-1.5">To</label>
            <input type="date" value={dateTo} onChange={(e)=> handleFilterChange(()=> setDateTo(e.target.value))} className="bg-canvas border border-hairline rounded-full h-9 px-4 text-sm focus:border-ink focus:ring-2 focus:ring-focusRing outline-none" />
          </div>
          <label className="flex items-center gap-2 bg-surfaceSoft rounded-full px-4 h-9 cursor-pointer hover:bg-hairline select-none">
            <input type="checkbox" checked={flaggedOnly} onChange={(e)=> handleFilterChange(()=> setFlaggedOnly(e.target.checked))} className="accent-primary" />
            <span className="text-sm font-medium whitespace-nowrap">Flagged only</span>
          </label>
        </div>
      </div>

      {loading && <div className="flex flex-col items-center py-16 gap-3"><div className="w-8 h-8 rounded-full border-2 border-hairline border-t-ink animate-spin" /><span className="text-sm text-designBody">Loading...</span></div>}
      {error && <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 flex items-center justify-between"><span className="text-sm text-[#991b1b]">{error}</span><Button variant="secondary" size="sm" onClick={()=> fetchData()}>Retry</Button></div>}
      {!loading && !error && logsData && logsData.items.length===0 && (
        <div className="text-center py-16 border border-hairline rounded-lg">
          <div className="w-12 h-12 rounded-full bg-surfaceSoft flex items-center justify-center mx-auto mb-3"><Search className="w-6 h-6 text-mute" /></div>
          <h3 className="font-display font-medium">No entries</h3><p className="text-sm text-designBody mt-1">Adjust filters</p>
        </div>
      )}
      {!loading && !error && logsData && logsData.items.length>0 && (
        <>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Timestamp</TableHead><TableHead>Source</TableHead><TableHead className="hidden md:table-cell">Event</TableHead><TableHead>Severity</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead>Location</TableHead><TableHead>Flagged</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {logsData.items.map((log)=>{
                const anomaly=anomalyMap[log.id];
                const go=()=>{ if(log.flagged&&anomaly) navigate(`/anomalies/${anomaly.id}`); else navigate(`/logs/${log.id}`); };
                return (
                  <TableRow key={log.id} onClick={go} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); }}} tabIndex={0} role="button" className={`cursor-pointer ${log.flagged ? 'bg-[#fef2f2]/40 hover:bg-[#fee2e2]/60 border-l-2 border-l-terminalRed' : ''}`}>
                    <TableCell className="whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{log.source}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{log.eventType}</TableCell>
                    <TableCell><Badge variant={log.severity} className="capitalize text-[11px]">{log.severity}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{log.statusCode}</TableCell>
                    <TableCell className="text-xs">{log.location}</TableCell>
                    <TableCell>{log.flagged ? <span className="inline-flex items-center gap-1 bg-[#fecaca] text-[#991b1b] rounded-full px-2.5 py-1 text-xs font-medium">Flagged{anomaly? ` ${anomaly.score}`:''}</span> : <span className="text-mute">—</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" disabled={page<=1} onClick={()=> setPage(p=>p-1)}><ChevronLeft className="w-4 h-4" /> Prev</Button>
              {pageNumbers.map(p=> <Button key={p} variant={p===page?"primary":"secondary"} size="sm" onClick={()=> setPage(p)}>{p}</Button>)}
              <Button variant="secondary" size="sm" disabled={page>=logsData.totalPages} onClick={()=> setPage(p=>p+1)}>Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
            <span className="text-xs text-mute">Page {logsData.page} of {logsData.totalPages} ({logsData.total.toLocaleString()})</span>
          </div>
        </>
      )}
    </div>
  );
}
