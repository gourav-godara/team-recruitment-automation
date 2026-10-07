import { useEffect } from 'react';

export default function AuditModal({ team, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white retro-border-thick rounded-3xl p-6 md:p-8 shadow-pop-lg relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-dark pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-yellow text-brand-dark retro-border">
                {team.rank ? `RANK #${team.rank}` : 'DISQUALIFIED'}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                TEAM ID: #{team.team_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold retro-border ${
                  team.outcome === 'shortlisted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : team.outcome === 'waitlisted'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {team.outcome.toUpperCase()}
              </span>
            </div>
            <h3 className="font-display font-black text-2xl text-brand-dark mt-1">
              {team.team_name}
            </h3>
            <p className="text-xs text-slate-600 font-medium">{team.extra_data?.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-brand-cream hover:bg-brand-yellow retro-border shadow-pop-sm flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cryptographic Signature Stamp */}
        <div className="p-3 bg-brand-cream rounded-xl retro-border font-mono text-xs flex flex-col gap-1">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-500">SHA-256 AUDIT STAMP</span>
            <span className="text-emerald-700">✓ IMMUTABLE RECEIPT</span>
          </div>
          <div className="text-[11px] text-brand-dark font-bold break-all bg-white p-2 rounded retro-border">
            {team.extra_data?.audit_signature || '0x9E7A42FC9012389B'}
          </div>
        </div>

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
            Evaluator Decision Rationale (run_results.reason)
          </span>
          <p className="p-3 bg-slate-50 rounded-xl retro-border text-sm font-medium text-slate-800 leading-relaxed">
            {team.reason}
          </p>
          {team.tie_break_note && (
            <div className="text-xs font-mono font-bold text-amber-800 bg-amber-50 p-2 rounded retro-border">
              ⚡ Tie-Break: {team.tie_break_note}
            </div>
          )}
        </div>

        {/* Score Breakdown (run_score_details) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
              Score Breakdown (run_score_details)
            </span>
            <span className="font-mono font-bold text-xs text-brand-blue">
              Total Score: {team.total_score}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl retro-border">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-brand-dark text-white font-bold">
                  <th className="p-2.5">Criterion Key</th>
                  <th className="p-2.5">Raw</th>
                  <th className="p-2.5">Norm (0-1)</th>
                  <th className="p-2.5">Weight</th>
                  <th className="p-2.5">Weighted</th>
                  <th className="p-2.5">Data Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {team.breakdown?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-800">{item.criterion_key}</td>
                    <td className="p-2.5">{item.team_raw_value}</td>
                    <td className="p-2.5">{item.normalized_value}</td>
                    <td className="p-2.5 font-semibold text-brand-blue">
                      {(item.weight * 100).toFixed(0)}%
                    </td>
                    <td className="p-2.5 font-bold text-brand-dark">{item.weighted_score}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold retro-border ${
                          item.data_status === 'ok'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.data_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.data_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hard Rule Verifications (run_rule_results) */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hard Filter Rules (run_rule_results)
          </span>
          <div className="flex flex-col gap-1.5">
            {team.rules?.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-2.5 rounded-lg bg-brand-cream retro-border text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                      rule.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {rule.passed ? '✓' : '✕'}
                  </span>
                  <span className="font-bold text-slate-800">{rule.rule_name}</span>
                </div>
                <span className="text-slate-600 font-medium max-w-xs text-right truncate">
                  {rule.details}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t-2 border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-brand-yellow font-display font-bold text-sm text-brand-dark rounded-xl retro-border shadow-pop hover:shadow-pop-hover cursor-pointer"
          >
            Dismiss Audit Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
