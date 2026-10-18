import { useNavigate, useLocation } from 'react-router-dom';

export default function SchemaSidebar({ activeStage, onStageSelect }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStage =
    activeStage ||
    (location.pathname.startsWith('/data-quality') || location.pathname.startsWith('/quality')
      ? 'data-quality'
      : location.pathname.startsWith('/schema') || location.pathname.startsWith('/import')
      ? 'import-schema'
      : 'import-schema');
  const stages = [
    {
      id: 'import-schema',
      number: '01',
      label: 'Import & Schema',
      icon: 'upload_file',
      badge: null,
    },
    {
      id: 'data-quality',
      number: '02',
      label: 'Data Quality',
      icon: 'verified',
      badge: { text: '18 gap', color: 'bg-[#f97316]' },
    },
    {
      id: 'scoring-engine',
      number: '03',
      label: 'Scoring Engine',
      icon: 'tune',
      badge: null,
    },
    {
      id: 'ranked-results',
      number: '04',
      label: 'Ranked Results',
      icon: 'leaderboard',
      badge: { text: 'Top 40', color: 'bg-primary-container text-on-primary-container' },
    },
    {
      id: 'team-compare',
      number: '05',
      label: 'Team Compare',
      icon: 'compare_arrows',
      badge: null,
    },
    {
      id: 'stability-stress',
      number: '06',
      label: 'Stability Stress',
      icon: 'speed',
      badge: { text: '±15%', color: 'bg-[#8b5cf6]' },
    },
    {
      id: 'export-audit',
      number: '07',
      label: 'Export & Audit',
      icon: 'lock',
      badge: { text: 'SHA-256', color: 'bg-[#10b981]' },
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-lowest border-r-2 border-[#0f172a] shadow-[2px_0_0px_#0f172a] z-40 flex flex-col justify-between overflow-y-auto">
      {/* Top Navigation */}
      <div className="p-space-md">
        <div className="flex items-center justify-between px-2 mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Curation Pipeline
          </span>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded border border-[#0f172a] font-mono font-bold">
            STAGES 1-7
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {stages.map((stage) => {
            const isActive = stage.id === currentStage;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  if (stage.id === 'import-schema') {
                    navigate('/schema-mapper');
                  } else if (stage.id === 'data-quality') {
                    navigate('/data-quality');
                  }
                  if (onStageSelect) {
                    onStageSelect(stage.id);
                  }
                }}
                data-path={stage.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold border-[#0f172a] shadow-[3px_3px_0px_#0f172a] translate-x-1'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span
                    className={`font-label-sm text-label-sm font-mono w-5 h-5 flex items-center justify-center rounded border border-[#0f172a] transition-colors ${
                      isActive
                        ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                        : 'bg-surface-container-high text-on-surface group-hover:bg-secondary-fixed'
                    }`}
                  >
                    {stage.number}
                  </span>
                  <span className="material-symbols-outlined text-lg">{stage.icon}</span>
                  <span className="font-label-lg text-label-lg">{stage.label}</span>
                </div>

                {stage.badge && (
                  <span
                    className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] text-white font-bold ${stage.badge.color}`}
                  >
                    {stage.badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Deterministic Engine Card */}
      <div className="p-space-md">
        <div className="bg-surface-container-lowest border-2 border-[#0f172a] rounded-lg shadow-[3px_3px_0px_#0f172a] overflow-hidden">
          <div className="bg-secondary-fixed px-3 py-1.5 border-b-2 border-[#0f172a] flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-secondary-fixed font-black tracking-wider">
              Deterministic Engine
            </span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-lowest text-on-surface rounded border border-[#0f172a] font-bold">
              v2.4
            </span>
          </div>
          <div className="p-3 bg-surface-container-low">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-[#10b981] font-bold">
                check_circle
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                State Sealed &amp; Verified
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-tight mb-2">
              Zero algorithmic drift. Deterministic scoring passes consensus checks.
            </p>
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant pt-2 border-t border-outline-variant">
              <span>Sync Delay</span>
              <span className="font-bold text-on-surface">0.00ms</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
