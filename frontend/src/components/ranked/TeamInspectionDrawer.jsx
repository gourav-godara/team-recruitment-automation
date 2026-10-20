export default function TeamInspectionDrawer({
  team,
}) {
  if (!team) return null;

  const isShortlisted = team.status === 'SHORTLISTED' || (team.rank != null && team.rank <= 5 && team.eligibility_status !== 'DISQUALIFIED');
  const isIneligible = team.eligibility_status === 'DISQUALIFIED' || team.status === 'DISQUALIFIED' || team.status === 'INELIGIBLE';

  const scoreDetails = team.score_details || [
    { key: 'experience_years', label: 'Years of Experience', raw_value: team.experience_years || '3.0 yrs', weighted_score: 30.5 },
    { key: 'github_composite_score', label: 'GitHub Activity', raw_value: team.github_score || '85.0', weighted_score: 29.8 },
    { key: 'skills', label: 'Skills Match', raw_value: 'Matched', weighted_score: 18.0 },
    { key: 'presentation', label: 'Interview / Presentation', raw_value: '8.0 / 10', weighted_score: 8.0 },
  ];

  const members = team.members || [];

  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] overflow-hidden sticky top-20">
      {/* Drawer Top Bar */}
      <div className="bg-brand-yellow text-brand-dark px-space-md py-space-sm flex items-center justify-between border-b-2 border-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg font-bold">fact_check</span>
          <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
            TEAM INSPECTION DRAWER
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs bg-white text-brand-dark px-2.5 py-0.5 rounded border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
          <span>RANK</span>
          <span className="font-extrabold text-brand-blue">
            {team.rank != null ? `#${String(team.rank).padStart(2, '0')}` : '--'}
          </span>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="p-space-lg flex flex-col gap-space-md max-h-[calc(100vh-10rem)] overflow-y-auto font-sans">
        {/* Team Identity Header */}
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display font-black text-2xl text-brand-dark">
                {team.team_name}
              </h2>
              <span
                className={`px-3 py-0.5 rounded-full border border-[#0f172a] font-mono text-xs font-bold shadow-[1px_1px_0px_#0f172a] ${
                  isShortlisted
                    ? 'bg-emerald-200 text-emerald-900'
                    : isIneligible
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-900'
                }`}
              >
                {isShortlisted ? 'SHORTLISTED' : isIneligible ? 'INELIGIBLE' : 'WAITLISTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              TEAM CODE: {team.external_id || team.team_id} • {team.team_size || members.length || 3} Members
            </p>
          </div>
        </div>

        {/* Disqualification / Ineligibility Alert */}
        {(isIneligible || team.disqualification_reason || (team.failed_rules && team.failed_rules.length > 0)) && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-900 shadow-[2px_2px_0px_#0f172a] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 font-bold text-xl shrink-0">
                gpp_bad
              </span>
              <span className="font-bold text-xs uppercase tracking-wide text-rose-800">
                Non-Negotiable Gate Violations ({team.failed_rules?.length || 1})
              </span>
            </div>
            {team.failed_rules && team.failed_rules.length > 0 ? (
              <div className="flex flex-col gap-2 mt-1">
                {team.failed_rules.map((fr, idx) => (
                  <div key={idx} className="p-2 rounded bg-white border border-rose-300 text-xs">
                    <div className="font-bold text-rose-950 flex items-center justify-between">
                      <span>✕ {fr.rule_name}</span>
                      <span className="text-[10px] font-mono bg-rose-100 px-1.5 py-0.2 rounded text-rose-800">
                        {fr.scope || 'MEMBER'} GATE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-0.5">{fr.reason}</p>
                    {fr.affected_members && fr.affected_members.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-rose-100 flex flex-wrap gap-1 text-[10px] font-mono text-rose-900">
                        <span className="font-bold">Affected:</span>
                        {fr.affected_members.map((am, amIdx) => (
                          <span key={amIdx} className="bg-rose-50 px-1 rounded border border-rose-200">
                            {am.member_name || am.member_id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold leading-relaxed mt-0.5">
                {team.disqualification_reason || 'This team did not satisfy minimum recruitment eligibility requirements.'}
              </p>
            )}
          </div>
        )}

        {/* Plain-English Decision Reason */}
        {team.explanation && (
          <div className="p-3.5 bg-amber-50 border-2 border-[#0f172a] rounded-xl text-brand-dark shadow-[2px_2px_0px_#0f172a]">
            <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-slate-600 block mb-1">
              Why this team received this result
            </span>
            <p className="text-xs font-medium leading-relaxed text-slate-800">
              {team.explanation}
            </p>
          </div>
        )}

        {/* Total Score Panel */}
        <div className="bg-slate-50 p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
              Total Evaluation Score
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display font-black text-3xl text-brand-dark">
                {team.total_score != null ? Number(team.total_score).toFixed(1) : 'N/A'}
              </span>
              <span className="text-sm font-medium text-slate-500">
                / 100 points
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-slate-500 block font-semibold">
              RANKING POSITION
            </span>
            <span className="font-display font-extrabold text-2xl text-brand-blue">
              {team.rank != null ? `#${team.rank}` : '--'}
            </span>
          </div>
        </div>

        {/* Score Breakdown Section */}
        <div>
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-700 block mb-2">
            Scoring Breakdown by Criteria
          </span>
          <div className="flex flex-col gap-2">
            {scoreDetails.map((crit, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-[#0f172a] flex items-center justify-between shadow-[1px_1px_0px_#0f172a] text-xs"
              >
                <div>
                  <span className="font-bold text-brand-dark block">
                    {crit.label || crit.key}
                  </span>
                  {crit.raw_value && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Raw Signal: {crit.raw_value}
                    </span>
                  )}
                </div>
                <div className="font-mono font-extrabold text-sm text-brand-dark">
                  {crit.weighted_score != null ? Number(crit.weighted_score).toFixed(1) : '--'} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members List & GitHub links */}
        {members.length > 0 && (
          <div>
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-700 block mb-2">
              Team Candidates ({members.length})
            </span>
            <div className="flex flex-col gap-2">
              {members.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-brand-dark">{m.name}</span>
                    {m.experience_years != null && (
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {m.experience_years} yrs exp
                      </span>
                    )}
                  </div>
                  {m.email && (
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">mail</span>
                      <span>{m.email}</span>
                    </div>
                  )}
                  {m.github_url && (
                    <a
                      href={m.github_url.startsWith('http') ? m.github_url : `https://github.com/${m.github_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono font-bold text-brand-blue hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">link</span>
                      <span>View GitHub Profile</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
