export default function BinaryHardGatesCard({
  gates,
  onToggleGate,
  disqualifiedCount = 14,
  totalCandidateTeams = 482,
  onOpenBlocklist,
}) {
  const activeGatesCount = gates.filter((g) => g.enabled).length;

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col gap-space-md h-full">
      {/* Gate Section Header */}
      <div className="flex items-center justify-between border-b-2 border-surface-container pb-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-error border border-[#0f172a]"></span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Binary Hard Gates
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Non-negotiable qualification criteria
          </p>
        </div>
        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container border border-[#0f172a] font-black">
          {activeGatesCount} ENFORCED
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
        Teams failing any active hard gate are automatically sequestered to the Disqualified bucket prior to multiplier aggregation.
      </p>

      {/* Gate Cards List */}
      <div className="flex flex-col gap-space-sm flex-1">
        {gates.map((gate) => {
          return (
            <div
              key={gate.id}
              className={`p-3.5 rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex flex-col gap-2 transition-all ${
                gate.enabled ? 'bg-surface-container-low' : 'bg-surface-container opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${gate.iconColor}`}>
                    {gate.icon}
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {gate.ruleName}
                  </span>
                </div>

                {/* Tactile Toggle Switch Button */}
                <button
                  type="button"
                  onClick={() => onToggleGate(gate.id)}
                  aria-pressed={gate.enabled}
                  className={`gate-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#0f172a] transition-colors focus:outline-none ${
                    gate.enabled ? 'bg-[#10b981]' : 'bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest border border-[#0f172a] shadow transition-transform ${
                      gate.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></span>
                </button>
              </div>

              <p className="font-body-sm text-xs text-on-surface-variant leading-snug">
                {gate.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-outline-variant text-xs">
                <span className="text-error font-bold flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-xs">flag</span>
                  {gate.flaggedLabel}
                </span>
                <span className="font-label-sm text-label-sm font-mono text-on-surface-variant">
                  {gate.tolerance}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disqualification Summary Footnote */}
      <div className="mt-auto bg-surface-container p-3 rounded-lg border-2 border-[#0f172a] flex items-center justify-between shadow-[2px_2px_0px_#0f172a]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-lg">auto_delete</span>
          <span className="font-label-sm text-label-sm text-on-surface font-bold">
            {disqualifiedCount} of {totalCandidateTeams} Entries Disqualified
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenBlocklist}
          className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <span>Inspect Blocklist</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
