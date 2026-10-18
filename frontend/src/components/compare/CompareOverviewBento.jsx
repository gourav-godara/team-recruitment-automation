export default function CompareOverviewBento({
  teamAName = 'NovaPulse',
  teamBName = 'SynapseDB',
  boundaryDelta = '0.10',
  quorumRatio = '3 / 4',
  quorumPct = 75,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      {/* Bento 1: Active Face-off */}
      <div className="bg-secondary-fixed p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <span className="font-label-sm text-label-sm font-extrabold uppercase tracking-wide text-on-secondary-fixed">
            ACTIVE FACE-OFF
          </span>
          <span className="material-symbols-outlined text-xl text-on-secondary-fixed font-black">
            compare_arrows
          </span>
        </div>
        <div className="my-space-sm">
          <div className="font-headline-sm text-headline-sm text-on-secondary-fixed leading-tight font-black">
            {teamAName} vs {teamBName}
          </div>
          <div className="font-label-sm text-label-sm font-mono mt-1 text-on-secondary-fixed-variant font-bold">
            Slot #40 (Inside) vs Slot #41 (Outside)
          </div>
        </div>
        <div className="pt-2 border-t-2 border-[#0f172a]/20 flex items-center justify-between text-xs font-mono font-bold text-on-secondary-fixed">
          <span>Boundary Delta</span>
          <span className="px-2 py-0.5 bg-surface-container-lowest rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            {boundaryDelta} pts
          </span>
        </div>
      </div>

      {/* Bento 2: Score Differential */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <span className="font-label-sm text-label-sm font-extrabold uppercase tracking-wide text-on-surface-variant">
            SCORE DIFFERENTIAL
          </span>
          <span className="material-symbols-outlined text-xl text-primary-container font-bold">
            tune
          </span>
        </div>
        <div className="my-space-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface font-black flex items-center gap-2">
            +{boundaryDelta} <span className="font-label-md text-label-md font-normal text-on-surface-variant font-mono">Weighted</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-1 leading-snug">
            {teamAName} holds tech weight edge; {teamBName} leads in repo momentum.
          </p>
        </div>
        <div className="pt-2 border-t border-outline-variant flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface">
          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
          <span>Consensus spread within SIMD 0.5 threshold</span>
        </div>
      </div>

      {/* Bento 3: Reviewer Variance */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <span className="font-label-sm text-label-sm font-extrabold uppercase tracking-wide text-on-surface-variant">
            REVIEWER VARIANCE
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] border border-[#0f172a] font-bold">
            High σ
          </span>
        </div>
        <div className="my-space-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface font-black">
            σ = 2.18
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-1 leading-snug">
            2 conflicting rubric polarities detected between Lead &amp; AI tracks.
          </p>
        </div>
        <div className="pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm">
          <span className="font-bold text-[#ba1a1a]">Dr. Rostova vs M. Chen</span>
          <span className="font-mono text-on-surface-variant font-bold">Δ 7.0 pts</span>
        </div>
      </div>

      {/* Bento 4: Jury Quorum */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <span className="font-label-sm text-label-sm font-extrabold uppercase tracking-wide text-on-surface-variant">
            JURY QUORUM
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#10b981] text-on-primary border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
            {quorumRatio} VOTED
          </span>
        </div>
        <div className="my-space-sm">
          <div className="font-headline-sm text-headline-sm text-on-surface font-black">
            {quorumPct}% Complete
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-1 leading-snug">
            Alex Rivers (Lead) tie-break token unlocks authoritative resolution.
          </p>
        </div>
        <div className="pt-2 border-t border-outline-variant flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-medium">Arbitration State:</span>
          <span className="font-mono font-bold text-primary-container">PENDING SIGN</span>
        </div>
      </div>
    </div>
  );
}
