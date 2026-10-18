export default function RankedFilterToolbar({
  activeTrack,
  onSelectTrack,
  shortlistedOnly,
  onToggleShortlistedOnly,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  trackCounts = {
    all: 482,
    defi: 118,
    ai: 164,
    infra: 120,
    security: 48,
  },
}) {
  const tracks = [
    { id: 'all', label: `All Tracks (${trackCounts.all})` },
    { id: 'defi', label: `DeFi (${trackCounts.defi})` },
    { id: 'ai', label: `AI / Agent (${trackCounts.ai})` },
    { id: 'infra', label: `Infra (${trackCounts.infra})` },
    { id: 'security', label: `Security (${trackCounts.security})` },
  ];

  return (
    <div className="bg-surface-container-lowest p-3 rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-wrap items-center justify-between gap-space-sm">
      {/* Track Pill Buttons */}
      <div className="flex flex-wrap items-center gap-space-xs">
        {tracks.map((track) => {
          const isActive = activeTrack === track.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelectTrack(track.id)}
              className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer font-bold ${
                isActive
                  ? 'bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-surface hover:bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
              }`}
            >
              {track.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Checkbox, Sort & Search */}
      <div className="flex flex-wrap items-center gap-space-md">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined text-xs absolute left-2.5 top-2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search teams..."
            className="pl-8 pr-3 py-1 bg-surface-container-low font-label-sm text-label-sm text-on-surface rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] focus:outline-none focus:bg-white w-36 sm:w-44"
          />
        </div>

        {/* Shortlist Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer font-label-md text-label-md text-on-surface select-none font-bold">
          <input
            type="checkbox"
            checked={shortlistedOnly}
            onChange={(e) => onToggleShortlistedOnly(e.target.checked)}
            className="w-4 h-4 border-2 border-[#0f172a] rounded accent-primary-container cursor-pointer"
          />
          <span>Shortlisted Only (Top 40)</span>
        </label>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-surface-container-low font-label-sm text-label-sm font-bold text-on-surface py-1.5 pl-3 pr-7 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] focus:outline-none cursor-pointer"
          >
            <option value="score_desc">Total Score DESC</option>
            <option value="tech_desc">Tech Depth DESC</option>
            <option value="velocity_desc">GitHub Velocity DESC</option>
            <option value="risk_asc">Bubble Risk ASC</option>
          </select>
          <span className="material-symbols-outlined text-xs absolute right-2 top-2 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>
    </div>
  );
}
