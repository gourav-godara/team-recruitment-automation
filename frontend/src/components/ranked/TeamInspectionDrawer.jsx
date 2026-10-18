export default function TeamInspectionDrawer({
  team,
  onPromoteFinal,
  onFlagReeval,
  onCompareTeam,
}) {
  if (!team) return null;

  const isShortlisted = team.rank <= 40 && team.status_type !== 'excluded';

  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] overflow-hidden sticky top-20">
      {/* Drawer Top Bar */}
      <div className="bg-primary-container text-on-primary-container px-space-md py-space-sm flex items-center justify-between border-b-2 border-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">fact_check</span>
          <span className="font-label-lg text-label-lg uppercase tracking-wider font-extrabold">
            INSPECTION DRAWER
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono font-label-sm text-label-sm bg-surface-container-lowest text-on-surface px-2.5 py-0.5 rounded border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
          <span>RANK</span>
          <span className="font-extrabold text-primary">#{String(team.rank).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="p-space-lg flex flex-col gap-space-md max-h-[calc(100vh-10rem)] overflow-y-auto">
        {/* Team Identity Header */}
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                {team.team_name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-black shadow-[1px_1px_0px_#0f172a] ${
                  isShortlisted
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : team.status_type === 'excluded'
                    ? 'bg-error text-on-error'
                    : 'bg-surface-container-high text-on-surface'
                }`}
              >
                {isShortlisted ? 'SHORTLISTED' : team.status_type.toUpperCase()}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-mono mt-0.5">
              TEAM ID: {team.external_id} • {team.description}
            </p>
          </div>
        </div>

        {/* Big Score Panel */}
        <div className="bg-surface-container p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center justify-between">
          <div>
            <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Consensus Weighted Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-primary font-black">
                {team.total_score.toFixed(2)}
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                / 100
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant block font-medium">
              COHORT RANK
            </span>
            <span className="font-label-lg text-label-lg font-black text-[#10b981] font-mono">
              {team.cohort_percentile} %-tile
            </span>
          </div>
        </div>

        {/* Weighted Vectors Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider font-extrabold text-on-surface">
              Weighted Vectors Breakdown
            </span>
            <span className="font-mono font-label-sm text-label-sm text-on-surface-variant font-bold">
              4 Active Vectors
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono">
            {/* Metric 1: Tech */}
            <div className="bg-surface-container-low p-2.5 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface">Technical Depth (35%)</span>
                <span className="font-extrabold text-primary font-tabular-score">
                  {team.raw_vectors.tech.toFixed(1)} → +{team.weighted_contributions.tech.toFixed(2)} pts
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1.5 border border-[#0f172a]/30">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(team.raw_vectors.tech / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                {team.telemetry.tech_notes}
              </span>
            </div>

            {/* Metric 2: Repo */}
            <div className="bg-surface-container-low p-2.5 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface">GitHub Quality (25%)</span>
                <span className="font-extrabold text-on-surface font-tabular-score">
                  {team.raw_vectors.repo.toFixed(1)} → +{team.weighted_contributions.repo.toFixed(2)} pts
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1.5 border border-[#0f172a]/30">
                <div
                  className="bg-[#10b981] h-full transition-all"
                  style={{ width: `${(team.raw_vectors.repo / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                {team.telemetry.repo_notes}
              </span>
            </div>

            {/* Metric 3: Pitch */}
            <div className="bg-surface-container-low p-2.5 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface">Presentation &amp; Fit (20%)</span>
                <span className="font-extrabold text-on-surface font-tabular-score">
                  {team.raw_vectors.pitch.toFixed(1)} → +{team.weighted_contributions.pitch.toFixed(2)} pts
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1.5 border border-[#0f172a]/30">
                <div
                  className="bg-secondary-fixed-dim h-full transition-all"
                  style={{ width: `${(team.raw_vectors.pitch / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                {team.telemetry.pitch_notes}
              </span>
            </div>

            {/* Metric 4: Velocity */}
            <div className="bg-surface-container-low p-2.5 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface">Team Velocity (20%)</span>
                <span className="font-extrabold text-secondary font-tabular-score">
                  {team.raw_vectors.velocity.toFixed(1)} → +{team.weighted_contributions.velocity.toFixed(2)} pts
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1.5 border border-[#0f172a]/30">
                <div
                  className="bg-[#8b5cf6] h-full transition-all"
                  style={{ width: `${(team.raw_vectors.velocity / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                {team.telemetry.velocity_notes}
              </span>
            </div>
          </div>
        </div>

        {/* Hard Eligibility Gates Checklist */}
        <div className="bg-surface-container p-space-md rounded-xl border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md uppercase font-bold text-on-surface">
              Hard Eligibility Gates
            </span>
            <span
              className={`font-label-sm text-label-sm font-mono font-bold ${
                team.rules_passed === team.rules_total ? 'text-[#10b981]' : 'text-error'
              }`}
            >
              {team.rules_passed} / {team.rules_total} PASSED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {team.rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-on-surface">
                <span
                  className={`material-symbols-outlined text-sm font-bold ${
                    rule.passed ? 'text-[#10b981]' : 'text-error'
                  }`}
                >
                  {rule.passed ? 'check_circle' : 'cancel'}
                </span>
                <span className="truncate">{rule.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Team Roster */}
        <div>
          <span className="font-label-md text-label-md uppercase font-bold text-on-surface block mb-2">
            Verified Roster ({team.members.length} Members)
          </span>
          <div className="flex flex-col gap-2">
            {team.members.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a]"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full border border-[#0f172a] object-cover"
                  />
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">
                      {member.name}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      {member.role}
                    </div>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-base ${
                    member.verified ? 'text-[#10b981]' : 'text-on-surface-variant'
                  }`}
                  title={member.verified ? 'Verified Hackathon Registrant' : 'Unverified profile'}
                >
                  {member.verified ? 'verified_user' : 'help_outline'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Drawer Action CTAs */}
        <div className="pt-space-sm border-t-2 border-[#0f172a] flex flex-col sm:flex-row gap-space-sm">
          <button
            type="button"
            onClick={() => onPromoteFinal(team)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg uppercase border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">military_tech</span>
            <span>Promote to Final</span>
          </button>

          <button
            type="button"
            onClick={() => onFlagReeval(team)}
            className="py-2.5 px-4 rounded-lg bg-surface-container-lowest hover:bg-error-container text-on-surface font-label-lg text-label-lg uppercase border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base text-error">flag</span>
            <span>Flag Re-eval</span>
          </button>
        </div>
      </div>
    </div>
  );
}
