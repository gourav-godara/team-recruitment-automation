export default function StatusTicker() {
  return (
    <section className="w-full bg-brand-yellow retro-border border-x-0 py-2 overflow-hidden shadow-pop-sm">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-mono font-bold text-brand-dark">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>DETERMINISTIC SIMD ENGINE // ZERO ARBITRARY FORMULA DRIFT // JURY AUDIT READY</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="bg-white px-2 py-0.5 rounded retro-border">HASH: 0x9E7A...3C21</span>
          <span className="bg-brand-green px-2 py-0.5 rounded retro-border">100% LOCAL WORKSTATION</span>
        </div>
      </div>
    </section>
  );
}
