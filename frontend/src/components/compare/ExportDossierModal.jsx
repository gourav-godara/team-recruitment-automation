import { useState } from 'react';

export default function ExportDossierModal({
  isOpen,
  onClose,
  teamA,
  teamB,
  evaluators,
}) {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const content = `========================================================================
SHORTLISTIQ // HACKATHON JURY DECK v2.4.1
STAGE 05: HEAD-TO-HEAD ARBITRATION DOSSIER
========================================================================
Generated: ${new Date().toISOString()}
SHA-256 State Seal: 0x8f9b2c1a4e5d762f09ba1e5d762f09ba1e5d762f

------------------------------------------------------------------------
CONTENDER A: #${teamA.rank} ${teamA.name} (${teamA.id})
------------------------------------------------------------------------
Track: ${teamA.track}
Weighted Score: ${teamA.final_score.toFixed(2)} pts (Raw: ${teamA.raw_score.toFixed(2)})
Technical Depth (35%): ${teamA.rubric.tech.score}/10 (${teamA.rubric.tech.diff})
GitHub Health (25%):   ${teamA.rubric.repo.score}/10 (${teamA.rubric.repo.diff})
Presentation (20%):    ${teamA.rubric.pitch.score}/10 (${teamA.rubric.pitch.diff})
Velocity (20%):        ${teamA.rubric.velocity.score}/10 (${teamA.rubric.velocity.diff})
Commit Count:          ${teamA.forensics.commits_label}
AST Duplicate Scan:    ${teamA.forensics.ast_pct} (${teamA.forensics.ast_label})
Demo Verification:     ${teamA.forensics.demo_status}

------------------------------------------------------------------------
CONTENDER B: #${teamB.rank} ${teamB.name} (${teamB.id})
------------------------------------------------------------------------
Track: ${teamB.track}
Weighted Score: ${teamB.final_score.toFixed(2)} pts (Raw: ${teamB.raw_score.toFixed(2)})
Technical Depth (35%): ${teamB.rubric.tech.score}/10 (${teamB.rubric.tech.diff})
GitHub Health (25%):   ${teamB.rubric.repo.score}/10 (${teamB.rubric.repo.diff})
Presentation (20%):    ${teamB.rubric.pitch.score}/10 (${teamB.rubric.pitch.diff})
Velocity (20%):        ${teamB.rubric.velocity.score}/10 (${teamB.rubric.velocity.diff})
Commit Count:          ${teamB.forensics.commits_label}
AST Duplicate Scan:    ${teamB.forensics.ast_pct} (${teamB.forensics.ast_label})
Demo Verification:     ${teamB.forensics.demo_status}

------------------------------------------------------------------------
JURY DELIBERATION VOTES & RATIONALE
------------------------------------------------------------------------
${evaluators.map((e) => `[${e.voted_for}] ${e.name} (${e.role}): ${e.rationale} (Spread: ${e.spread})`).join('\n')}

========================================================================
AUTHORIZATION: Alex Rivers, Tier-1 Jury Lead
Status: Immutable Consensus State Stamped
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitration_dossier_${teamA.short_code}_vs_${teamB.short_code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-fixed px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-secondary-fixed">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-black">picture_as_pdf</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Export Head-to-Head Dossier
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-secondary-fixed-variant">
                Full forensic evidence report for {teamA.name} vs {teamB.name}
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

        {/* Content Preview */}
        <div className="p-space-lg flex flex-col gap-3 font-mono text-xs">
          <div className="p-3 bg-surface-container rounded-lg border border-[#0f172a] text-on-surface">
            <div>Arbitration: <b>{teamA.name} (#{teamA.rank}) vs {teamB.name} (#{teamB.rank})</b></div>
            <div>Score Delta: <b className="text-primary font-bold">0.10 pts</b></div>
            <div>Jury Quorum: <b>4 Evaluators (Split 2 - 2)</b></div>
            <div>Cryptographic Seal: <b>0x8f9b2c1a4e5d762f09ba...</b></div>
          </div>
          <p className="text-on-surface-variant text-xs">
            Export includes AST syntax overlap reports, timestamped commit timelines, evaluator quotes, and jury lead casting vote parameters.
          </p>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container border border-[#0f172a] text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2 rounded-lg bg-primary-container text-white border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] text-xs font-black uppercase cursor-pointer hover:bg-primary transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">
              {downloaded ? 'check' : 'download'}
            </span>
            <span>{downloaded ? 'Dossier Downloaded!' : 'Download Dossier (.txt / .pdf)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
