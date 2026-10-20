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
    { id: 'upload-section', label: '1. Upload', icon: 'upload_file' },
    { id: 'schema-section', label: '2. Schema & Quality', icon: 'fact_check' },
    { id: 'scoring-section', label: '3. Scoring Rules', icon: 'tune' },
    { id: 'results-section', label: '4. Leaderboard', icon: 'leaderboard' },
    { id: 'compare-section', label: '5. Compare', icon: 'compare_arrows' },
    { id: 'export-section', label: '6. Export CSV', icon: 'download' },
  ];

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-6 py-2 bg-white/95 backdrop-blur-md border-b-3 border-[#0F172A] shadow-[0_3px_0_0_#0F172A]">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Left: Official Reticle Logo & Branding */}
        <div className="flex items-center gap-2.5 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            {/* Custom Logo Slot displaying the Target Reticle Logo */}
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-yellow border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center justify-center overflow-hidden shrink-0 group relative cursor-pointer p-0.5 hover:shadow-[1px_1px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title="ShortlistIQ // Autonomous Team Recruitment Engine"
              onClick={() => scrollTo('upload-section')}
            >
              {/* Animated Rotating Dashed Targeting Ring */}
              <div className="absolute inset-0.5 rounded-lg border border-dashed border-[#0F172A]/40 animate-reticle-spin pointer-events-none"></div>

              {/* Pulsing Live Active Radar Beacon */}
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white animate-pulse z-20 pointer-events-none"></span>

              {logoLoaded ? (
                <img
                  src="/logo.png"
                  alt="ShortlistIQ Logo"
                  className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform relative z-10"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('/logo.png')) {
                      e.currentTarget.src = '/default-logo.svg';
                    } else {
                      setLogoLoaded(false);
                    }
                  }}
                />
              ) : (
                <span className="font-display font-extrabold text-xl text-brand-dark group-hover:rotate-12 transition-transform relative z-10">
                  🎯
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
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-brand-blue uppercase tracking-wider">
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
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center gap-1 ${
                  isBlindReview
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-900'
                }`}
                title="Toggle Blind Review Mode"
              >
                <span className="material-symbols-outlined text-[13px] font-bold">
                  {isBlindReview ? 'visibility_off' : 'visibility'}
                </span>
                <span>Blind: {isBlindReview ? 'ON' : 'OFF'}</span>
              </button>
            )}
            {dataset && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] cursor-pointer"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>

        {/* Center: Anchor Links Navigation Buttons (Compact, elegant, and visible without scrolling on desktop) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-visible max-w-full py-0.5 scrollbar-none shrink-0">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg font-display font-bold text-[11px] sm:text-xs whitespace-nowrap border-2 border-[#0F172A] transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  isActive
                    ? 'bg-brand-yellow text-[#0F172A] shadow-[2px_2px_0px_#0F172A] -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-yellow-50 hover:text-[#0F172A] hover:shadow-[1.5px_1.5px_0px_#0F172A] hover:-translate-y-0.5'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] font-bold">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Distinct Utility Controls with compact proportions & bold borders */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Utility 1: Anti-Bias Blind Review Capsule */}
          {onToggleBlindReview && (
            <button
              type="button"
              onClick={onToggleBlindReview}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap hover:-translate-y-0.5 ${
                isBlindReview
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-950'
              }`}
              title="Anonymize team and candidate identities to guarantee objective, nepotism-free review"
            >
              <span className="material-symbols-outlined text-[14px] font-bold">
                {isBlindReview ? 'visibility_off' : 'visibility'}
              </span>
              <span>Blind: {isBlindReview ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Utility 2: Dataset Live Status Capsule */}
          {dataset ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-950 text-[11px] font-mono font-extrabold rounded-lg border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] flex items-center gap-1.5 whitespace-nowrap">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>
                  {dataset.total_teams || dataset.teams_count || 'Active'} Teams
                  {runInfo?.run_id ? ` #${runInfo.run_id}` : ''}
                </span>
              </span>

              {/* Utility 3: New Upload Action Capsule */}
              <button
                type="button"
                onClick={onResetSession}
                title="Wipe current session to upload a new dataset"
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-950 text-[11px] font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px] font-bold">refresh</span>
                <span>New Upload</span>
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[1.5px_1.5px_0px_#0F172A] whitespace-nowrap">
              Waiting for CSV...
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
