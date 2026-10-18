import { useState } from 'react';

export default function ExportLedgerModal({
  isOpen,
  onClose,
  runInfo,
  teams,
}) {
  const [format, setFormat] = useState('csv'); // 'csv' | 'json'
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (format === 'csv') {
      const headers = [
        'rank',
        'external_id',
        'team_name',
        'track',
        'total_score',
        'status',
        'tech_depth',
        'repo_health',
        'presentation',
        'velocity',
        'jitter_risk_pct',
      ];
      const rows = teams.map((t) => [
        t.rank,
        `"${t.external_id}"`,
        `"${t.team_name}"`,
        `"${t.track}"`,
        t.total_score.toFixed(2),
        `"${t.status}"`,
        t.raw_vectors.tech,
        t.raw_vectors.repo,
        t.raw_vectors.pitch,
        t.raw_vectors.velocity,
        t.jitter_risk_pct,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consensus_jury_ledger_stage04_${runInfo.file_hash_short}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = {
        run_info: runInfo,
        teams: teams,
        sha256_seal: runInfo.result_hash,
        exported_at: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consensus_run_ledger_${runInfo.file_hash_short}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-fixed px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-secondary-fixed">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">verified</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Export Deterministic Jury Ledger
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-secondary-fixed-variant">
                Sealed consensus rankings ready for organizer handoff or public publication
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

        {/* Content */}
        <div className="p-space-lg flex flex-col gap-space-md">
          {/* Format Selection Cards */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-xl border-2 border-[#0f172a] cursor-pointer transition-all ${
                format === 'csv'
                  ? 'bg-secondary-fixed/30 shadow-[3px_3px_0px_#0f172a]'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-on-surface">CSV Diagnostic Matrix</span>
                <span className="font-mono text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded border border-[#0f172a]">
                  .csv
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Standard tabular export containing rank, raw scores, weighted totals, and cutoff status.
              </p>
            </div>

            <div
              onClick={() => setFormat('json')}
              className={`p-4 rounded-xl border-2 border-[#0f172a] cursor-pointer transition-all ${
                format === 'json'
                  ? 'bg-secondary-fixed/30 shadow-[3px_3px_0px_#0f172a]'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-on-surface">JSON Cryptographic Bundle</span>
                <span className="font-mono text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded border border-[#0f172a]">
                  .json
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Complete machine-readable ledger with SHA-256 seal, vector breakdowns, and gate proofs.
              </p>
            </div>
          </div>

          {/* Ledger Proof Card */}
          <div className="p-3 bg-surface-container rounded-lg border-2 border-[#0f172a] font-mono text-xs flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Ledger Hash:</span>
              <span className="font-bold text-primary">{runInfo.result_hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Frozen Timestamp:</span>
              <span className="font-bold text-on-surface">{runInfo.state_frozen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Shortlist Horizon:</span>
              <span className="font-bold text-[#10b981]">Top {runInfo.shortlist_quota} Finalists ({runInfo.quota_percentage})</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] text-xs font-bold hover:bg-surface-container cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Ledger</span>
          </button>

          <div className="flex items-center gap-2">
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
              className="px-5 py-2 rounded-lg bg-primary-container text-white border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] text-xs uppercase font-black cursor-pointer hover:bg-primary transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                {downloaded ? 'check' : 'download'}
              </span>
              <span>{downloaded ? 'Downloaded!' : `Download ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
