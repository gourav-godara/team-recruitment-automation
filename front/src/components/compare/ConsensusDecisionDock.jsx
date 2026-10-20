export default function ConsensusDecisionDock({
  onKeepNova,
  onPromoteSynapse,
  onExpandQuota,
  onProceedToStage06,
  decisionSummaryText = 'NovaPulse (#40) currently holds the cutoff slot by +0.10. Click quick actions to deliberate or seal the roster.',
}) {
  return (
    <div className="bg-secondary-fixed rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] p-space-md flex flex-col lg:flex-row items-center justify-between gap-space-md">
      {/* Left Icon and Text */}
      <div className="flex items-center gap-space-md">
        <div className="w-12 h-12 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] shrink-0 font-black">
          <span className="material-symbols-outlined text-2xl font-black">fact_check</span>
        </div>
        <div>
          <div className="font-headline-sm text-headline-sm text-on-secondary-fixed font-black">
            Consensus Decision Action Dock
          </div>
          <p
            id="decision-summary-text"
            className="font-body-sm text-body-sm text-on-secondary-fixed-variant text-xs font-semibold leading-tight"
          >
            {decisionSummaryText}
          </p>
        </div>
      </div>

      {/* Quick Action Resolution Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <button
          type="button"
          onClick={onKeepNova}
          className="px-3.5 py-2.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-bold cursor-pointer"
        >
          Keep NovaPulse (#40)
        </button>

        <button
          type="button"
          onClick={onPromoteSynapse}
          className="px-3.5 py-2.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-bold cursor-pointer"
        >
          Promote SynapseDB (#40)
        </button>

        <button
          type="button"
          onClick={onExpandQuota}
          className="px-3.5 py-2.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-bold cursor-pointer"
        >
          Expand Quota (Both Qualify)
        </button>

        <button
          type="button"
          onClick={onProceedToStage06}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-label-lg text-label-lg uppercase rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-black cursor-pointer"
        >
          <span>SEAL &amp; PROCEED TO STAGE 06</span>
          <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
