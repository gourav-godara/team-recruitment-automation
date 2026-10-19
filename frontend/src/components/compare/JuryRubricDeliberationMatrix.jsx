export default function JuryRubricDeliberationMatrix({
  evaluators,
  teamAName = 'NovaPulse',
  teamBName = 'SynapseDB',
  verdictWinner = 'NP',
}) {
  const votesA = evaluators.filter((e) => e.voted_for === 'NP').length;
  const votesB = evaluators.filter((e) => e.voted_for === 'SDB').length;

  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden mb-space-lg">
      {/* Matrix Header */}
      <div className="bg-[#0f172a] text-on-primary px-space-md py-3 flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary-fixed font-black">gavel</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
            Jury Rubric Breakdown &amp; Deliberation Logs
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-surface-container-high/20 border border-white/20 text-on-primary">
            Z-Score Normalized
          </span>
          <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold border border-[#0f172a]">
            {evaluators.length} Evaluators
          </span>
        </div>
      </div>

      {/* Judge Scoring Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high border-b-2 border-[#0f172a] font-label-md text-label-md text-on-surface">
              <th className="py-3 px-space-md">Evaluator &amp; Track Role</th>
              <th className="py-3 px-space-sm text-center">{teamAName} Score</th>
              <th className="py-3 px-space-sm text-center">{teamBName} Score</th>
              <th className="py-3 px-space-sm text-center">Spread (Δ)</th>
              <th className="py-3 px-space-md">Forensic Deliberation Rationale</th>
              <th className="py-3 px-space-md text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#0f172a]/10 font-body-sm text-body-sm">
            {evaluators.map((evaluator) => {
              const isNP = evaluator.voted_for === 'NP';
              return (
                <tr
                  key={evaluator.id}
                  className="hover:bg-secondary-fixed/10 transition-colors"
                >
                  {/* Evaluator identity */}
                  <td className="py-3 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <img
                        src={evaluator.avatar}
                        alt={evaluator.name}
                        className="w-8 h-8 rounded-full border border-[#0f172a] object-cover"
                      />
                      <div>
                        <div className="font-bold text-on-surface font-label-md text-label-md">
                          {evaluator.name}
                        </div>
                        <div className="text-xs text-on-surface-variant font-mono">
                          {evaluator.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Score Team A */}
                  <td className="py-3 px-space-sm text-center font-mono font-bold text-base">
                    <span
                      className={
                        isNP ? 'text-primary-container font-black' : 'text-on-surface'
                      }
                    >
                      {evaluator.score_nova.toFixed(1)}
                    </span>
                  </td>

                  {/* Score Team B */}
                  <td className="py-3 px-space-sm text-center font-mono font-bold text-base">
                    <span
                      className={
                        !isNP ? 'text-primary-container font-black' : 'text-on-surface'
                      }
                    >
                      {evaluator.score_synapse.toFixed(1)}
                    </span>
                  </td>

                  {/* Spread */}
                  <td className="py-3 px-space-sm text-center font-mono font-bold">
                    <span
                      className={isNP ? 'text-[#10b981]' : 'text-[#f43f5e]'}
                    >
                      {evaluator.spread}
                    </span>
                  </td>

                  {/* Rationale Quote */}
                  <td className="py-3 px-space-md text-xs text-on-surface-variant max-w-md leading-relaxed">
                    <span className="font-bold text-on-surface">
                      "{evaluator.rationale.split('.')[0]}."
                    </span>{' '}
                    {evaluator.rationale.split('.').slice(1).join('.')}
                  </td>

                  {/* Vote Status */}
                  <td className="py-3 px-space-md text-right">
                    {isNP ? (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-[#10b981] text-on-primary border border-[#0f172a] font-black shadow-[1px_1px_0px_#0f172a]">
                        VOTED NP
                      </span>
                    ) : (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-[#0f172a] font-black shadow-[1px_1px_0px_#0f172a]">
                        VOTED SDB
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tie Rationale Summary */}
      <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary font-black text-xl">
            balance
          </span>
          <div>
            <span className="font-label-md text-label-md text-on-surface font-extrabold">
              Split Verdict ({votesA} - {votesB} Tie):
            </span>
            <span className="text-xs text-on-surface-variant ml-1 font-medium">
              Weighted scoring favors NovaPulse by exactly 0.10 points. Jury Lead casting vote required.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase font-mono text-on-surface-variant font-bold">
            Deterministic Model:
          </span>
          <span className="font-label-sm text-label-sm px-2.5 py-1 bg-primary-container text-on-primary-container rounded border-2 border-[#0f172a] font-mono font-black shadow-[1px_1px_0px_#0f172a]">
            {verdictWinner === 'NP' ? 'PRIMARY RANKING HOLDS (NP #40)' : 'OVERRIDE PROMOTE (SDB #40)'}
          </span>
        </div>
      </div>
    </div>
  );
}
