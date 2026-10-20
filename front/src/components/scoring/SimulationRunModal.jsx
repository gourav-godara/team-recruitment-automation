import { useState, useEffect } from 'react';

export default function SimulationRunModal({
  isOpen,
  onClose,
  onProceedToRankedResults,
  modelName,
  topQuota = 40,
  disqualifiedCount = 14,
  curveType,
}) {
  const [progressStep, setProgressStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setProgressStep(1);
      const t1 = setTimeout(() => setProgressStep(2), 350);
      const t2 = setTimeout(() => setProgressStep(3), 700);
      const t3 = setTimeout(() => setProgressStep(4), 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">memory</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black text-white">
                SIMD WebAssembly Scoring Engine
              </h2>
              <p className="font-body-sm text-xs text-white/90">
                Deterministic Consensus Execution • v2.4.1
              </p>
            </div>
          </div>
          {progressStep >= 4 && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Steps animation */}
        <div className="p-space-lg flex flex-col gap-4">
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#0f172a] bg-surface-container-low shadow-[2px_2px_0px_#0f172a]">
              <span
                className={`material-symbols-outlined text-xl font-bold ${
                  progressStep >= 1 ? 'text-[#10b981]' : 'text-on-surface-variant'
                }`}
              >
                {progressStep >= 1 ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div className="flex-1">
                <div className="font-bold text-sm text-on-surface">
                  Vector Calibration Ingested
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  Active Model: {modelName} • Curve: {curveType === 'z_score' ? 'Z-Score Gaussian' : 'Min-Max Linear'}
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-[#10b981]/20 text-[#15803d] px-2 py-0.5 rounded border border-[#15803d]">
                4.2ms
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#0f172a] bg-surface-container-low shadow-[2px_2px_0px_#0f172a]">
              <span
                className={`material-symbols-outlined text-xl font-bold ${
                  progressStep >= 2 ? 'text-[#10b981]' : 'text-on-surface-variant animate-spin'
                }`}
              >
                {progressStep >= 2 ? 'check_circle' : 'sync'}
              </span>
              <div className="flex-1">
                <div className="font-bold text-sm text-on-surface">
                  Binary Hard Gates Evaluated
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  {disqualifiedCount} candidate teams sequestered to Disqualified blocklist
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-[#10b981]/20 text-[#15803d] px-2 py-0.5 rounded border border-[#15803d]">
                6.8ms
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#0f172a] bg-surface-container-low shadow-[2px_2px_0px_#0f172a]">
              <span
                className={`material-symbols-outlined text-xl font-bold ${
                  progressStep >= 3 ? 'text-[#10b981]' : 'text-on-surface-variant animate-spin'
                }`}
              >
                {progressStep >= 3 ? 'check_circle' : 'sync'}
              </span>
              <div className="flex-1">
                <div className="font-bold text-sm text-on-surface">
                  Normalized Multiplier Aggregation
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  468 eligible candidate teams scored with 0.00% algorithmic drift
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-[#10b981]/20 text-[#15803d] px-2 py-0.5 rounded border border-[#15803d]">
                1.4ms
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[#0f172a] bg-secondary-fixed shadow-[3px_3px_0px_#0f172a]">
              <span
                className={`material-symbols-outlined text-xl font-bold ${
                  progressStep >= 4 ? 'text-on-secondary-fixed' : 'text-on-secondary-fixed animate-spin'
                }`}
              >
                {progressStep >= 4 ? 'verified' : 'sync'}
              </span>
              <div className="flex-1">
                <div className="font-headline-sm text-sm font-black text-on-secondary-fixed">
                  Consensus State Sealed (Top {topQuota} Finalists Determined)
                </div>
                <div className="text-xs text-on-secondary-fixed-variant font-mono">
                  Result Hash: <b className="font-bold">0x8f92b7c4a17ef0d19c3b8a1e5d762f09ba1e5d76</b>
                </div>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-2 py-0.5 rounded border border-[#0f172a] font-bold">
                READY
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high border-2 border-[#0f172a] text-xs font-bold cursor-pointer hover:bg-surface-variant"
          >
            Review Sliders
          </button>

          <button
            type="button"
            disabled={progressStep < 4}
            onClick={onProceedToRankedResults}
            className="px-6 py-2.5 rounded-lg bg-primary-container text-white border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] font-label-md text-label-md uppercase font-black cursor-pointer hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span>Proceed to Stage 04: Ranked Results</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
