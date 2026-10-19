import { useState } from 'react';

export default function SchemaFooterActions({ onProceed }) {
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  const handleProceedClick = () => {
    if (isSealing || isSealed) return;
    setIsSealing(true);
    setTimeout(() => {
      setIsSealing(false);
      setIsSealed(true);
      if (onProceed) {
        onProceed();
      }
    }, 800);
  };

  return (
    <div className="flex flex-col gap-space-lg mb-space-lg">
      {/* 3 Retro Pop Feature Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest p-space-md rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] shrink-0">
            <span className="material-symbols-outlined text-on-surface text-2xl font-bold">memory</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface leading-snug font-bold">
              Deterministic Parser
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
              Identical input always yields identical hash score vectors across judges.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">verified_user</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface leading-snug font-bold">
              Immutable Hash Seal
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
              Stage 1 lock generates SHA-256 state seal prior to scoring initialization.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-lg bg-[#10b981]/30 flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] shrink-0">
            <span className="material-symbols-outlined text-[#10b981] text-2xl font-bold">balance</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface leading-snug font-bold">
              No Zero-Bias Scaling
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
              Unfilled rubric metrics penalize with weighted Bayesian null, not raw zero.
            </p>
          </div>
        </div>
      </div>

      {/* TACTILE MASTER ACTION STRIP */}
      <div className="bg-surface-container-lowest p-space-md rounded-lg border-2 border-[#0f172a] shadow-[5px_5px_0px_#0f172a] flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-bold text-on-surface shrink-0">
            !
          </div>
          <div>
            <div className="font-label-lg text-label-lg text-on-surface font-extrabold">
              Ready for Ingestion Phase 02: Data Quality Verification
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant text-xs">
              Schema match covers 100% of mandatory track criteria. Unmapped fields will default to null.
            </div>
          </div>
        </div>

        <button
          type="button"
          id="btn-proceed"
          onClick={handleProceedClick}
          disabled={isSealing}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg font-headline-sm text-headline-sm font-extrabold uppercase tracking-tight border-2 border-[#0f172a] transition-all flex items-center justify-center gap-space-sm cursor-pointer ${
            isSealed
              ? 'bg-[#10b981] text-white shadow-[2px_2px_0px_#0f172a]'
              : 'bg-secondary-fixed text-on-secondary-fixed shadow-[4px_4px_0px_#0f172a] hover:bg-secondary-fixed-dim hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0f172a] active:translate-x-1 active:translate-y-1 active:shadow-none'
          }`}
        >
          {isSealing ? (
            <>
              <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
              <span>Sealing Schema Hash...</span>
            </>
          ) : isSealed ? (
            <>
              <span>Schema Sealed &amp; Validated!</span>
              <span className="material-symbols-outlined text-xl">check</span>
            </>
          ) : (
            <>
              <span>Confirm Schema &amp; Proceed to Quality Checks</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
