import { useNavigate } from 'react-router-dom';

export default function SchemaHeader({ datasetInfo, onNavigateHome }) {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface-container-lowest border-b-2 border-[#0f172a] shadow-[0_2px_0px_#0f172a]">
      <div className="w-full h-16 px-gutter-lg flex items-center justify-between gap-space-md">
        {/* Brand & Indicators */}
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={handleHomeClick}>
            {/* Neo-Memphis Brand Logo */}
            <div className="w-9 h-9 rounded-md bg-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-display font-extrabold text-xl text-on-surface">
              ⚡
            </div>
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-extrabold">
              ShortlistIQ
            </span>
            <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-extrabold">
              JURY DECK
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
              v2.4 LIVE
            </span>
          </div>

          <div className="h-6 w-0.5 bg-outline-variant hidden sm:block"></div>

          {/* Dataset Status Capsule */}
          <div className="hidden xl:flex items-center gap-space-sm bg-surface-container-low px-3 py-1 rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
            </span>
            <span className="font-label-md text-label-md text-on-surface font-mono">
              {datasetInfo.batch_filename}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              ({datasetInfo.total_teams} teams)
            </span>
            <span className="font-label-sm text-label-sm bg-[#10b981] text-on-primary px-2 py-0.5 rounded-full border border-[#0f172a] font-bold">
              Engine Ready ({datasetInfo.engine_version})
            </span>
          </div>
        </div>

        {/* Right Console Controls */}
        <div className="flex items-center gap-space-md">
          {/* Back to Home / Landing Button */}
          <button
            type="button"
            onClick={handleHomeClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-md text-label-md hover:bg-secondary-fixed transition-all cursor-pointer font-bold"
            title="Return to Public Landing / Overview"
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span>Landing Deck</span>
          </button>

          {/* Hash Pill */}
          <div className="hidden lg:flex items-center gap-space-xs font-mono font-label-md text-label-md bg-surface-container px-3 py-1 rounded-full border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] text-on-surface">
            <span className="text-on-surface-variant font-label-sm text-label-sm">hash:</span>
            <span className="font-bold">{datasetInfo.file_hash_short}</span>
          </div>

          {/* Profile Capsule */}
          <div className="flex items-center gap-space-sm pl-2 border-l-2 border-outline-variant">
            <div className="text-right hidden sm:block">
              <div className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                {datasetInfo.jury_lead.name}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                {datasetInfo.jury_lead.role}
              </div>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary-fixed border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] flex items-center justify-center font-bold text-xs font-mono text-primary">
                AR
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary-fixed rounded-full border border-[#0f172a]"></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
