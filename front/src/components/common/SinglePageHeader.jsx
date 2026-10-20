import { useState } from 'react';

export default function SinglePageHeader({
  dataset,
  runInfo,
  onResetSession,
  activeSection,
}) {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = [
    { id: 'upload-section', label: '1. Upload', icon: 'upload_file' },
    { id: 'schema-section', label: '2. Schema & Quality', icon: 'fact_check' },
    { id: 'scoring-section', label: '3. Scoring Rules', icon: 'tune' },
    { id: 'results-section', label: '4. Leaderboard', icon: 'leaderboard' },
    { id: 'compare-section', label: '5. Compare', icon: 'compare_arrows' },
    { id: 'export-section', label: '6. Export CSV', icon: 'download' },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-b-4 border-[#0F172A] shadow-[0_4px_0_0_#0F172A]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Logo Slot & Branding */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* Dedicated Custom Logo Slot */}
            <div
              className="w-12 h-12 rounded-2xl bg-brand-yellow border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-center overflow-hidden shrink-0 group relative cursor-pointer"
              title="Team Recruitment Automation (Drop logo in public/logo.png)"
              onClick={() => scrollTo('upload-section')}
            >
              {logoLoaded ? (
                <img
                  src="/logo.png"
                  alt="Recruitment Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    // Fall back to default SVG
                    if (e.currentTarget.src.endsWith('/logo.png')) {
                      e.currentTarget.src = '/default-logo.svg';
                    } else {
                      setLogoLoaded(false);
                    }
                  }}
                />
              ) : (
                <span className="font-display font-extrabold text-2xl text-brand-dark group-hover:rotate-12 transition-transform">
                  ⚡
                </span>
              )}
            </div>

            {/* Title & Slogan */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-[#0F172A] leading-tight">
                  ShortlistIQ
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-green/30 text-emerald-900 border border-[#0F172A]">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-brand-blue uppercase tracking-wider">
                Autonomous Team Recruitment Engine
              </span>
            </div>
          </div>

          {/* Mobile Reset Action */}
          <div className="flex md:hidden items-center gap-2">
            {dataset && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>

        {/* Center: Anchor Links Navigation Pills */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 scrollbar-none">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap border-2 border-[#0F172A] transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-yellow text-[#0F172A] shadow-[3px_3px_0px_#0F172A] -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-yellow-50 hover:shadow-[2px_2px_0px_#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Active Dataset Status & Reset Button */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {dataset ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-900 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {dataset.total_teams || dataset.teams_count || 'Active'} Teams
                  {runInfo?.run_id ? ` • Run #${runInfo.run_id}` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={onResetSession}
                title="Wipe current session to upload a new dataset"
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                ↺ New Upload
              </button>
            </div>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A]">
              Waiting for CSV Upload...
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
