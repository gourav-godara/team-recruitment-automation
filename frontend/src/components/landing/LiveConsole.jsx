import { useState } from 'react';

export default function LiveConsole({ teams, onInspectAudit, isSimulating, onRunSimulation }) {
  const [simProgress, setSimProgress] = useState(false);

  const handleSimulate = () => {
    setSimProgress(true);
    onRunSimulation?.();
    setTimeout(() => {
      setSimProgress(false);
    }, 1200);
  };

  return (
    <section className="w-full px-4 py-16" id="live-console">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1 self-start rounded-full text-xs font-mono font-extrabold bg-brand-blue text-white retro-border shadow-pop-sm">
              INTERACTIVE TEST ARENA
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-brand-dark">
              Live Top 10 Evaluation Console
            </h2>
            <p className="font-sans text-base text-slate-600 font-medium">
              Real-time shortlisting snapshot on 482 sample submissions. Run Monte Carlo sweeps to inspect cutoff tension.
            </p>
          </div>
          <button
            id="run-sim-btn"
            type="button"
            onClick={handleSimulate}
            disabled={simProgress || isSimulating}
            className="px-5 py-2.5 bg-brand-blue hover:bg-blue-800 text-white font-display font-bold text-sm rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer disabled:opacity-80"
          >
            <span
              className={`material-symbols-outlined text-base font-bold ${
                simProgress || isSimulating ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
            <span>
              {simProgress || isSimulating
                ? 'Running 10,000 Sweep...'
                : 'Run 10,000 Monte Carlo Sweep'}
            </span>
          </button>
        </div>

        {/* High-Contrast Tabular Arena */}
        <div className="w-full bg-white retro-border-thick rounded-3xl p-6 shadow-pop-lg flex flex-col gap-4">
          {/* Control Filter Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-brand-cream rounded-xl retro-border font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold">
                Quota:{' '}
                <span className="bg-brand-yellow px-2 py-0.5 rounded retro-border">
                  Top 10 Finalists
                </span>
              </span>
              <span>•</span>
              <span className="text-slate-600">
                Total Teams: <strong className="text-brand-dark">482</strong>
              </span>
              <span>•</span>
              <span className="text-rose-600 font-bold">Hard Disqualified: 14</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">STABILITY RATING:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 retro-border font-black">
                98.2% ROBUST
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl retro-border bg-white">
            <table className="w-full min-w-[850px] text-left font-sans text-sm border-collapse">
              <thead>
                <tr className="bg-brand-dark text-white font-display font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Rank</th>
                  <th className="py-3 px-4">Project Identifier</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category Track</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tech</th>
                  <th className="py-3 px-4 whitespace-nowrap">Novelty</th>
                  <th className="py-3 px-4 whitespace-nowrap">Composite</th>
                  <th className="py-3 px-4 whitespace-nowrap">Bubble Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Audit</th>
                </tr>
              </thead>
              <tbody
                id="demo-table-body"
                className={`divide-y-2 divide-slate-100 font-medium transition-all duration-300 ${
                  isSimulating || simProgress ? 'opacity-40 scale-[0.995]' : 'opacity-100 scale-100'
                }`}
              >
                {/* Row 1: ZK-Relay */}
                {teams.find((t) => t.team_id === 101) && (
                  <tr className="hover:bg-yellow-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-black text-base text-brand-blue">
                      #01
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-extrabold text-brand-dark text-base">
                        ZK-Relay
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Decentralized zero-knowledge proofs for batch settlement
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      Infra &amp; Core
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.82</td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.45</td>
                    <td className="py-3.5 px-4 font-mono font-black text-base text-brand-blue">
                      9.67
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-brand-green/20 text-emerald-800 retro-border shadow-pop-sm whitespace-nowrap">
                        ✓ LOCKED IN (0.0% Risk)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 101))}
                        className="w-8 h-8 rounded-lg bg-brand-cream retro-border shadow-pop-sm hover:bg-brand-yellow flex items-center justify-center transition-colors cursor-pointer"
                        title="View Audit Signature"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">verified</span>
                      </button>
                    </td>
                  </tr>
                )}

                {/* Row 2: BioLoom AI */}
                {teams.find((t) => t.team_id === 102) && (
                  <tr className="hover:bg-yellow-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-black text-base text-brand-blue">
                      #02
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-extrabold text-brand-dark text-base">
                        BioLoom AI
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Synthetic biology sequence generation pipeline
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      AI / Health
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.60</td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.70</td>
                    <td className="py-3.5 px-4 font-mono font-black text-base text-brand-blue">
                      9.64
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-brand-green/20 text-emerald-800 retro-border shadow-pop-sm whitespace-nowrap">
                        ✓ LOCKED IN (0.4% Risk)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 102))}
                        className="w-8 h-8 rounded-lg bg-brand-cream retro-border shadow-pop-sm hover:bg-brand-yellow flex items-center justify-center transition-colors cursor-pointer"
                        title="View Audit Signature"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">verified</span>
                      </button>
                    </td>
                  </tr>
                )}

                {/* Row 3: AeroPulse Telemetry */}
                {teams.find((t) => t.team_id === 103) && (
                  <tr className="hover:bg-yellow-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-black text-base text-brand-blue">
                      #03
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-extrabold text-brand-dark text-base">
                        AeroPulse Telemetry
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Autonomous drone fleet collision mesh in Rust
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      Robotics
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.45</td>
                    <td className="py-3.5 px-4 font-mono font-bold">9.20</td>
                    <td className="py-3.5 px-4 font-mono font-black text-base text-brand-blue">
                      9.35
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-brand-green/20 text-emerald-800 retro-border shadow-pop-sm whitespace-nowrap">
                        ✓ SOLID QUALIFIER
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 103))}
                        className="w-8 h-8 rounded-lg bg-brand-cream retro-border shadow-pop-sm hover:bg-brand-yellow flex items-center justify-center transition-colors cursor-pointer"
                        title="View Audit Signature"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">verified</span>
                      </button>
                    </td>
                  </tr>
                )}

                {/* Row 10: VeriLens Optics (Bubble alert) */}
                {teams.find((t) => t.team_id === 110) && (
                  <tr className="bg-amber-50 hover:bg-amber-100/60 transition-colors">
                    <td className="py-3.5 px-4 font-display font-black text-base text-amber-700">
                      #10
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-extrabold text-brand-dark text-base">
                        VeriLens Optics
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Edge computer vision for manufacturing quality check
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      Industrial AI
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">8.75</td>
                    <td className="py-3.5 px-4 font-mono font-bold">8.60</td>
                    <td className="py-3.5 px-4 font-mono font-black text-base text-amber-700">
                      8.69
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-yellow text-amber-950 retro-border shadow-pop-sm whitespace-nowrap animate-pulse">
                        <span className="material-symbols-outlined text-sm font-bold leading-none">
                          warning
                        </span>
                        <span>BUBBLE ALERT (34.8% VULNERABLE)</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 110))}
                        className="w-8 h-8 rounded-lg bg-brand-yellow retro-border shadow-pop-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        title="View Bubble Diagnostics"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">warning</span>
                      </button>
                    </td>
                  </tr>
                )}

                {/* Cutoff horizon banner */}
                <tr className="bg-brand-yellow retro-border">
                  <td
                    className="py-2 px-4 text-center font-display font-black text-xs text-brand-dark uppercase tracking-widest whitespace-nowrap"
                    colSpan={8}
                  >
                    ▲ TOP 10 FINALIST QUALIFICATION HORIZON • HIGH JITTER BUBBLE ZONE: RANK #09 - #12 ▲
                  </td>
                </tr>

                {/* Row 11: SynapseDB */}
                {teams.find((t) => t.team_id === 111) && (
                  <tr className="bg-slate-50/80 hover:bg-slate-100 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-base text-slate-500">
                      #11
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-bold text-slate-700 text-base">
                        SynapseDB
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        In-memory graph database with hardware-level cache
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      Databases
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">8.65</td>
                    <td className="py-3.5 px-4 font-mono font-bold">8.70</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-base text-slate-700">
                      8.67
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-slate-700 retro-border whitespace-nowrap">
                        32.1% CHANCE OF SWAP
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 111))}
                        className="w-8 h-8 rounded-lg bg-white retro-border shadow-pop-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                        title="View Team Audit"
                      >
                        <span className="material-symbols-outlined text-sm font-bold text-slate-600">
                          open_in_new
                        </span>
                      </button>
                    </td>
                  </tr>
                )}

                {/* Row DQ: GhostChain Protocol */}
                {teams.find((t) => t.team_id === 199) && (
                  <tr className="bg-rose-50/50 hover:bg-rose-50 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-base text-rose-500">
                      DQ
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-bold text-slate-600 text-base line-through">
                        GhostChain Protocol
                      </div>
                      <div className="text-xs text-rose-600 font-mono font-bold">
                        FAIL GATE: Commit window prior to hackathon launch
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                      Web3
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">--</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">--</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">0.00</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-200 text-rose-900 retro-border whitespace-nowrap">
                        ⛔ HARD DISQUALIFIED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onInspectAudit(teams.find((t) => t.team_id === 199))}
                        className="w-8 h-8 rounded-lg bg-rose-200 retro-border shadow-pop-sm flex items-center justify-center cursor-pointer hover:bg-rose-300 transition-colors"
                        title="View Ineligibility Audit"
                      >
                        <span className="material-symbols-outlined text-sm font-bold text-rose-800">
                          block
                        </span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
