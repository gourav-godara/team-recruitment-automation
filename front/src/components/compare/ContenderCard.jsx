export default function ContenderCard({
  team,
  isSelected,
  onVote,
  cardId,
}) {
  return (
    <div
      id={cardId}
      className={`bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] overflow-hidden flex flex-col transition-all ${
        isSelected
          ? 'shadow-[6px_6px_0px_#0f172a] -translate-x-0.5 -translate-y-0.5'
          : 'shadow-[4px_4px_0px_#0f172a]'
      }`}
    >
      {/* Top Strip / Status Header */}
      <div className="bg-surface-container-high px-space-md py-space-sm border-b-2 border-[#0f172a] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="font-headline-sm text-headline-sm font-black text-on-surface font-mono">
            #{team.rank}
          </span>
          <span
            className={`font-label-sm text-label-sm px-2.5 py-1 rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-black uppercase ${
              team.status_type === 'cutoff_in' || team.status_type === 'locked'
                ? 'bg-[#10b981] text-on-primary'
                : 'bg-secondary-fixed text-on-secondary-fixed'
            }`}
          >
            {team.status_label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm font-mono text-on-surface-variant font-medium">
            {team.id}
          </span>
          <button
            type="button"
            onClick={onVote}
            className={`px-3 py-1 font-label-sm text-label-sm rounded border border-[#0f172a] font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#10b981] text-on-primary shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-fixed'
            }`}
          >
            {team.status_type === 'cutoff_in' ? 'VOTE IN' : 'PROMOTE'}
          </button>
        </div>
      </div>

      {/* Card Core Body */}
      <div className="p-space-md flex-1 flex flex-col gap-space-md">
        {/* Team Branding & Details */}
        <div className="flex items-start justify-between gap-space-md">
          <div className="flex items-start gap-space-sm">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center font-headline-md text-headline-md font-black border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] shrink-0 ${team.logo_bg}`}
            >
              {team.short_code}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline-md text-headline-md text-on-surface font-black">
                  {team.name}
                </h2>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface border border-[#0f172a] font-bold">
                  {team.track}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5 leading-snug">
                {team.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <a
                  href={`https://${team.github_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-container hover:underline flex items-center gap-1 font-bold"
                >
                  <span className="material-symbols-outlined text-sm">code</span>
                  <span>{team.github_url}</span>
                </a>
                <span className="text-outline-variant">|</span>
                <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-sm">ondemand_video</span>
                  <span>{team.demo_url}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Score Big Badge */}
          <div className="text-right shrink-0">
            <div className="font-label-sm text-label-sm uppercase font-mono text-on-surface-variant font-bold">
              FINAL SCORE
            </div>
            <div className="font-headline-lg text-headline-lg text-primary-container font-black leading-none mt-1">
              {team.final_score.toFixed(2)}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              Raw: {team.raw_score.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 4 Scoring Dimension Comparison Bars */}
        <div className="bg-surface-container-low p-space-sm rounded-lg border-2 border-[#0f172a] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-on-surface">
            <span>RUBRIC BREAKDOWN</span>
            <span className="text-on-surface-variant font-medium">WEIGHT / PERFORMANCE</span>
          </div>

          {/* Dimension 1: Tech */}
          <div>
            <div className="flex justify-between font-label-sm text-label-sm mb-1">
              <span className="font-bold text-on-surface flex items-center gap-1">
                Technical Depth &amp; Arch{' '}
                <span className="text-xs font-mono font-normal text-on-surface-variant">
                  ({team.rubric.tech.weight_label})
                </span>
              </span>
              <span
                className={`font-bold font-mono ${
                  team.rubric.tech.is_lead ? 'text-[#10b981]' : 'text-on-surface-variant'
                }`}
              >
                {team.rubric.tech.score.toFixed(1)} / 10 ({team.rubric.tech.diff})
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full border border-[#0f172a] overflow-hidden">
              <div
                className="h-full bg-primary-container transition-all"
                style={{ width: `${team.rubric.tech.pct}%` }}
              ></div>
            </div>
          </div>

          {/* Dimension 2: Repo */}
          <div>
            <div className="flex justify-between font-label-sm text-label-sm mb-1">
              <span className="font-bold text-on-surface flex items-center gap-1">
                Codebase Health &amp; Commits{' '}
                <span className="text-xs font-mono font-normal text-on-surface-variant">
                  ({team.rubric.repo.weight_label})
                </span>
              </span>
              <span
                className={`font-bold font-mono ${
                  team.rubric.repo.is_lead ? 'text-[#10b981]' : 'text-on-surface-variant'
                }`}
              >
                {team.rubric.repo.score.toFixed(1)} / 10 ({team.rubric.repo.diff})
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full border border-[#0f172a] overflow-hidden">
              <div
                className="h-full bg-[#10b981] transition-all"
                style={{ width: `${team.rubric.repo.pct}%` }}
              ></div>
            </div>
          </div>

          {/* Dimension 3: Pitch */}
          <div>
            <div className="flex justify-between font-label-sm text-label-sm mb-1">
              <span className="font-bold text-on-surface flex items-center gap-1">
                Presentation &amp; Product Pitch{' '}
                <span className="text-xs font-mono font-normal text-on-surface-variant">
                  ({team.rubric.pitch.weight_label})
                </span>
              </span>
              <span
                className={`font-bold font-mono ${
                  team.rubric.pitch.is_lead ? 'text-[#10b981]' : 'text-on-surface-variant'
                }`}
              >
                {team.rubric.pitch.score.toFixed(1)} / 10 ({team.rubric.pitch.diff})
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full border border-[#0f172a] overflow-hidden">
              <div
                className="h-full bg-secondary-fixed-dim transition-all"
                style={{ width: `${team.rubric.pitch.pct}%` }}
              ></div>
            </div>
          </div>

          {/* Dimension 4: Velocity */}
          <div>
            <div className="flex justify-between font-label-sm text-label-sm mb-1">
              <span className="font-bold text-on-surface flex items-center gap-1">
                Team Velocity &amp; Bursts{' '}
                <span className="text-xs font-mono font-normal text-on-surface-variant">
                  ({team.rubric.velocity.weight_label})
                </span>
              </span>
              <span
                className={`font-bold font-mono ${
                  team.rubric.velocity.is_lead ? 'text-[#10b981]' : 'text-on-surface-variant'
                }`}
              >
                {team.rubric.velocity.score.toFixed(1)} / 10 ({team.rubric.velocity.diff})
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full border border-[#0f172a] overflow-hidden">
              <div
                className="h-full bg-[#8b5cf6] transition-all"
                style={{ width: `${team.rubric.velocity.pct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Forensic Evidence Grid (2x2) */}
        <div className="grid grid-cols-2 gap-space-sm text-xs">
          {/* Commit Timeline Sparkline */}
          <div className="p-2.5 bg-surface-container rounded-lg border border-[#0f172a]">
            <div className="flex items-center justify-between mb-1 font-mono font-bold text-on-surface">
              <span>Commit Cadence</span>
              <span className="text-on-surface-variant">{team.forensics.commits_label}</span>
            </div>
            <svg className="w-full h-9" fill="none" viewBox="0 0 100 28">
              <polyline
                points={team.forensics.sparkline_points}
                stroke={team.short_code === 'NP' ? '#004ac6' : '#10b981'}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
              <circle cx="88" cy="4" fill="#fde047" r="2.5" stroke="#0f172a" strokeWidth="1.5" />
            </svg>
            <div className="flex justify-between font-mono text-[10px] text-on-surface-variant mt-1">
              <span>H+0h</span>
              <span>{team.forensics.midpoint_peak}</span>
              <span>H+36h</span>
            </div>
          </div>

          {/* AST Code Check */}
          <div className="p-2.5 bg-surface-container rounded-lg border border-[#0f172a] flex flex-col justify-between">
            <div className="flex items-center justify-between font-mono font-bold text-on-surface">
              <span>AST Duplication</span>
              <span className="px-1.5 py-0.2 bg-[#10b981] text-on-primary rounded text-[10px] font-bold">
                {team.forensics.ast_label}
              </span>
            </div>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-black text-on-surface">
                {team.forensics.ast_pct}
              </span>
              <span className="text-[10px] text-on-surface-variant block leading-tight">
                {team.forensics.ast_note}
              </span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant font-medium">
              {team.forensics.ast_flags}
            </span>
          </div>

          {/* Video Sanity */}
          <div className="p-2.5 bg-surface-container rounded-lg border border-[#0f172a] flex flex-col justify-between">
            <span className="font-mono font-bold text-on-surface">Demo Verification</span>
            <div className="my-1 flex items-center gap-1.5 text-on-surface font-semibold text-xs">
              <span className="material-symbols-outlined text-sm text-[#10b981] font-bold">
                check_circle
              </span>
              <span>{team.forensics.demo_status}</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant font-medium">
              {team.forensics.demo_note}
            </span>
          </div>

          {/* Team Composition */}
          <div className="p-2.5 bg-surface-container rounded-lg border border-[#0f172a] flex flex-col justify-between">
            <span className="font-mono font-bold text-on-surface">Roster Profile</span>
            <div className="my-1 font-semibold text-on-surface text-xs">
              {team.forensics.roster_count}
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant font-medium">
              {team.forensics.roster_note}
            </span>
          </div>
        </div>

        {/* Roster Visuals */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <div className="flex items-center -space-x-2">
            {team.forensics.members.map((member, idx) => (
              <img
                key={idx}
                src={member.avatar}
                alt={member.name}
                className="w-8 h-8 rounded-full border-2 border-[#0f172a] object-cover"
                title={`${member.name} (${member.role})`}
              />
            ))}
            {team.forensics.members.length < 5 && (
              <span className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-[#0f172a] flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">
                +{5 - team.forensics.members.length}
              </span>
            )}
          </div>
          <span className="font-label-sm text-label-sm font-mono text-on-surface-variant font-bold">
            GitHub Verified ({team.forensics.verified_ratio})
          </span>
        </div>
      </div>
    </div>
  );
}
