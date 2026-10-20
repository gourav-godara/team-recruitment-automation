export default function CtaBanner({ onLaunchSandbox, onUploadCsv }) {
  return (
    <section className="w-full px-4 py-16">
      <div className="max-w-7xl mx-auto rounded-3xl bg-brand-blue retro-border-thick p-8 md:p-12 shadow-pop-lg flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
        {/* Floating retro sticker accents */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-brand-yellow/20 pointer-events-none"></div>

        <div className="flex flex-col gap-3 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow text-brand-dark font-mono font-black text-xs retro-border self-start shadow-pop-sm">
            ⚡ INSTANT JURY DEFENSE
          </div>
          <h3 className="font-display font-black text-3xl sm:text-4xl leading-tight">
            Ready to Shortlist With 100% Defensibility?
          </h3>
          <p className="font-sans text-sm md:text-base text-blue-100 font-medium">
            No signup, no server upload, and no 3 AM spreadsheet nightmare. Test right here with zero risk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          <button
            id="footer-demo-btn"
            type="button"
            onClick={onLaunchSandbox}
            className="px-6 py-3.5 bg-brand-yellow hover:bg-yellow-300 text-brand-dark font-display font-black text-sm md:text-base rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">bolt</span>
            Launch 482-Team Sandbox
          </button>
          <button
            type="button"
            onClick={onUploadCsv}
            className="px-6 py-3.5 bg-white hover:bg-slate-100 text-brand-dark font-display font-black text-sm md:text-base rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">upload</span>
            Upload Local CSV
          </button>
        </div>
      </div>
    </section>
  );
}
