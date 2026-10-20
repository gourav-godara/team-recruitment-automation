import { useState } from 'react';

export default function SinglePageHeader({
  dataset,
  runInfo,
  onResetSession,
  activeSection,
  isBlindReview,
  onToggleBlindReview,
}) {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = [
    { id: 'upload-section', label: '1. Upload', shortLabel: '1. Upload', icon: 'upload_file' },
    { id: 'schema-section', label: '2. Schema & Quality', shortLabel: '2. Schema', icon: 'fact_check' },
    { id: 'scoring-section', label: '3. Scoring Rules', shortLabel: '3. Rules', icon: 'tune' },
    { id: 'results-section', label: '4. Leaderboard', shortLabel: '4. Leaderboard', icon: 'leaderboard' },
    { id: 'compare-section', label: '5. Compare', shortLabel: '5. Compare', icon: 'compare_arrows' },
    { id: 'export-section', label: '6. Export CSV', shortLabel: '6. Export', icon: 'download' },
  ];

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-b-4 border-[#0F172A] shadow-[0_4px_0_0_#0F172A]">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Left: Logo Slot & Branding */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            {/* Dedicated Custom Logo Slot */}
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-yellow border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center justify-center overflow-hidden shrink-0 group relative cursor-pointer"
              title="Team Recruitment Automation (Drop logo in public/logo.png)"
              onClick={() => scrollTo('upload-section')}
            >
              {logoLoaded ? (
                <img
                  src="/logo.png"
                  alt="Recruitment Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('/logo.png')) {
                      e.currentTarget.src = '/default-logo.svg';
                    } else {
                      setLogoLoaded(false);
                    }
                  }}
                />
              ) : (
                <span className="font-display font-extrabold text-xl text-brand-dark group-hover:rotate-12 transition-transform">
                  ⚡
                </span>
              )}
            </div>

            {/* Title & Slogan */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[#0F172A] leading-tight">
                  ShortlistIQ
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-brand-green/30 text-emerald-900 border border-[#0F172A]">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-brand-blue uppercase tracking-wider">
                Autonomous Recruitment Engine
              </span>
            </div>
          </div>

          {/* Mobile Actions (Blind Review + Reset) */}
          <div className="flex lg:hidden items-center gap-1.5">
            {onToggleBlindReview && (
              <button
                type="button"
                onClick={onToggleBlindReview}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border-2 border-[#0F172A] flex items-center gap-1 ${
                  isBlindReview
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-900'
                }`}
                title="Toggle Blind Review Mode"
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  {isBlindReview ? 'visibility_off' : 'visibility'}
                </span>
                <span>Blind</span>
              </button>
            )}
            {dataset && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>

        {/* Center: Anchor Links Navigation Pills (Slider on mobile, full visible row on desktop) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-visible max-w-full py-0.5 scrollbar-none shrink-0">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap border-2 border-[#0F172A] transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  isActive
                    ? 'bg-brand-yellow text-[#0F172A] shadow-[3px_3px_0px_#0F172A] -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-yellow-50 hover:shadow-[2px_2px_0px_#0F172A]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] font-bold">
                  {item.icon}
                </span>
                {/* Responsive label: compact on medium laptops, full on large displays */}
                <span className="hidden xl:inline">{item.label}</span>
                <span className="inline xl:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Blind Review Mode Toggle & Active Dataset Status & Reset Button */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Anti-Bias / Blind Review Toggle */}
          {onToggleBlindReview && (
            <button
              type="button"
              onClick={onToggleBlindReview}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5 transition-all cursor-pointer ${
                isBlindReview
                  ? 'bg-purple-600 text-white shadow-[2px_2px_0px_#0F172A]'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900'
              }`}
              title="Anonymize team and candidate names to guarantee objective, nepotism-free review"
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {isBlindReview ? 'visibility_off' : 'visibility'}
              </span>
              <span>Blind Mode: {isBlindReview ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {dataset ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5 whitespace-nowrap">
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
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer whitespace-nowrap"
              >
                ↺ New Upload
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] whitespace-nowrap">
              Waiting for CSV...
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
