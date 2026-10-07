export default function Navbar({ onLoadDemo, onDropCsvClick }) {
  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 max-w-7xl mx-auto">
      <div className="bg-white retro-border shadow-pop-lg rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <a className="flex items-center gap-2 group" href="#">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow retro-border shadow-pop-sm flex items-center justify-center font-display font-extrabold text-xl group-hover:rotate-6 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight leading-none text-brand-dark">
                ShortlistIQ
              </span>
              <span className="text-[10px] font-mono font-bold text-brand-blue uppercase tracking-wider">
                HACKATHON JURY DECK
              </span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-green/30 text-emerald-800 retro-border shadow-pop-sm">
              ● v2.4 LIVE
            </span>
            <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-brand-pink/20 text-rose-700 retro-border border-dashed">
              NO MORE 3AM PANIC ✌️
            </span>
          </div>
        </div>

        {/* Center Links / Tabs */}
        <nav className="hidden xl:flex items-center gap-2 font-display font-semibold text-sm">
          <a
            className="px-3 py-1.5 rounded-xl bg-brand-blue text-white retro-border shadow-pop-sm transition-transform hover:-translate-y-0.5"
            href="#dropzone-area"
          >
            Ingest Arena
          </a>
          <a
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
            href="#pipeline-stages"
          >
            7-Stage Levels
          </a>
          <a
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
            href="#live-console"
          >
            Live Top 10 Roster
          </a>
          <a
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
            href="#comparison"
          >
            Sheets vs Machine
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="nav-demo-btn"
            type="button"
            onClick={onLoadDemo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-yellow font-display font-bold text-xs md:text-sm text-brand-dark retro-border shadow-pop-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">bolt</span>
            <span>Load 482 Teams</span>
          </button>
          <button
            type="button"
            onClick={onDropCsvClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-blue text-white font-display font-bold text-xs md:text-sm retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">file_upload</span>
            <span>Drop CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
