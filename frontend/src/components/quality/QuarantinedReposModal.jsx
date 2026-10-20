import { useState } from 'react';

export default function QuarantinedReposModal({
  teams,
  onClose,
  onUpdateTeamStatus,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'quarantined' | 'overridden' | 'excluded'

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.team_name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.repo_url.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const quarantinedCount = teams.filter((t) => t.status === 'quarantined').length;
  const overriddenCount = teams.filter((t) => t.status === 'overridden').length;
  const excludedCount = teams.filter((t) => t.status === 'excluded').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-container-lowest border-2 border-[#0f172a] rounded-xl shadow-[8px_8px_0px_#0f172a] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-tertiary-fixed border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
              <span className="material-symbols-outlined font-bold text-xl">priority_high</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-tertiary-fixed font-black">
                  14 Private / 404 GitHub Repositories
                </h3>
                <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-tertiary text-on-tertiary rounded-full border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                  Hard Gate Quarantine
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-tertiary-fixed-variant text-xs font-semibold">
                Direct API health check failed. Review repository URLs, verify jury overrides, or confirm DQ exclusion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center font-bold text-on-surface cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-surface-container-low border-b-2 border-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team ID, name or repo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`font-label-sm text-label-sm px-3 py-1 rounded-full border border-[#0f172a] cursor-pointer font-bold ${
                filter === 'all'
                  ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              All ({teams.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('quarantined')}
              className={`font-label-sm text-label-sm px-3 py-1 rounded-full border border-[#0f172a] cursor-pointer font-bold ${
                filter === 'quarantined'
                  ? 'bg-tertiary text-on-tertiary shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              Blocked ({quarantinedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('overridden')}
              className={`font-label-sm text-label-sm px-3 py-1 rounded-full border border-[#0f172a] cursor-pointer font-bold ${
                filter === 'overridden'
                  ? 'bg-[#10b981] text-white shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              Jury Override ({overriddenCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('excluded')}
              className={`font-label-sm text-label-sm px-3 py-1 rounded-full border border-[#0f172a] cursor-pointer font-bold ${
                filter === 'excluded'
                  ? 'bg-[#0f172a] text-white shadow-[2px_2px_0px_#0f172a]'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              Excluded ({excludedCount})
            </button>
          </div>
        </div>

        {/* Teams Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredTeams.map((team) => {
              const isOverridden = team.status === 'overridden';
              const isExcluded = team.status === 'excluded';

              return (
                <div
                  key={team.id}
                  className={`p-3.5 rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
                    isOverridden
                      ? 'bg-emerald-50 border-emerald-800'
                      : isExcluded
                      ? 'bg-slate-100 opacity-75'
                      : 'bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface-container border border-[#0f172a]">
                        {team.id}
                      </span>
                      <span className="font-headline-sm text-base text-on-surface font-extrabold">
                        {team.team_name}
                      </span>
                      <span
                        className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-[#0f172a] font-mono font-bold ${
                          team.http_status.includes('404')
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed text-on-secondary-fixed'
                        }`}
                      >
                        {team.http_status}
                      </span>
                      {isOverridden && (
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#10b981] text-white border border-[#0f172a] font-bold">
                          ✓ JURY OVERRIDE
                        </span>
                      )}
                      {isExcluded && (
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#0f172a] text-white border border-[#0f172a] font-bold">
                          DQ EXCLUDED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono text-on-surface-variant">
                      <a
                        href={team.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        <span>{team.repo_url}</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                      <span className="hidden sm:inline">•</span>
                      <span>Captain: {team.captain_name} ({team.captain_email})</span>
                    </div>

                    <p className="font-body-sm text-xs text-tertiary font-semibold">
                      Reason: {team.failure_reason}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {!isOverridden ? (
                      <button
                        type="button"
                        onClick={() => onUpdateTeamStatus(team.id, 'overridden')}
                        className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-emerald-200 active:translate-x-0.5 active:translate-y-0.5 transition-all font-bold cursor-pointer"
                        title="Authorize manual jury verification override (Rule 2)"
                      >
                        Verify Override
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateTeamStatus(team.id, 'quarantined')}
                        className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-high transition-all font-bold cursor-pointer"
                      >
                        Re-block
                      </button>
                    )}

                    {!isExcluded ? (
                      <button
                        type="button"
                        onClick={() => onUpdateTeamStatus(team.id, 'excluded')}
                        className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-tertiary hover:text-white transition-all font-bold cursor-pointer"
                        title="Exclude from ranking run"
                      >
                        Exclude
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateTeamStatus(team.id, 'quarantined')}
                        className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container-high transition-all font-bold cursor-pointer"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTeams.length === 0 && (
              <div className="p-8 text-center bg-surface-container-low rounded-xl border border-[#0f172a]/20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                  search_off
                </span>
                <p className="font-headline-sm text-sm text-on-surface font-bold">
                  No teams found matching search criteria
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t-2 border-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-on-surface-variant font-semibold">
            {overriddenCount} manual overrides applied • {quarantinedCount} remaining blocked
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto font-label-lg text-label-lg px-6 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] font-black cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all"
          >
            Done &amp; Seal Status
          </button>
        </div>
      </div>
    </div>
  );
}
