export default function ImputationDetailModal({ vector, onClose }) {
  if (!vector) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-container-lowest border-2 border-[#0f172a] rounded-xl shadow-[8px_8px_0px_#0f172a] w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface-container-low border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
              <span className={`material-symbols-outlined font-bold text-xl ${vector.iconColor}`}>
                {vector.icon}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-black">
                  {vector.attribute}
                </h3>
                <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full border border-[#0f172a] font-bold">
                  Weight: {vector.weight}
                </span>
              </div>
              <p className="font-body-sm text-xs font-mono text-on-surface-variant font-semibold">
                DB Target: {vector.dbMapping}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-bold text-on-surface cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-surface-container border border-[#0f172a]">
              <span className="text-on-surface-variant block font-bold">Handling Strategy</span>
              <span className="text-sm font-bold text-primary">{vector.handlingStrategy}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container border border-[#0f172a]">
              <span className="text-on-surface-variant block font-bold">Imputation Policy</span>
              <span className="text-sm font-bold text-on-surface">{vector.imputationPolicy}</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border-2 border-[#0f172a] space-y-2">
            <h4 className="font-headline-sm text-sm text-on-surface font-extrabold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">analytics</span>
              Mathematical Rationale &amp; Zero-Bias Prevention
            </h4>
            <p className="font-body-sm text-xs text-on-surface leading-relaxed font-medium">
              {vector.description}
            </p>
            <div className="p-2.5 rounded bg-secondary-fixed/30 border border-[#0f172a] text-xs font-mono font-semibold text-on-secondary-fixed">
              <strong>Database Compliance:</strong> {vector.ruleDetail}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-[#0f172a] flex items-center justify-between text-xs font-mono">
            <span>Missing Records: <strong className="text-tertiary">{vector.missing}</strong> / 482</span>
            <span>Null Ratio: <strong className="text-primary">{vector.nullRatio.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-black cursor-pointer"
          >
            Acknowledge Policy
          </button>
        </div>
      </div>
    </div>
  );
}
