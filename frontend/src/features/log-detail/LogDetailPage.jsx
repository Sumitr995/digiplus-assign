import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getLogById, getAnomalyById, explainAnomaly, getAnomalies } from '../../api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ArrowLeft, Shield, AlertTriangle, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null); setLog(null); setAnomaly(null); setExplanation(null); setExplainError(null);
    try {
      if (isAnomalyRoute) {
        const r = await getAnomalyById(id);
        setLog(r.logEntry); setAnomaly(r.anomaly); setExplanation(r.explanation || null);
      } else {
        const lr = await getLogById(id);
        setLog(lr);
        if (lr.flagged) {
          try {
            const res = await getAnomalies({ logEntryId: lr.id, pageSize: 1 });
            if (res.items && res.items.length > 0) {
              const found = res.items[0];
              setAnomaly(found.anomaly);
              try { const d = await getAnomalyById(found.anomaly.id); if (d.explanation) setExplanation(d.explanation); } catch {}
            }
          } catch {}
        }
      }
    } catch (err) { const msg=err.message||err.error||'Failed'; const code=err.error? `${err.error}: ${msg}`:msg; setError({status:err.status,message:code}); } finally { setLoading(false); }
  }, [id, isAnomalyRoute]);
  useEffect(()=>{ fetchData(); },[fetchData]);
  const handleExplain = async (force=false)=>{
    if(!anomaly) return;
    setExplainLoading(true); setExplainError(null);
    try{ const r=await explainAnomaly(anomaly.id, force); setExplanation(r); }
    catch(err){ const is502=err.status===502||err.error==='AI_PROVIDER_ERROR'; setExplainError({is502, message: is502 ? 'AI provider failed. Retry.' : (err.message||'Failed')}); } finally{ setExplainLoading(false); }
  };
  const copySummary=async()=>{ if(!anomaly) return; await navigator.clipboard.writeText(anomaly.reasonSummary); setCopied(true); setTimeout(()=>setCopied(false),1500); };

  if(loading) return <div className="flex flex-col items-center py-24 gap-3"><div className="w-8 h-8 rounded-full border-2 border-hairline border-t-ink animate-spin" /><span className="text-sm text-designBody">Loading...</span></div>;
  if(error) return <div className="space-y-4"><Link to="/logs" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"><ArrowLeft className="w-4 h-4" /> Back</Link><div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-6 flex items-center justify-between"><div><div className="font-medium text-[#991b1b]">{error.status===404?'Not found':'Error'}</div><p className="text-sm text-[#991b1b]/80">{error.message}</p></div><Button variant="secondary" size="sm" onClick={fetchData}>Retry</Button></div></div>;
  if(!log) return <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">Log not found</div>;

  const fields=[
    ['ID', log.id],
    ['Timestamp', log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'],
    ['Source', <span key="s" className="font-mono text-xs">{log.source}</span>],
    ['Event', log.eventType],
    ['Severity', <Badge key="sev" variant={log.severity} className="capitalize">{log.severity}</Badge>],
    ['Status', String(log.statusCode)],
    ['User Agent', log.userAgent],
    ['Session', <span key="sess" className="font-mono text-xs">{log.sessionId}</span>],
    ['Location', log.location],
    ['Flagged', log.flagged ? <Badge key="flag" variant="flagged">Yes</Badge> : 'No'],
  ];

  return (
    <div className="space-y-6">
      <Link to="/logs" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Logs</Link>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />{isAnomalyRoute ? 'Anomaly Detail' : 'Log Detail'}</CardTitle>
            {log.flagged && <Badge variant="flagged" className="gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Flagged</Badge>}
          </div>
          {isAnomalyRoute && anomaly && <p className="text-xs text-designBody mt-1">Anomaly {anomaly.id} • Log {log.id}</p>}
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-hairline overflow-hidden">
            <Table>
              <TableBody>
                {fields.map(([label, value])=>(
                  <TableRow key={label} className="hover:bg-transparent">
                    <TableCell className="w-[160px] bg-surfaceSoft text-xs font-medium text-mute uppercase tracking-wide">{label}</TableCell>
                    <TableCell className="text-sm">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {log.flagged && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3 bg-surfaceSoft border-b border-hairline">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Anomaly Analysis</CardTitle>
            <button onClick={copySummary} className="w-8 h-8 rounded-full bg-canvas border border-hairline flex items-center justify-center hover:bg-white transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </CardHeader>
          <CardContent className="pt-4">
            {!anomaly ? <div className="text-sm text-designBody">Flagged but no anomaly in sampled pages.</div> : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-surfaceSoft p-3 text-center"><div className="text-xs text-mute">Score</div><div className="font-display text-lg font-semibold">{anomaly.score}</div></div>
                  <div className="rounded-lg bg-surfaceSoft p-3 col-span-2"><div className="text-xs text-mute">Reason Codes</div><div className="flex flex-wrap gap-1.5 mt-1">{anomaly.reasonCodes.map(c=> <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div></div>
                </div>
                <div>
                  <div className="text-xs text-mute mb-1">Deterministic Summary</div>
                  <p className="text-sm font-mono bg-surfaceSoft rounded-lg p-3 leading-relaxed">{anomaly.reasonSummary}</p>
                </div>
                <div className="flex gap-4 text-xs text-mute"><span>v{anomaly.ruleVersion}</span><span>{anomaly.id}</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {anomaly && (
        <Card className={explanation ? "bg-surfaceDark text-onDark border-transparent" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className={`flex items-center gap-2 text-sm ${explanation ? "text-onDark" : ""}`}><Sparkles className="w-4 h-4" /> AI Explanation</CardTitle>
            <div className="flex gap-2">
              <Button onClick={()=> handleExplain(false)} disabled={explainLoading} variant={explanation ? "secondary" : "primary"} size="sm" className={explanation ? "bg-white text-ink hover:bg-surfaceSoft" : ""}>{explainLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}{explanation ? 'Regenerate' : 'Generate'}</Button>
              {explanation && <Button onClick={()=> handleExplain(true)} disabled={explainLoading} variant="ghost" size="sm" className={explanation ? "text-onDark hover:bg-white/10" : ""}>Force</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {explainLoading && <div className="flex items-center justify-center gap-2 py-8"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /><span className={`text-sm ${explanation ? "text-onDarkMute" : "text-designBody"}`}>Generating...</span></div>}
            {explainError && !explainLoading && <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 flex items-center justify-between"><div><div className="text-sm font-medium text-[#991b1b]">{explainError.is502 ? 'AI 502' : 'Failed'}</div><p className="text-xs text-[#991b1b]/80">{explainError.message}</p></div><Button variant="secondary" size="sm" onClick={()=> handleExplain(false)}>Retry</Button></div>}
            {!explainLoading && !explainError && !explanation && <div className="text-center py-6 border border-dashed rounded-lg text-sm text-designBody">No explanation yet. Click Generate.</div>}
            {!explainLoading && explanation && (
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3"><div className="text-xs font-medium text-onDark mb-1">Explanation</div><p className="text-sm text-onDark leading-relaxed">{explanation.explanation}</p></div>
                <div className="bg-white/10 rounded-lg p-3"><div className="text-xs font-medium text-onDark mb-1">Root Cause</div><p className="text-sm text-onDark leading-relaxed">{explanation.likelyRootCause}</p></div>
                <div className="bg-white/10 rounded-lg p-3"><div className="text-xs font-medium text-onDark mb-1">Next Step</div><p className="text-sm text-onDark leading-relaxed">{explanation.recommendedNextStep}</p></div>
                <div className="flex gap-4 text-xs text-onDarkMute pt-2 border-t border-white/10"><span>{explanation.model}</span><span>{explanation.generatedAt ? new Date(explanation.generatedAt).toLocaleString() : '-'}</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
