export default function BentoSpecimenGrid({
  datasetInfo,
  granularity,
  onGranularityChange,
  mappedCount,
  unmappedCount,
  conflictsCount,
  totalCount,
  onReuploadClick,
  onQuickPreviewClick,
}) {
  const compliancePercentage = totalCount > 0 ? ((mappedCount / totalCount) * 100).toFixed(1) : '0.0';
  const circumference = 251.2;
  const strokeOffset = circumference - (circumference * parseFloat(compliancePercentage)) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg mb-space-xl">
      {/* CARD 1: SOURCE FILE SPECIMEN (5 Cols) */}
      <div className="lg:col-span-5 bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between overflow-hidden">
        <div className="p-space-md bg-secondary-fixed/30 border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface text-xl">database</span>
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold">
              Source File Specimen
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-black rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
            VALIDATED
          </span>
        </div>

        <div className="p-space-md flex flex-col gap-space-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-headline-sm font-headline-sm text-on-surface font-bold">
                {datasetInfo.name}
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Payload footprint: <strong className="text-on-surface">{datasetInfo.file_size}</strong> • Raw row count:{' '}
                <strong className="text-on-surface">{datasetInfo.total_teams} items</strong>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-mono font-bold text-primary">
              CSV
            </div>
          </div>

          {/* Specimen Metadata Checklist */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low border border-[#0f172a]">
              <span className="material-symbols-outlined text-sm text-[#10b981] font-bold">check_circle</span>
              <span className="text-on-surface font-semibold">UTF-8 Verified</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low border border-[#0f172a]">
              <span className="material-symbols-outlined text-sm text-[#10b981] font-bold">check_circle</span>
              <span className="text-on-surface font-semibold">{datasetInfo.delimiter}</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low border border-[#0f172a]">
              <span className="material-symbols-outlined text-sm text-[#10b981] font-bold">check_circle</span>
              <span className="text-on-surface font-semibold">Header Row Present</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low border border-[#0f172a]">
              <span className="material-symbols-outlined text-sm text-primary font-bold">fingerprint</span>
              <span className="text-on-surface font-semibold">SHA-256: 9b2d...1a4</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between gap-space-sm flex-wrap">
          <button
            type="button"
            id="btn-reupload-file"
            onClick={onReuploadClick}
            className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all font-label-md text-label-md flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">sync</span>
            Re-upload File
          </button>
          <button
            type="button"
            id="btn-quick-preview"
            onClick={onQuickPreviewClick}
            className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all font-label-md text-label-md flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            Quick Preview (50 rows)
          </button>
        </div>
      </div>

      {/* CARD 2: GRANULARITY & AGGREGATION ENGINE (4 Cols) */}
      <div className="lg:col-span-4 bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between overflow-hidden">
        <div className="p-space-md bg-primary-fixed/40 border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">tune</span>
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold">
              Granularity Matrix
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container border border-[#0f172a] font-bold">
            AUTO-ROLLUP
          </span>
        </div>

        <div className="p-space-md flex flex-col gap-space-md">
          {/* Granularity Radio Pill Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm uppercase font-extrabold text-on-surface-variant">
              Entity Resolution Strategy
            </span>
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-lg border-2 border-[#0f172a]">
              <button
                type="button"
                id="toggle-team"
                onClick={() => onGranularityChange('team')}
                className={`py-1.5 px-2 text-center rounded font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  granularity === 'team'
                    ? 'bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                    : 'text-on-surface hover:bg-surface-container-lowest border-2 border-transparent'
                }`}
              >
                Team Records
              </button>
              <button
                type="button"
                id="toggle-member"
                onClick={() => onGranularityChange('member')}
                className={`py-1.5 px-2 text-center rounded font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  granularity === 'member'
                    ? 'bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                    : 'text-on-surface hover:bg-surface-container-lowest border-2 border-transparent'
                }`}
              >
                Member Records
              </button>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-1 leading-snug">
              {granularity === 'team' ? (
                <>
                  Current mode: <strong>1 submission row = 1 project entity</strong>. Cleanest topology for high-frequency judging.
                </>
              ) : (
                <>
                  Current mode: <strong>Individual hacker rows rollup automatically</strong> into unified project entries by team_id.
                </>
              )}
            </span>
          </div>

          {/* Rollup Strategies Pill Badges */}
          <div className="flex flex-col gap-2 pt-2 border-t-2 border-surface-container-highest">
            <span className="font-label-sm text-label-sm uppercase font-extrabold text-on-surface-variant">
              Active Aggregators
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                Tech Skill → <span className="bg-surface-container-lowest px-1 rounded text-on-surface">MAX</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-mono text-xs font-bold border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                Commits → <span className="bg-surface-container-lowest px-1 rounded text-on-surface">MEAN</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-mono text-xs font-bold border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                Prizes → <span className="bg-surface-container-lowest px-1 rounded text-on-surface">SUM</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-space-sm bg-surface-container-low border-t-2 border-[#0f172a] text-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            Zero collisions detected on Primary Key [team_id]
          </span>
        </div>
      </div>

      {/* CARD 3: SCHEMA INTEGRITY SCORE (3 Cols) */}
      <div className="lg:col-span-3 bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between overflow-hidden">
        <div className="p-space-md bg-[#10b981]/20 border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#10b981] text-xl font-bold">format_image_left</span>
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold">
              Integrity Gauge
            </span>
          </div>
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface-container-lowest border border-[#0f172a]">
            STAGE A
          </span>
        </div>

        <div className="p-space-md flex flex-col items-center justify-center text-center">
          {/* Neo-Memphis Circular Progress Donut */}
          <div className="relative w-28 h-28 flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#eaedff" strokeWidth="12"></circle>
              <circle
                className="transition-all duration-700 ease-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#2563eb"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                strokeWidth="12"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight leading-none">
                {compliancePercentage}%
              </span>
              <span className="font-label-sm text-label-sm uppercase font-mono text-on-surface-variant mt-0.5 font-bold">
                COMPLIANT
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-1 pt-3 border-t-2 border-surface-container-highest mt-2">
            <div className="bg-surface-container p-1.5 rounded border border-[#0f172a] text-center">
              <div className="font-tabular-score text-tabular-score text-on-surface leading-tight font-mono font-bold">
                {mappedCount}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">Auto-Mapped</div>
            </div>
            <div className="bg-secondary-fixed/50 p-1.5 rounded border border-[#0f172a] text-center">
              <div className="font-tabular-score text-tabular-score text-[#ad0033] leading-tight font-mono font-bold">
                {unmappedCount}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">Unmapped</div>
            </div>
            <div className="bg-[#10b981]/20 p-1.5 rounded border border-[#0f172a] text-center">
              <div className="font-tabular-score text-tabular-score text-[#10b981] leading-tight font-mono font-bold">
                {conflictsCount}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">Conflicts</div>
            </div>
          </div>
        </div>

        <div className="px-space-md py-2 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary font-bold">info</span>
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
            Min. threshold for Stage 2 is 80.0%
          </span>
        </div>
      </div>
    </div>
  );
}
