export default function ThemeLoader({
  title = 'Autonomous Decision Engine Working...',
  subtitle = 'Auditing applicant metrics & computing deterministic scores',
  ticker = 'Scanning candidate profiles and running RFC 4180 validation...',
  percent = null,
  step = null,
  totalSteps = null,
  isOverlay = false,
}) {
  const content = (
    <div className="bg-white rounded-3xl border-4 border-[#0F172A] p-6 sm:p-8 shadow-[8px_8px_0px_#0F172A] max-w-lg w-full flex flex-col gap-5 relative overflow-hidden">
      {/* Top Cyber Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-yellow via-brand-blue to-purple-600"></div>

      {/* Header with Reticle & Brand Logo */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mt-1">
        <div className="flex items-center gap-3">
          {/* Target Reticle Container with Logo */}
          <div className="relative w-14 h-14 rounded-2xl bg-brand-yellow border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-center overflow-hidden shrink-0 group">
            {/* Corner Targeting Brackets */}
            <div className="absolute inset-0.5 border border-brand-blue/30 rounded-xl pointer-events-none"></div>
            
            {/* Spinning Reticle Ring Behind/Over Logo */}
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-brand-blue/40 animate-reticle-spin pointer-events-none"></div>

            {/* Actual Logo Image */}
            <img
              src="/logo.png"
              alt="ShortlistIQ Logo"
              className="w-12 h-12 object-contain relative z-10 p-0.5 transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base text-[#0F172A] tracking-tight">
                ShortlistIQ
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-brand-yellow text-[#0F172A] border border-[#0F172A]">
                ENGINE
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-brand-blue uppercase tracking-wider">
              {step && totalSteps ? `Stage ${step} of ${totalSteps} • Verification` : 'Autonomous Processing'}
            </span>
          </div>
        </div>

        {/* Live Cyber Pulse Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border-2 border-brand-blue text-[10px] font-mono font-black text-brand-blue shadow-[1px_1px_0px_#0F172A]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
          </span>
          <span>PROCESSING</span>
        </div>
      </div>

      {/* Main Status Text */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-display font-black text-base text-[#0F172A] leading-snug">
          {title}
        </h4>
        <p className="text-xs font-sans text-slate-600 font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Themed Animated Hazard Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-mono font-bold">
          <span className="text-slate-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-brand-blue">bolt</span>
            <span>Pipeline Velocity</span>
          </span>
          <span className="text-brand-blue font-black font-mono">
            {percent !== null ? `${percent}%` : 'Running...'}
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-xl h-3.5 overflow-hidden border-2 border-[#0F172A] p-0.5 shadow-inner">
          <div
            className="h-full rounded-lg animate-hazard-stripes transition-all duration-300"
            style={{ width: `${percent !== null ? Math.max(12, percent) : 60}%` }}
          ></div>
        </div>
      </div>

      {/* Monospace Live Telemetry Ticker Box with Scanline Beam */}
      <div className="relative p-3.5 rounded-xl bg-slate-900 border-2 border-[#0F172A] text-xs font-mono text-emerald-400 overflow-hidden shadow-inner flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
        <span className="truncate relative z-10 font-bold">{ticker}</span>
        
        {/* Subtle Cyber Scanline Beam */}
        <div className="absolute left-0 right-0 h-1 bg-emerald-400/20 blur-xs animate-scanline-beam pointer-events-none"></div>
      </div>

      {/* Bottom Footer Invariants */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 text-slate-800 font-bold">
          <span className="material-symbols-outlined text-[13px] text-emerald-600 font-black">verified</span>
          <span>100% Deterministic & Anti-Bias</span>
        </span>
        <span className="text-slate-500">RFC 4180 Invariants</span>
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        {content}
      </div>
    );
  }

  return content;
}
