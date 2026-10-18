export default function TieBreakerAdvisoryCard({
  onOpenCompare,
  onCallTieBreaker,
  isInverted = false,
  novaPulseScore = '84.60',
  synapseScore = '84.50',
}) {
  return (
    <div className="bg-secondary-fixed rounded-xl p-space-md border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] relative overflow-hidden flex flex-col md:flex-row items-center gap-space-lg">
      {/* Icon */}
      <div className="w-14 h-14 rounded-full bg-on-secondary-fixed text-secondary-fixed flex items-center justify-center shrink-0 border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
        <span className="material-symbols-outlined text-3xl font-black">gavel</span>
      </div>

      {/* Advisory Content */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-sm text-label-sm uppercase tracking-wider px-2.5 py-0.5 rounded bg-on-secondary-fixed text-secondary-fixed font-black border border-[#0f172a]">
            ORGANIZING RECOMMENDATION // TIE-BREAKER MANDATE
          </span>
          <span className="font-mono font-bold text-on-secondary-fixed text-xs">
            PRIORITY ALPHA
          </span>
          {isInverted && (
            <span className="font-label-sm text-label-sm px-2 py-0.5 bg-tertiary text-white rounded font-bold uppercase border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
              RANK INVERSION DETECTED ({synapseScore} &gt; {novaPulseScore})
            </span>
          )}
        </div>

        <p className="font-headline-sm text-base text-on-secondary-fixed font-extrabold leading-snug">
          NovaPulse (#40: {novaPulseScore} pts) and SynapseDB (#41: {synapseScore} pts) are separated by only 0.10 points and invert under Tech-heavy weightings.
        </p>

        <p className="font-body-sm text-xs text-on-secondary-fixed-variant font-medium">
          Recommend secondary manual tie-breaker review before freezing final shortlist. Both teams have verified GitHub commits within the last 4 hours.
        </p>
      </div>

      {/* Buttons */}
      <div className="shrink-0 flex items-center gap-2 w-full md:w-auto">
        <button
          type="button"
          onClick={onOpenCompare}
          className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-bold border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container-low transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] cursor-pointer"
        >
          Open Head-to-Head Compare
        </button>

        <button
          type="button"
          onClick={onCallTieBreaker}
          className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-on-secondary-fixed text-secondary-fixed font-label-lg text-label-lg font-black border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:brightness-125 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] cursor-pointer"
        >
          Call Jury Tie-Breaker
        </button>
      </div>
    </div>
  );
}
