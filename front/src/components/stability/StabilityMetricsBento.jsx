export default function StabilityMetricsBento({
  stabilityIndex = 92.5,
  successfulRuns = 9250,
  vulnerableCount = 3,
  safeAnchorsCount = 32,
  maxDisplacement = 3,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
      {/* Metric 1: Stability Index */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Shortlist Stability Index
          </span>
          <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-[#10b981] text-on-primary font-bold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            ROBUST
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-headline-xl text-headline-xl text-on-surface font-black tracking-tighter">
            {stabilityIndex}%
          </span>
          {/* Sparkline SVG */}
          <svg className="w-20 h-9 text-[#10b981] shrink-0" fill="none" viewBox="0 0 80 32">
            <path
              d="M2 24 L14 20 L26 26 L38 12 L50 16 L62 8 L78 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            <circle cx="78" cy="6" fill="currentColor" r="3" />
          </svg>
        </div>
        <div className="mt-space-xs font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-mono">
          <span className="material-symbols-outlined text-sm text-[#10b981]">trending_up</span>
          <span>{successfulRuns.toLocaleString()} of 10,000 runs maintain Top 40</span>
        </div>
      </div>

      {/* Metric 2: Bubble Zone Teams */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Vulnerable Bubble Teams
          </span>
          <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-on-tertiary-container font-extrabold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] animate-pulse">
            CRITICAL ZONE
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl text-tertiary font-black tracking-tighter">
            {vulnerableCount} Teams
          </span>
        </div>
        <div className="mt-space-xs font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-sm text-tertiary">warning</span>
          <span>High sensitivity near rank #38–#42</span>
        </div>
      </div>

      {/* Metric 3: Safe Anchor Teams */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Safe Anchor Teams
          </span>
          <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface font-mono font-bold border border-[#0f172a]">
            P&gt;99.9%
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl text-on-surface font-black tracking-tighter">
            {safeAnchorsCount} Teams
          </span>
        </div>
        <div className="mt-space-xs font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-mono">
          <span className="material-symbols-outlined text-sm text-primary">verified</span>
          <span>100% Invariant to ±15% parameter drift</span>
        </div>
      </div>

      {/* Metric 4: Max Rank Displacement */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Max Displacement
          </span>
          <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold font-mono border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            Δ MAX
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl text-on-surface font-black tracking-tighter">
            ±{maxDisplacement} Positions
          </span>
        </div>
        <div className="mt-space-xs font-label-md text-label-md text-on-surface-variant flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">swap_vert</span>
          <span>Worst-case boundary excursion</span>
        </div>
      </div>
    </div>
  );
}
