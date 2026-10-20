import { useState } from 'react';

export default function NullitySpectrumCard({ cohorts, onCohortSelect }) {
  const [activeCohort, setActiveCohort] = useState(null);

  const handleCohortClick = (cohortId) => {
    const next = activeCohort === cohortId ? null : cohortId;
    setActiveCohort(next);
    if (onCohortSelect) {
      onCohortSelect(next);
    }
  };

  const selectedSegment = cohorts.segments.find((s) => s.id === activeCohort);

  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
            Nullity Distribution Spectrum
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Cohort split across single-vector omissions and total gating completeness.
          </p>
        </div>
        <span className="font-label-sm text-label-sm font-mono px-2 py-1 bg-surface-container text-on-surface rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold self-start sm:self-auto">
          {cohorts.total} Total Entities
        </span>
      </div>

      {/* Multi-segment progress bar */}
      <div className="w-full h-8 rounded-lg bg-surface-container overflow-hidden flex border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] my-2">
        {cohorts.segments.map((segment) => {
          const isSelected = activeCohort === segment.id;
          return (
            <div
              key={segment.id}
              onClick={() => handleCohortClick(segment.id)}
              className={`${segment.color} flex items-center justify-center font-label-sm text-label-sm font-black cursor-pointer transition-all hover:brightness-105 ${
                activeCohort && !isSelected ? 'opacity-40' : 'opacity-100'
              }`}
              style={{ width: `${segment.pct}%` }}
              title={`${segment.label}: ${segment.count} teams (${segment.pct}%) - Click to inspect`}
            >
              {segment.pct >= 5 ? `${segment.pct}%` : '!'}
            </div>
          );
        })}
      </div>

      {/* Legend Pills */}
      <div className="flex flex-wrap items-center gap-space-md mt-space-sm pt-2">
        {cohorts.segments.map((segment) => {
          const isSelected = activeCohort === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => handleCohortClick(segment.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0f172a] bg-surface-container-high shadow-[2px_2px_0px_#0f172a] translate-x-0.5'
                  : 'border-transparent hover:bg-surface-container-low'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] ${segment.legendColor}`}
              ></span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                {segment.label} ({segment.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Cohort Insight Banner if clicked */}
      {selectedSegment && (
        <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm font-bold text-primary">
              insights
            </span>
            <span className="text-on-surface font-medium">
              <strong className="font-bold">{selectedSegment.label}:</strong> {selectedSegment.description}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCohortClick(selectedSegment.id)}
            className="text-on-surface-variant hover:text-on-surface font-bold text-xs ml-2 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
