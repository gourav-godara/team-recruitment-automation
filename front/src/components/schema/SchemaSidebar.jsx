import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function SchemaSidebar({ activeStage, onStageSelect }) {
  const location = useLocation();
  const { navigateWithState } = useApp();

  const currentStage =
    activeStage ||
    (location.pathname.startsWith('/team-compare') || location.pathname.startsWith('/compare')
      ? 'team-compare'
      : location.pathname.startsWith('/ranked') || location.pathname.startsWith('/results')
      ? 'ranked-results'
      : location.pathname.startsWith('/scoring') || location.pathname.startsWith('/weights')
      ? 'scoring-engine'
      : location.pathname.startsWith('/data-quality') || location.pathname.startsWith('/quality')
      ? 'data-quality'
      : 'import-schema');

  const stages = [
    {
      id: 'import-schema',
      number: '01',
      label: 'Import & Schema',
      icon: 'upload_file',
      path: '/schema-mapper',
    },
    {
      id: 'data-quality',
      number: '02',
      label: 'Data Quality Audit',
      icon: 'verified',
      path: '/data-quality',
    },
    {
      id: 'scoring-engine',
      number: '03',
      label: 'Scoring & Rules',
      icon: 'tune',
      path: '/scoring-engine',
    },
    {
      id: 'ranked-results',
      number: '04',
      label: 'Shortlist Leaderboard',
      icon: 'leaderboard',
      path: '/ranked-results',
    },
    {
      id: 'team-compare',
      number: '05',
      label: 'Team Compare',
      icon: 'compare_arrows',
      path: '/team-compare',
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-lowest border-r-2 border-[#0f172a] shadow-[2px_0_0px_#0f172a] z-40 flex flex-col justify-between overflow-y-auto">
      {/* Top Navigation */}
      <div className="p-space-md">
        <div className="flex items-center justify-between px-2 mb-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-extrabold">
            Recruitment Stages
          </span>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded border border-[#0f172a] font-mono font-bold">
            STEP BY STEP
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
                  navigateWithState(stage.path);
                  if (onStageSelect) {
                    onStageSelect(stage.id);
                  }
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-secondary-fixed text-on-secondary-fixed border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                    : 'bg-surface-container-low text-on-surface border-transparent hover:border-[#0f172a] hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border border-[#0f172a] shrink-0 ${
                      isActive
                        ? 'bg-[#0f172a] text-white'
                        : 'bg-white text-on-surface'
                    }`}
                  >
                    {stage.number}
                  </span>
                  <span className="font-label-md text-label-md font-bold truncate">
                    {stage.label}
                  </span>
                </div>
                <span className="material-symbols-outlined text-sm font-bold shrink-0">
                  {stage.icon}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session Box */}
      <div className="p-space-md border-t-2 border-[#0f172a] bg-surface-container-low">
        <div className="flex flex-col gap-1 text-xs font-mono text-slate-600">
          <span className="font-bold text-slate-800">AUTOMATION PLATFORM</span>
          <span>Deterministic FastAPI Engine</span>
          <span>Anonymous Session Active</span>
        </div>
      </div>
    </aside>
  );
}
