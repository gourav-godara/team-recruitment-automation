import { useState } from 'react';

export default function FlagReevalModal({
  isOpen,
  onClose,
  team,
  onSubmitFlag,
}) {
  const [flagType, setFlagType] = useState('technical_verification');
  const [reason, setReason] = useState('');

  if (!isOpen || !team) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmitFlag(team.team_id, { flagType, reason });
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-tertiary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-tertiary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">flag</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black text-white">
                Flag for Jury Re-evaluation
              </h2>
              <p className="font-body-sm text-xs text-white/90">
                Team: {team.team_name} ({team.external_id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm uppercase font-bold text-on-surface">
              Flag Category
            </label>
            <select
              value={flagType}
              onChange={(e) => setFlagType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low border-2 border-[#0f172a] text-xs font-bold text-on-surface focus:outline-none"
            >
              <option value="technical_verification">Technical Verification / AST Audit</option>
              <option value="video_accessibility">Video / Demo Link Issue</option>
              <option value="bubble_jitter">Bubble Boundary Score Discrepancy</option>
              <option value="roster_dispute">Team Roster / Registrant Dispute</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm uppercase font-bold text-on-surface">
              Reason &amp; Evaluation Notes (Required for <code>audit_log</code>)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the specific score anomaly or evidence requiring secondary jury panel review..."
              className="w-full p-3 rounded-lg bg-surface-container-low border-2 border-[#0f172a] text-xs text-on-surface focus:outline-none focus:bg-white shadow-inner"
              required
            />
          </div>

          <div className="p-3 bg-surface-container rounded-lg border-2 border-[#0f172a] text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">info</span>
            <span>
              This action creates a pending review trigger and appends to the immutable <code>audit_log</code>.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container border border-[#0f172a] text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-5 py-2 rounded-lg bg-tertiary text-white border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] text-xs font-black uppercase cursor-pointer hover:bg-tertiary-container disabled:opacity-50"
            >
              Submit Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
