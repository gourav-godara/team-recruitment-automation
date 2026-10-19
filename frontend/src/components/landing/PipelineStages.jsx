export default function PipelineStages() {
  return (
    <section className="w-full px-4 py-16 bg-white retro-border border-x-0" id="pipeline-stages">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Stage Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="px-3 py-1 self-start rounded-full text-xs font-mono font-extrabold bg-brand-yellow text-brand-dark retro-border shadow-pop-sm">
              SEVEN LEVEL-UP STAGES
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-brand-dark">
              Deterministic Verification Playbook
            </h2>
            <p className="font-sans text-base text-slate-600 font-medium">
              Transform noisy judges and panic-stricken spreadsheets into an airtight, defensible finalists roster.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs font-bold bg-brand-cream px-3 py-2 rounded-xl retro-border shadow-pop-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PIPELINE STATUS: HYPERDRIVE</span>
          </div>
        </div>

        {/* Bento Grid with Punchy Pastel & Vivid Block Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Level 1: Rubric Tamer */}
          <div className="md:col-span-12 lg:col-span-7 bg-[#EEF2FF] retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-blue text-white font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 01 • LEVEL UP
                </span>
                <span className="material-symbols-outlined text-brand-blue text-2xl font-bold">
                  auto_fix_high
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark pt-1">
                Stage 1: Rubric Tamer &amp; Schema Normalizer
              </h3>
              <p className="font-sans text-sm text-slate-700 leading-relaxed font-medium">
                Fuzzy maps messy keys (
                <code className="bg-white px-1.5 py-0.5 rounded retro-border text-xs">score_tech</code>
                ,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded retro-border text-xs">
                  Judge 3 Points
                </code>
                ) into crisp canonical vectors. Neutralizes overly harsh or generous judges through z-score standard deviation balancing.
              </p>
            </div>

            {/* Interactive Visual Preview */}
            <div className="bg-white retro-border rounded-xl p-3.5 font-mono text-xs flex flex-col gap-2 shadow-pop-sm">
              <div className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                Stream Transformation
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-brand-cream retro-border">
                <span className="text-slate-600 font-semibold truncate">
                  Raw: "Q2_Innovation_Score (1-10)"
                </span>
                <span className="material-symbols-outlined text-sm font-bold text-brand-blue mx-2">
                  arrow_forward
                </span>
                <span className="text-brand-blue font-bold shrink-0">
                  vector.innovation [0.0 - 1.0]
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-brand-cream retro-border">
                <span className="text-slate-600 font-semibold truncate">
                  Judge Skew: Judge 2 (σ=2.41)
                </span>
                <span className="material-symbols-outlined text-sm font-bold text-brand-blue mx-2">
                  arrow_forward
                </span>
                <span className="text-emerald-700 font-bold shrink-0">
                  z_score_balanced (μ=0, σ=1)
                </span>
              </div>
            </div>
          </div>

          {/* Level 2: 404 Hunter */}
          <div className="md:col-span-12 lg:col-span-5 bg-[#FEF3C7] retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-yellow text-brand-dark font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 02 • INTEGRITY
                </span>
                <span className="material-symbols-outlined text-brand-dark text-2xl font-bold">
                  radar
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark pt-1">
                Stage 2: The 404 Hunter &amp; Diagnostics
              </h3>
              <p className="font-sans text-sm text-slate-700 leading-relaxed font-medium">
                Pings GitHub repositories, uncovers private Loom demos, and attaches explicit uncertainty confidence bands instead of unfairly slapping projects with zero scores.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-white retro-border shadow-pop-sm flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Repo Alive</span>
                <span className="font-display font-black text-emerald-600 text-base">476/482 OK</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white retro-border shadow-pop-sm flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Private Loom</span>
                <span className="font-display font-black text-rose-600 text-base">6 FLAGGED</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white retro-border shadow-pop-sm flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Null Errors</span>
                <span className="font-display font-black text-brand-blue text-base">0.00% CLEAN</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white retro-border shadow-pop-sm flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Jury Quorum</span>
                <span className="font-display font-black text-purple-600 text-base">100% READY</span>
              </div>
            </div>
          </div>

          {/* Level 3: Gatekeeper */}
          <div className="md:col-span-12 lg:col-span-4 bg-[#FCE7F3] retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-pink text-white font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 03
                </span>
                <span className="material-symbols-outlined text-rose-600 text-2xl font-bold">
                  tune
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-brand-dark pt-1">
                Stage 3: Gatekeeper Multi-Weights
              </h3>
              <p className="font-sans text-xs text-slate-700 leading-relaxed font-medium">
                Calibrate dynamic track multipliers and enforce binary qualifying gates (commits verified strictly during hackathon hours).
              </p>
            </div>
            {/* Sliders visualization */}
            <div className="bg-white retro-border rounded-xl p-3 flex flex-col gap-2.5 shadow-pop-sm font-mono text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Technical Rigor</span>
                  <span className="text-brand-blue">40%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full retro-border overflow-hidden">
                  <div className="bg-brand-blue h-full w-[40%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Originality &amp; Novelty</span>
                  <span className="text-rose-500">35%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full retro-border overflow-hidden">
                  <div className="bg-rose-500 h-full w-[35%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Design &amp; Polish</span>
                  <span className="text-emerald-500">25%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full retro-border overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[25%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 4: Top 10 Horizon */}
          <div className="md:col-span-12 lg:col-span-8 bg-[#ECFDF5] retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 04
                </span>
                <span className="material-symbols-outlined text-emerald-700 text-2xl font-bold">
                  emoji_events
                </span>
              </div>
              <h3 className="font-display font-extrabold text-2xl text-brand-dark pt-1">
                Stage 4: Top 10 Horizon &amp; Bubble Contenders
              </h3>
              <p className="font-sans text-sm text-slate-700 leading-relaxed font-medium">
                Ranks all teams mathematically. Clearly isolates undisputed safe qualifiers from vulnerable bubble contenders hovering on the fence.
              </p>
            </div>
            {/* Mini snapshot table */}
            <div className="bg-white retro-border rounded-xl overflow-hidden shadow-pop-sm">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-brand-dark text-slate-700">
                    <th className="p-2">Rank</th>
                    <th className="p-2">Project</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="p-2 font-black text-brand-blue">#01</td>
                    <td className="p-2 font-bold">HyperGraph Sync</td>
                    <td className="p-2">96.4</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 retro-border text-[10px] font-bold">
                        LOCKED IN
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="p-2 font-black text-amber-600">#10</td>
                    <td className="p-2 font-bold">NeuralAudio Mesh</td>
                    <td className="p-2">88.5</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 retro-border text-[10px] font-bold">
                        BUBBLE THRESHOLD
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Level 5: Code Snooper */}
          <div className="md:col-span-12 lg:col-span-4 bg-brand-cream retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-yellow text-brand-dark font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 05
                </span>
                <span className="material-symbols-outlined text-brand-dark text-2xl font-bold">
                  code_blocks
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-brand-dark pt-1">
                Stage 5: Code Snooper &amp; Plagiarism Radar
              </h3>
              <p className="font-sans text-xs text-slate-700 leading-relaxed font-medium">
                Deep repository commit window checks, cross-hackathon duplicate detection, and sentiment analysis on judge critique comments.
              </p>
            </div>
            <div className="p-3 bg-white retro-border rounded-xl font-mono text-xs shadow-pop-sm">
              <div className="flex justify-between items-center font-bold">
                <span>Team 142 "OmniMesh"</span>
                <span className="text-emerald-600">99.4% VERIFIED</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                47 commits within 36hr hack window
              </div>
            </div>
          </div>

          {/* Level 6: Monte Carlo Stress Party */}
          <div className="md:col-span-12 lg:col-span-4 bg-[#F3E8FF] retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-purple text-white font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 06
                </span>
                <span className="material-symbols-outlined text-purple-700 text-2xl font-bold">
                  casino
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-brand-dark pt-1">
                Stage 6: Monte Carlo Stress Party
              </h3>
              <p className="font-sans text-xs text-slate-700 leading-relaxed font-medium">
                Runs 10,000 probabilistic scoring runs to flag fragile rank flips before judges announce winners on stage.
              </p>
            </div>
            {/* Curve Graphic */}
            <div className="bg-white retro-border rounded-xl p-3 flex flex-col items-center shadow-pop-sm">
              <svg className="w-full h-12 text-brand-purple" fill="none" viewBox="0 0 200 50">
                <path
                  d="M5 45 C 50 45, 70 40, 100 10 C 130 40, 150 45, 195 45"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>
                <line
                  stroke="#FB7185"
                  strokeDasharray="3 3"
                  strokeWidth="2"
                  x1="100"
                  x2="100"
                  y1="5"
                  y2="45"
                ></line>
              </svg>
              <div className="w-full flex justify-between font-mono text-[10px] font-bold text-slate-500 mt-1">
                <span>-15% Variance</span>
                <span className="text-rose-600 font-extrabold">Cutoff Rank #10</span>
                <span>+15% Variance</span>
              </div>
            </div>
          </div>

          {/* Level 7: Golden Seal */}
          <div className="md:col-span-12 lg:col-span-4 bg-brand-yellow retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-brand-dark text-white font-mono font-bold text-xs retro-border shadow-pop-sm">
                  STAGE 07
                </span>
                <span className="material-symbols-outlined text-brand-dark text-2xl font-bold">
                  verified
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-brand-dark pt-1">
                Stage 7: Golden Seal Audit Envelope
              </h3>
              <p className="font-sans text-xs text-slate-800 leading-relaxed font-medium">
                Generates a cryptographically signed JSON receipt with SHA-256 parameter hashes. Instant institutional proof if sponsors ask questions.
              </p>
            </div>
            <div className="bg-white retro-border rounded-xl p-3 font-mono text-xs flex flex-col gap-1 shadow-pop-sm">
              <div className="font-bold text-brand-blue">MANIFEST_SPEC_v2.json</div>
              <div className="text-[11px] text-slate-600 truncate">sig: "MEQCIFz93u0...8yNCAiA0"</div>
              <div className="text-[10px] text-emerald-700 font-bold">STAMPED: 2026-10-07T18:02:11Z</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
