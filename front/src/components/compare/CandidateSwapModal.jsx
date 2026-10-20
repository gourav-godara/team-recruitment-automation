import { mockAlternativeContenders } from '../../data/mockCompare';

export default function CandidateSwapModal({
  isOpen,
  onClose,
  onSelectCandidate,
  targetSlot = 'B', // 'A' | 'B'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-black">swap_horiz</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black text-white">
                Swap Contender Slot {targetSlot}
              </h2>
              <p className="font-body-sm text-xs text-white/90">
                Choose a candidate team from the cutoff perimeter to compare
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="p-space-lg flex flex-col gap-2 max-h-96 overflow-y-auto">
          {mockAlternativeContenders.map((cand) => (
            <div
              key={cand.id}
              onClick={() => {
                onSelectCandidate(cand, targetSlot);
                onClose();
              }}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-secondary-fixed/30 border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-surface-container-highest border border-[#0f172a] flex items-center justify-center font-mono font-bold text-xs">
                  #{cand.rank}
                </span>
                <div>
                  <div className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                    {cand.name}
                  </div>
                  <div className="text-xs font-mono text-on-surface-variant">
                    {cand.track} • ID: {cand.id}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-tabular-score text-tabular-score font-bold text-primary">
                  {cand.score.toFixed(2)} pts
                </span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0f172a] text-white font-label-md text-label-md font-bold cursor-pointer hover:bg-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
