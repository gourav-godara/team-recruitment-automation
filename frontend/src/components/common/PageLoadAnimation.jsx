import { useState, useEffect } from 'react';

export default function PageLoadAnimation({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('BOOTING AUTONOMOUS RECRUITMENT ENGINE...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1400; // 1.4 seconds smooth strictly forward fill

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / duration) * 100));

      // Strictly non-decreasing progress guarantee: never goes backwards
      setProgress((prev) => Math.max(prev, rawPct));

      if (rawPct < 25) {
        setStatusText('BOOTING AUTONOMOUS RECRUITMENT ENGINE...');
      } else if (rawPct < 55) {
        setStatusText('MOUNTING RFC 4180 COMPLIANT INGESTION PIPELINE...');
      } else if (rawPct < 85) {
        setStatusText('INITIALIZING LIVE GITHUB VELOCITY & CODE AUDITOR...');
      } else if (rawPct < 100) {
        setStatusText('SYNCHRONIZING DETERMINISTIC JURY DECISION MATRICES...');
      } else {
        setStatusText('SYSTEM READY • SHORTLISTIQ ENGINE OPERATIONAL');
        clearInterval(interval);

        // Stage: Smooth fade out
        setTimeout(() => {
          setIsFadingOut(true);
        }, 220);

        // Stage: Unmount callback
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 580);
      }
    }, 20);

    return () => {
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col items-center justify-center p-4 transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38BDF8 1px, transparent 1px), linear-gradient(to bottom, #38BDF8 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      ></div>

      {/* Main Tactical Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border-4 border-[#FDE047] p-7 shadow-[10px_10px_0px_#FDE047] flex flex-col items-center text-center gap-5 overflow-hidden animate-fadeIn">
        {/* Top Hazard Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 animate-hazard-stripes"></div>

        {/* Tactical Crosshair Reticle Center with User's Logo */}
        <div className="relative w-28 h-28 mt-2 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-3xl bg-brand-yellow/30 blur-md animate-pulse"></div>

          {/* Outer Rotating Dashed Targeting Ring */}
          <div className="absolute inset-0 rounded-3xl border-3 border-dashed border-[#0F172A] animate-reticle-spin"></div>

          {/* Corner Cyber Brackets */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-3 border-l-3 border-brand-blue"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-3 border-r-3 border-brand-blue"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-3 border-l-3 border-brand-blue"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-3 border-r-3 border-brand-blue"></div>

          {/* Actual Target Reticle Logo */}
          <div className="w-22 h-22 rounded-2xl bg-brand-yellow border-3 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] overflow-hidden flex items-center justify-center p-1 relative z-10">
            <img
              src="/logo.png"
              alt="ShortlistIQ Target Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Radar Sweep Line */}
          <div
            className="absolute inset-2 rounded-2xl pointer-events-none opacity-40 animate-radar-sweep"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg 270deg, #1D4ED8 360deg)',
            }}
          ></div>
        </div>

        {/* System Identity */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-2xl text-[#0F172A] tracking-tight">
              ShortlistIQ
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-brand-yellow text-[#0F172A] border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A]">
              v2.0
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-brand-blue uppercase tracking-widest">
            Autonomous Recruitment Engine
          </span>
        </div>

        {/* Animated Cyber Hazard Progress Bar */}
        <div className="w-full flex flex-col gap-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>ENGINE INITIALIZING</span>
            </span>
            <span className="text-brand-blue font-black font-mono text-sm">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-xl h-4 overflow-hidden border-3 border-[#0F172A] p-0.5 shadow-inner relative">
            <div
              className="h-full rounded-lg animate-hazard-stripes relative overflow-hidden transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            >
              {/* Forward Leading Edge Indicator / Glow Beam */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/70 blur-xs rounded-r-md"></div>
            </div>
          </div>
        </div>

        {/* Terminal Scanline Monospace Ticker */}
        <div className="w-full relative p-3 rounded-xl bg-slate-900 border-2 border-[#0F172A] text-left overflow-hidden shadow-inner flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
          <span className="font-mono text-[11px] text-emerald-400 font-bold truncate">
            {statusText}
          </span>
          <div className="absolute left-0 right-0 h-1 bg-emerald-400/20 blur-xs animate-scanline-beam pointer-events-none"></div>
        </div>

        {/* Invariant Footer */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t-2 border-slate-100">
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
            Deterministic Scoring
          </span>
          <span>RFC 4180 Invariants</span>
        </div>
      </div>
    </div>
  );
}
