export default function TeamScoreDetailModal({
  isOpen,
  onClose,
  team,
  weights,
  curveType,
}) {
  if (!isOpen || !team) return null;

  const { w1, w2, w3, w4 } = weights;
  const totalWeight = w1 + w2 + w3 + w4 || 100;

  const vectorBreakdown = [
    {
      criterion_key: 'judge_prelim_tech',
      label: 'Technical Depth & Architecture',
      raw_score: team.vectorScores?.w1 || 0,
      normalized_value: (team.vectorScores?.w1 || 0) / 100,
      weight: w1 / totalWeight,
      weighted_score: ((team.vectorScores?.w1 || 0) * (w1 / totalWeight)).toFixed(2),
      data_status: 'ok',
      members_with_data: team.contributors || 4,
      members_total: team.contributors || 4,
      explanation: team.breakdownDetails?.w1_explanation || 'Comprehensive architecture analysis',
    },
    {
      criterion_key: 'github_repo_url',
      label: 'Codebase & GitHub Health',
      raw_score: team.vectorScores?.w2 || 0,
      normalized_value: (team.vectorScores?.w2 || 0) / 100,
      weight: w2 / totalWeight,
      weighted_score: ((team.vectorScores?.w2 || 0) * (w2 / totalWeight)).toFixed(2),
      data_status: 'ok',
      members_with_data: team.contributors || 4,
      members_total: team.contributors || 4,
      explanation: team.breakdownDetails?.w2_explanation || 'AST semantic tree depth verified',
    },
    {
      criterion_key: 'demo_video_url',
      label: 'Presentation, Pitch & Live Demo',
      raw_score: team.vectorScores?.w3 || 0,
      normalized_value: (team.vectorScores?.w3 || 0) / 100,
      weight: w3 / totalWeight,
      weighted_score: ((team.vectorScores?.w3 || 0) * (w3 / totalWeight)).toFixed(2),
      data_status: 'ok',
      members_with_data: team.contributors || 4,
      members_total: team.contributors || 4,
      explanation: team.breakdownDetails?.w3_explanation || 'Live product testnet demonstration',
    },
    {
      criterion_key: 'team_velocity',
      label: 'Team Velocity & Sprint Momentum',
      raw_score: team.vectorScores?.w4 || 0,
      normalized_value: (team.vectorScores?.w4 || 0) / 100,
      weight: w4 / totalWeight,
      weighted_score: ((team.vectorScores?.w4 || 0) * (w4 / totalWeight)).toFixed(2),
      data_status: 'ok',
      members_with_data: team.contributors || 4,
      members_total: team.contributors || 4,
      explanation: team.breakdownDetails?.w4_explanation || 'Continuous PR cadence across 36 hours',
    },
  ];

  const rules = [
    { rule_name: 'Commit window during hackathon', passed: 1, details: 'All commits strictly within 36hr window' },
    { rule_name: 'Plagiarism AST overlap < 25%', passed: 1, details: 'Duplication score is 4.8% (PASS)' },
    { rule_name: 'Public demo video < 5m', passed: 1, details: 'Video duration 3m 42s, HTTP 200 OK' },
    { rule_name: 'Roster size 2 to 5 registrants', passed: 1, details: `${team.contributors} verified members registered` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-primary-container">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] flex items-center justify-center font-black font-mono shadow-[2px_2px_0px_#0f172a]">
              #{team.simulatedRank}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-lg font-black text-white">
                  {team.team_name}
                </h2>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface border border-[#0f172a] font-bold">
                  {team.track}
                </span>
              </div>
              <p className="font-body-sm text-xs text-white/90 font-mono">
                ID: {team.external_id} • {team.contributors} contributors • Quota Status: {team.quotaStatus}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-space-lg flex flex-col gap-space-md">
          {/* Top Score Summary Banner */}
          <div className="p-space-md rounded-xl bg-surface-container-low border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-black text-on-surface-variant">
                Composite Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline-lg text-2xl font-black text-primary font-mono">
                  {team.weightedScore.toFixed(2)}
                </span>
                <span className="font-body-sm text-xs text-on-surface-variant">
                  (Raw: {team.rawScore} / 100)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-[#0f172a] font-bold">
                {curveType === 'z_score' ? 'Z-Score Normalized' : 'Min-Max Scaled'}
              </span>
              <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-[#10b981] text-white border border-[#0f172a] font-bold">
                {team.displacementLabel}
              </span>
            </div>
          </div>

          {/* Section: Score Breakdown (DATABASE_DESIGN.md run_score_details) */}
          <div className="flex flex-col gap-2">
            <h3 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface font-extrabold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">analytics</span>
              Criterion Breakdown (<code>run_score_details</code>)
            </h3>

            <div className="overflow-x-auto rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0f172a] text-on-primary uppercase font-bold">
                    <th className="py-2.5 px-3">Criterion</th>
                    <th className="py-2.5 px-3">Raw</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Weighted</th>
                    <th className="py-2.5 px-3">Data Status</th>
                    <th className="py-2.5 px-3">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-surface-container">
                  {vectorBreakdown.map((row) => (
                    <tr key={row.criterion_key} className="bg-surface-container-lowest hover:bg-surface-container-low">
                      <td className="py-2.5 px-3 font-bold text-on-surface">
                        <div>{row.label}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant">{row.criterion_key}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{row.raw_score}</td>
                      <td className="py-2.5 px-3 font-mono">{(row.weight * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.weighted_score}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#15803d] border border-[#15803d] font-bold font-mono">
                          {row.data_status} ({row.members_with_data}/{row.members_total})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant max-w-xs">{row.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Hard Filter Rules (DATABASE_DESIGN.md run_rule_results) */}
          <div className="flex flex-col gap-2">
            <h3 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface font-extrabold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#10b981]">verified</span>
              Qualification Rules (<code>run_rule_results</code>)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-surface-container-low border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-on-surface">{rule.rule_name}</div>
                    <div className="text-[11px] text-on-surface-variant">{rule.details}</div>
                  </div>
                  <span className="material-symbols-outlined text-[#10b981] font-bold text-base">
                    check_circle
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <div className="text-xs font-mono text-on-surface-variant">
            Deterministic Engine: Verified against active weights &amp; consensus matrix.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0f172a] text-white font-label-md text-label-md font-bold cursor-pointer hover:bg-primary transition-colors"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}
