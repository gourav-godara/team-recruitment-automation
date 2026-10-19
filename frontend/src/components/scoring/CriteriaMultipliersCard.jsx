import { mockWeightPresets, mockScoringCriteria } from '../../data/mockScoring';

export default function CriteriaMultipliersCard({
  weights,
  onWeightChange,
  activePreset,
  onSelectPreset,
  curveType,
  onToggleCurve,
  autoBalance,
  onToggleAutoBalance,
  onNormalizeWeights,
}) {
  const totalSum = (weights.w1 + weights.w2 + weights.w3 + weights.w4);
  const isBalanced = totalSum === 100;

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col gap-space-lg">
      {/* Column Header with Preset Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b-2 border-surface-container pb-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-container border border-[#0f172a]"></span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Criteria Multipliers &amp; Sliders
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Adjust relative weight vectors across preliminary scoring models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Curve Toggle Pill */}
          <button
            type="button"
            onClick={onToggleCurve}
            className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-full border border-[#0f172a] text-xs font-bold hover:bg-surface-variant transition-all cursor-pointer shadow-[1px_1px_0px_#0f172a]"
            title="Switch between Z-Score and Min-Max Normalization"
          >
            <span className="material-symbols-outlined text-xs text-primary">show_chart</span>
            <span className="font-label-sm text-label-sm font-mono text-on-surface">
              {curveType === 'z_score' ? 'Curve: Z-Score' : 'Curve: Min-Max'}
            </span>
          </button>

          {/* Auto-balancing toggle */}
          <button
            type="button"
            onClick={onToggleAutoBalance}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#0f172a] text-xs font-bold transition-all cursor-pointer shadow-[1px_1px_0px_#0f172a] ${
              autoBalance
                ? 'bg-secondary-fixed text-on-secondary-fixed'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-xs">balance</span>
            <span className="font-label-sm text-label-sm font-bold">
              Auto-Balancing {autoBalance ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-extrabold tracking-wider">
          Quick Vector Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.values(mockWeightPresets).map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`preset-btn px-3 py-1.5 rounded-lg border-2 border-[#0f172a] font-label-md text-label-md transition-all cursor-pointer font-bold ${
                  isSelected
                    ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[2px_2px_0px_#0f172a]'
                    : 'bg-surface-container-low text-on-surface shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-high'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slider Rows */}
      {mockScoringCriteria.map((criterion) => {
        const val = weights[criterion.id] || 0;
        return (
          <div
            key={criterion.id}
            className="p-space-md rounded-lg bg-surface-container-low border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex flex-col gap-space-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded ${criterion.bgColor} ${criterion.textColor} font-mono text-xs flex items-center justify-center font-bold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]`}
                >
                  {criterion.code}
                </span>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                    {criterion.name}
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    mapped: <code className="text-primary font-bold">{criterion.mappedSource}</code>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1 rounded-md border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
                <span className="font-tabular-score text-tabular-score text-primary font-extrabold">
                  {val}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant font-bold">%</span>
              </div>
            </div>

            {/* Slider Control Bar */}
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm font-mono text-on-surface-variant">0%</span>
              <input
                type="range"
                min="0"
                max="70"
                value={val}
                onChange={(e) => onWeightChange(criterion.id, parseInt(e.target.value, 10))}
                className={`w-full h-3 bg-surface-container rounded-lg appearance-none cursor-pointer ${criterion.accentColor} border-2 border-[#0f172a]`}
              />
              <span className="font-label-sm text-label-sm font-mono text-on-surface-variant">70%</span>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
              <span>{criterion.statInfo}</span>
              <span className="bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.5 rounded border border-[#0f172a] font-mono font-bold">
                {criterion.curveBadge}
              </span>
            </div>
          </div>
        );
      })}

      {/* Weight Sum Segmented Indicator Bar */}
      <div className="p-space-md rounded-lg bg-surface-container-high border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-base font-bold ${
                isBalanced ? 'text-[#10b981]' : 'text-error'
              }`}
            >
              {isBalanced ? 'check_circle' : 'warning'}
            </span>
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Vector Sum Check
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`font-tabular-score text-tabular-score font-black ${
                isBalanced ? 'text-on-surface' : 'text-error'
              }`}
            >
              {totalSum}%
            </span>
            {isBalanced ? (
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#10b981] text-on-primary border border-[#0f172a] font-bold">
                BALANCED
              </span>
            ) : (
              <button
                type="button"
                onClick={onNormalizeWeights}
                className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-error text-on-error border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a] hover:bg-error/90 cursor-pointer flex items-center gap-1"
                title="Click to proportionally normalize sum to 100%"
              >
                <span>Normalize to 100%</span>
                <span className="material-symbols-outlined text-xs">auto_fix_high</span>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-4 w-full bg-surface-container-lowest rounded-full border-2 border-[#0f172a] overflow-hidden flex shadow-inner">
          <div
            className="bg-primary-container h-full transition-all duration-200"
            style={{ width: `${(weights.w1 / (totalSum || 1)) * 100}%` }}
            title={`Tech: ${weights.w1}%`}
          ></div>
          <div
            className="bg-[#10b981] h-full transition-all duration-200"
            style={{ width: `${(weights.w2 / (totalSum || 1)) * 100}%` }}
            title={`Repo: ${weights.w2}%`}
          ></div>
          <div
            className="bg-secondary-fixed h-full transition-all duration-200"
            style={{ width: `${(weights.w3 / (totalSum || 1)) * 100}%` }}
            title={`Pitch: ${weights.w3}%`}
          ></div>
          <div
            className="bg-[#8b5cf6] h-full transition-all duration-200"
            style={{ width: `${(weights.w4 / (totalSum || 1)) * 100}%` }}
            title={`Sprint: ${weights.w4}%`}
          ></div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-on-surface-variant pt-1 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-primary-container rounded border border-[#0f172a]"></span>{' '}
              Tech: {weights.w1}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#10b981] rounded border border-[#0f172a]"></span>{' '}
              Repo: {weights.w2}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-secondary-fixed rounded border border-[#0f172a]"></span>{' '}
              Pitch: {weights.w3}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#8b5cf6] rounded border border-[#0f172a]"></span>{' '}
              Sprint: {weights.w4}%
            </span>
          </div>
          <span className="font-bold text-on-surface">Sum: {totalSum}.0%</span>
        </div>
      </div>
    </div>
  );
}
