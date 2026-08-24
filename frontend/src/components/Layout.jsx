import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Menu, X, BarChart3, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/logs?q=${encodeURIComponent(q.trim())}`);
  };
  const link = "text-sm font-medium px-3 py-2 rounded-full transition-colors hover:bg-surfaceSoft";
  const active = "bg-primary text-onPrimary hover:bg-inkDeep hover:text-onPrimary";
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-onPrimary flex items-center justify-center font-display text-sm">◈</span>
              <span className="font-display font-semibold tracking-tight">DigiPlus</span>
              <span className="hidden sm:inline text-xs text-mute border border-hairline rounded-full px-2 py-0.5">ANALYTICS</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={({isActive})=> cn(link, isActive && active)}><span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Dashboard</span></NavLink>
              <NavLink to="/logs" className={({isActive})=> cn(link, isActive && active)}><span className="flex items-center gap-1.5"><Table className="w-4 h-4" /> Logs</span></NavLink>
            </nav>
          </div>
          <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-[360px] mx-4">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute group-focus-within:text-ink" />
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search IP, location..." className="w-full bg-surfaceSoft border border-transparent rounded-full h-9 pl-10 pr-4 text-sm placeholder:text-mute focus:bg-canvas focus:border-hairline focus:ring-2 focus:ring-focusRing outline-none transition-all" />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Link to="/logs" className="hidden md:inline-flex"><Button variant="secondary" size="sm">Docs</Button></Link>
            <Link to="/logs"><Button variant="primary" size="sm">View Table</Button></Link>
            <button onClick={()=> setMobileOpen(v=>!v)} className="md:hidden w-9 h-9 rounded-full border border-hairline flex items-center justify-center hover:bg-surfaceSoft">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-hairline px-6 py-4 space-y-3">
            <form onSubmit={onSearch} className="flex gap-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search IP, location..." className="flex-1 bg-surfaceSoft rounded-full h-9 px-4 text-sm focus:bg-canvas focus:border-hairline focus:ring-2 focus:ring-focusRing outline-none border border-transparent" />
              <Button type="submit" size="sm">Search</Button>
            </form>
            <nav className="flex flex-col gap-1">
              <NavLink to="/" end onClick={()=>setMobileOpen(false)} className={({isActive})=> cn("px-3 py-2.5 rounded-full text-sm", isActive ? "bg-primary text-onPrimary" : "hover:bg-surfaceSoft")}>Dashboard</NavLink>
              <NavLink to="/logs" onClick={()=>setMobileOpen(false)} className={({isActive})=> cn("px-3 py-2.5 rounded-full text-sm", isActive ? "bg-primary text-onPrimary" : "hover:bg-surfaceSoft")}>Logs</NavLink>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-6 py-6">{children}</div>
      </main>
      <footer className="border-t border-hairline mt-8">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-designBody">
          <span>© 2026 DigiPlus • Deterministic rules • On-demand AI</span>
          <span className="flex gap-3"><a href="#" className="hover:text-ink hover:underline">GitHub</a><a href="#" className="hover:text-ink hover:underline">Privacy</a></span>
        </div>
      </footer>
    </div>
  );
}
