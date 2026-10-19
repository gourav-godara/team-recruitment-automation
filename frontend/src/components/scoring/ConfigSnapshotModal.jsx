import { useState } from 'react';

export default function ConfigSnapshotModal({
  isOpen,
  onClose,
  weights,
  curveType,
  gates,
  topQuota = 40,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const total = (weights.w1 + weights.w2 + weights.w3 + weights.w4) || 100;

  const configJson = {
    top_x: topQuota,
    weights: {
      judge_prelim_tech: parseFloat((weights.w1 / total).toFixed(4)),
      github_repo_url: parseFloat((weights.w2 / total).toFixed(4)),
      demo_video_url: parseFloat((weights.w3 / total).toFixed(4)),
      team_velocity: parseFloat((weights.w4 / total).toFixed(4)),
    },
    normalization_curve: curveType,
    hard_filters: gates
      .filter((g) => g.enabled)
      .map((g) => ({
        rule_name: g.ruleName,
        criterion_key: g.criterionKey,
        operator: g.id === 'gate4' ? 'between' : '==',
        tolerance: g.tolerance,
        applies_to: 'team',
      })),
    team_aggregation: {
      judge_prelim_tech: 'mean',
      github_repo_url: 'max',
      demo_video_url: 'mean',
      team_velocity: 'sum',
    },
    missing_data_policy: 'flag_and_exclude_from_average',
    tie_breakers: ['total_score', 'team_size'],
    config_hash: '0x8f92b7c4a17ef0d19c3b8a1e5d762f09ba1e5d76',
    generated_at: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(configJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scoring_engine_config_v24_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-fixed px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-secondary-fixed">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">code</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Deterministic Config Snapshot
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-secondary-fixed-variant">
                Conforming strictly to <code>DATABASE_DESIGN.md</code> Section 7 Config JSON shape
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
        <div className="p-space-lg overflow-y-auto flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="font-mono">config_hash: <b className="text-primary">0x8f92b7c4a17ef0d19c3b8a1e5d762f09ba1e5d76</b></span>
            <span>Target: <code>configs.config_json</code></span>
          </div>

          <pre className="p-4 rounded-xl bg-[#0f172a] text-[#38bdf8] font-mono text-xs overflow-x-auto border-2 border-[#0f172a] shadow-inner leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-md text-label-md font-bold hover:bg-secondary-fixed transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Config JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-md text-label-md font-bold hover:bg-secondary-fixed transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Download .json</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0f172a] text-white font-label-md text-label-md font-bold cursor-pointer hover:bg-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
