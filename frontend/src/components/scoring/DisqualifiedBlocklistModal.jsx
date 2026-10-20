import { useState } from 'react';

export default function DisqualifiedBlocklistModal({
  isOpen,
  onClose,
  blocklist,
  onOverrideTeam,
}) {
  const [filterGate, setFilterGate] = useState('all');
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen) return null;

  const filteredList = blocklist.filter((item) => {
    if (filterGate === 'all') return true;
    return item.gate_id === filterGate;
  });

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) return;
    onOverrideTeam(overrideTarget.id, overrideReason);
    setOverrideTarget(null);
    setOverrideReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-tertiary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-tertiary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">block</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight text-white">
                Disqualified Candidate Blocklist
              </h2>
              <p className="font-body-sm text-xs text-white/90">
                14 teams filtered out prior to scoring engine consensus aggregation
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

        {/* Filter Pills */}
        <div className="px-space-lg py-3 bg-surface-container-low border-b-2 border-[#0f172a] flex flex-wrap items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase font-black text-on-surface-variant mr-1">
            Filter Gate:
          </span>
          <button
            type="button"
            onClick={() => setFilterGate('all')}
            className={`px-2.5 py-1 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
              filterGate === 'all'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            All Gates ({blocklist.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGate('gate1')}
            className={`px-2.5 py-1 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
              filterGate === 'gate1'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            Git Window (4)
          </button>
          <button
            type="button"
            onClick={() => setFilterGate('gate2')}
            className={`px-2.5 py-1 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
              filterGate === 'gate2'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            AST Plagiarism (2)
          </button>
          <button
            type="button"
            onClick={() => setFilterGate('gate3')}
            className={`px-2.5 py-1 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
              filterGate === 'gate3'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            Demo Video (6)
          </button>
          <button
            type="button"
            onClick={() => setFilterGate('gate4')}
            className={`px-2.5 py-1 rounded-full border-2 border-[#0f172a] font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
              filterGate === 'gate4'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]'
                : 'bg-surface-container-lowest text-on-surface'
            }`}
          >
            Roster Size (2)
          </button>
        </div>

        {/* Overrides notice */}
        <div className="p-3 bg-secondary-fixed/30 border-b-2 border-[#0f172a] text-xs font-medium text-on-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary font-bold">gavel</span>
            <span>
              Per <code>DATABASE_DESIGN.md</code>, organizers can register a formal Jury Override.
              All overrides are logged to <code>audit_log</code>.
            </span>
          </div>
        </div>

        {/* Blocklist Table */}
        <div className="overflow-y-auto p-space-md flex-1">
          <div className="overflow-x-auto rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-on-primary text-xs uppercase font-bold">
                  <th className="py-2.5 px-3">Team ID</th>
                  <th className="py-2.5 px-3">Team / Project</th>
                  <th className="py-2.5 px-3">Violated Hard Gate</th>
                  <th className="py-2.5 px-3">Violation Evidence</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-surface-container text-xs">
                {filteredList.map((team) => {
                  const isOverridden = team.status === 'overridden';
                  return (
                    <tr
                      key={team.id}
                      className={
                        isOverridden
                          ? 'bg-[#dcfce7]'
                          : 'bg-surface-container-lowest hover:bg-[#ffe4e6] transition-colors'
                      }
                    >
                      <td className="py-3 px-3 font-mono font-bold">{team.id}</td>
                      <td className="py-3 px-3 font-bold text-on-surface">{team.team_name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container border border-[#0f172a] font-bold">
                          {team.gate_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant max-w-xs leading-snug">
                        {team.violation}
                        {isOverridden && (
                          <div className="text-[#15803d] font-bold mt-1 font-mono">
                            ↳ Override: {team.override_reason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isOverridden ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#10b981] text-white border border-[#0f172a] font-black uppercase">
                            OVERRIDDEN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-error text-white border border-[#0f172a] font-black uppercase">
                            BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isOverridden ? (
                          <button
                            type="button"
                            onClick={() => onOverrideTeam(team.id, null)}
                            className="text-error font-bold hover:underline cursor-pointer"
                          >
                            Revoke Override
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setOverrideTarget(team)}
                            className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a] hover:bg-secondary-fixed-dim cursor-pointer text-xs"
                          >
                            Jury Override
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inline Override Prompt */}
        {overrideTarget && (
          <div className="p-4 bg-secondary-fixed border-t-2 border-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex-1 w-full">
              <div className="font-bold text-sm text-on-secondary-fixed mb-1">
                Grant Jury Exemption for {overrideTarget.team_name} ({overrideTarget.id})
              </div>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Mandatory reason (e.g., 'GitHub commit lag verified by devrel liaison')..."
                className="w-full px-3 py-1.5 rounded bg-white border-2 border-[#0f172a] text-xs text-on-surface shadow-[1px_1px_0px_#0f172a] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setOverrideTarget(null)}
                className="px-3 py-1.5 rounded bg-surface-container-high border border-[#0f172a] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={handleConfirmOverride}
                className="px-4 py-1.5 rounded bg-primary-container text-white border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Confirm Exemption
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <div className="text-xs font-mono text-on-surface-variant">
            SHA-256 Gate Signature: <code className="text-primary font-bold">0x14_disqual_v24</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0f172a] text-white font-label-md text-label-md font-bold cursor-pointer hover:bg-primary transition-colors"
          >
            Close Blocklist View
          </button>
        </div>
      </div>
    </div>
  );
}
