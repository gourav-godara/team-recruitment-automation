export default function RankedFilterToolbar({
  activeFilter,
  onSelectFilter,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  counts = { all: 0, shortlisted: 0, waitlisted: 0, ineligible: 0 },
}) {
  const filterTabs = [
    { id: 'all', label: `All Teams (${counts.all})` },
    { id: 'shortlisted', label: `Shortlisted (${counts.shortlisted})`, color: 'bg-emerald-100 text-emerald-800' },
    { id: 'waitlisted', label: `Waitlisted (${counts.waitlisted})`, color: 'bg-blue-100 text-blue-800' },
    { id: 'ineligible', label: `Ineligible (${counts.ineligible})`, color: 'bg-rose-100 text-rose-800' },
  ];

  return (
    <div className="bg-surface-container-lowest p-3 rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-wrap items-center justify-between gap-space-sm">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-space-xs">
        {filterTabs.map((tab) => {
          const isActive = (activeFilter || 'all') === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer font-bold ${
                isActive
                  ? 'bg-[#0f172a] text-white border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-white hover:bg-slate-100 text-on-surface border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Sort & Search */}
      <div className="flex flex-wrap items-center gap-space-md">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined text-sm absolute left-2.5 top-2 text-on-surface-variant font-bold">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search team or candidate..."
            className="pl-8 pr-3 py-1 bg-surface-container rounded-lg border-2 border-[#0f172a] font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest font-medium w-48 sm:w-64"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 font-mono font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-bold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-surface-container px-2 py-1 rounded border-2 border-[#0f172a] font-bold focus:outline-none cursor-pointer"
          >
            <option value="rank_asc">Rank (1 to Top)</option>
            <option value="score_desc">Highest Score</option>
            <option value="score_asc">Lowest Score</option>
            <option value="name_asc">Team Name (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
