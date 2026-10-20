import { useState } from 'react';

export default function TieBreakerModal({
  isOpen,
  onClose,
  onResolveTie,
}) {
  const [selectedWinner, setSelectedWinner] = useState('nova_pulse');
  const [tieBreakNote, setTieBreakNote] = useState(
    'Consensus jury vote awarded promotion based on higher git commit velocity within the last 4 hours.'
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    onResolveTie({
      winner: selectedWinner,
      note: tieBreakNote,
      resolvedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-fixed px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-secondary-fixed">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-black">gavel</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Jury Consensus Tie-Breaker
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-secondary-fixed-variant">
                Pairwise Resolution for Cutoff Boundary Rank #40 vs #41
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-space-lg flex flex-col gap-space-md">
          <p className="text-xs text-on-surface-variant font-medium">
            Per <code>DATABASE_DESIGN.md</code>, pairwise comparisons record the winning team and mandatory tie-breaker justification to the audit ledger.
          </p>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-2 gap-space-sm">
            {/* Candidate A: NovaPulse */}
            <div
              onClick={() => setSelectedWinner('nova_pulse')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedWinner === 'nova_pulse'
                  ? 'border-[#0f172a] bg-secondary-fixed/40 shadow-[4px_4px_0px_#0f172a]'
                  : 'border-[#0f172a]/30 bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline-sm text-sm font-extrabold text-on-surface">NovaPulse</span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-[#0f172a]">
                  #40 IN
                </span>
              </div>
              <div className="text-xs font-mono text-on-surface-variant space-y-1 mt-2">
                <div>Score: <b className="text-on-surface">84.60 pts</b></div>
                <div>Track: Infra Relay</div>
                <div>Recent Commits: <b className="text-[#10b981]">15 in last 4h</b></div>
                <div>Monte Carlo Survival: 52%</div>
              </div>
              <div className="mt-3">
                <span className={`w-full py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-bold flex items-center justify-center gap-1 border border-[#0f172a] ${
                  selectedWinner === 'nova_pulse' ? 'bg-[#10b981] text-white' : 'bg-surface-container'
                }`}>
                  {selectedWinner === 'nova_pulse' ? '✓ Selected as #40 Finalist' : 'Select Winner'}
                </span>
              </div>
            </div>

            {/* Candidate B: SynapseDB */}
            <div
              onClick={() => setSelectedWinner('synapse_db')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedWinner === 'synapse_db'
                  ? 'border-[#0f172a] bg-primary-container/20 shadow-[4px_4px_0px_#0f172a]'
                  : 'border-[#0f172a]/30 bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline-sm text-sm font-extrabold text-on-surface">SynapseDB</span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-outline-variant text-on-surface border border-[#0f172a]">
                  #41 OUT
                </span>
              </div>
              <div className="text-xs font-mono text-on-surface-variant space-y-1 mt-2">
                <div>Score: <b className="text-on-surface">84.50 pts</b> (-0.10)</div>
                <div>Track: Database / ZK</div>
                <div>Recent Commits: <b className="text-on-surface">11 in last 4h</b></div>
                <div>Tech Score: <b className="text-primary">86.5 (Higher)</b></div>
              </div>
              <div className="mt-3">
                <span className={`w-full py-1.5 px-2 rounded-lg font-label-sm text-label-sm font-bold flex items-center justify-center gap-1 border border-[#0f172a] ${
                  selectedWinner === 'synapse_db' ? 'bg-primary text-white' : 'bg-surface-container'
                }`}>
                  {selectedWinner === 'synapse_db' ? '✓ Promoted to Finalist' : 'Select Winner'}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Reason Field */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm uppercase font-bold text-on-surface">
              Tie-Breaker Justification (Stored to <code>run_results.tie_break_note</code>)
            </label>
            <textarea
              rows={3}
              value={tieBreakNote}
              onChange={(e) => setTieBreakNote(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-surface-container-low border-2 border-[#0f172a] text-xs text-on-surface focus:outline-none focus:bg-white shadow-inner font-medium"
              placeholder="State clear technical reason for deciding boundary rank..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <div className="text-xs font-mono text-on-surface-variant">
            Target Table: <code>pairwise_comparisons</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container border border-[#0f172a] text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!tieBreakNote.trim()}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg bg-on-secondary-fixed text-secondary-fixed border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] text-xs font-black uppercase cursor-pointer hover:brightness-125 disabled:opacity-50"
            >
              Confirm Pairwise Verdict
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
