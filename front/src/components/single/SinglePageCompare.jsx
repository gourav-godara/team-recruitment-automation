import { useState, useEffect } from 'react';

export default function SinglePageCompare({
  teams,
  teamAId,
  teamBId,
  onSelectTeamA,
  onSelectTeamB,
}) {
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);

  useEffect(() => {
    if (teams && teams.length > 0) {
      const a = teams.find((t) => String(t.team_id) === String(teamAId)) || teams[0];
      const b = teams.find((t) => String(t.team_id) === String(teamBId)) || (teams.length > 1 ? teams[1] : teams[0]);
      setTeamA(a);
      setTeamB(b);
    }
  }, [teams, teamAId, teamBId]);

  if (!teams || teams.length < 2) {
    return (
      <section id="compare-section" className="scroll-mt-20 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b-4 border-[#0F172A]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-purple text-white font-mono font-bold text-xs border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                05
              </span>
              <span className="font-mono text-xs font-black uppercase tracking-wider text-purple-900">
                HEAD-TO-HEAD ARBITRATION
              </span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#0F172A] mt-1">
              Pairwise Team Comparison
            </h2>
            <p className="text-sm font-sans text-slate-600 font-medium">
              Compare any two close contenders side-by-side to review metric differences.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-8 text-center shadow-[6px_6px_0px_#0F172A] flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-center text-2xl">
            ⚖️
          </div>
          <h3 className="font-display font-black text-xl text-[#0F172A]">
            Need At Least 2 Teams Evaluated
          </h3>
          <p className="text-sm font-sans text-slate-600 max-w-md">
            Once evaluation is run, you can compare any two teams head-to-head here.
          </p>
        </div>
      </section>
    );
  }

  const scoreDiff = Number(((teamA?.total_score || 0) - (teamB?.total_score || 0)).toFixed(2));
  const isTeamAWinner = (teamA?.rank ?? 999) < (teamB?.rank ?? 999);

  return (
    <section id="compare-section" className="scroll-mt-20 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b-4 border-[#0F172A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-purple text-white font-mono font-bold text-xs border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
              05
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-purple-900">
              HEAD-TO-HEAD ARBITRATION
            </span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-[#0F172A] mt-1">
            Pairwise Team Comparison
          </h2>
          <p className="text-sm font-sans text-slate-600 font-medium">
            Side-by-side metric comparison to resolve close ranking decisions.
          </p>
        </div>

        {/* Swap button */}
        <button
          type="button"
          onClick={() => {
            const temp = teamA;
            setTeamA(teamB);
            setTeamB(temp);
          }}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">swap_horiz</span>
          <span>Swap Sides</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-4 shadow-[4px_4px_0px_#0F172A] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A Select */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-blue border border-[#0F172A]"></span>
            <span>Contender A:</span>
          </label>
          <select
            value={teamA?.team_id || ''}
            onChange={(e) => {
              const selected = teams.find((t) => String(t.team_id) === e.target.value);
              if (selected) {
                setTeamA(selected);
                if (onSelectTeamA) onSelectTeamA(selected);
              }
            }}
            className="w-full p-2 rounded-xl border-2 border-[#0F172A] font-display font-bold text-sm bg-slate-50 focus:outline-none cursor-pointer"
          >
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                Rank #{t.rank} • {t.team_name} ({Number(t.total_score || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Team B Select */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-yellow border border-[#0F172A]"></span>
            <span>Contender B:</span>
          </label>
          <select
            value={teamB?.team_id || ''}
            onChange={(e) => {
              const selected = teams.find((t) => String(t.team_id) === e.target.value);
              if (selected) {
                setTeamB(selected);
                if (onSelectTeamB) onSelectTeamB(selected);
              }
            }}
            className="w-full p-2 rounded-xl border-2 border-[#0F172A] font-display font-bold text-sm bg-slate-50 focus:outline-none cursor-pointer"
          >
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                Rank #{t.rank} • {t.team_name} ({Number(t.total_score || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      {teamA && teamB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Team A */}
          <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-brand-blue text-white border border-[#0F172A]">
                  Rank #{teamA.rank}
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#0F172A] ${
                    teamA.status === 'SHORTLISTED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {teamA.status}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#0F172A] mt-2">
                {teamA.team_name}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {teamA.team_size || 3} Roster Members
              </span>

              <div className="my-4 p-4 rounded-xl bg-blue-50 border-2 border-brand-blue flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-blue uppercase">
                  Composite Score
                </span>
                <span className="font-display font-black text-3xl text-brand-blue">
                  {Number(teamA.total_score || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                  Criteria Signals:
                </span>
                {teamA.score_details?.map((s, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-600">{s.label}</span>
                    <span className="font-mono font-bold text-[#0F172A]">{s.raw_value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Team B */}
          <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-brand-yellow text-[#0F172A] border border-[#0F172A]">
                  Rank #{teamB.rank}
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#0F172A] ${
                    teamB.status === 'SHORTLISTED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {teamB.status}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#0F172A] mt-2">
                {teamB.team_name}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {teamB.team_size || 3} Roster Members
              </span>

              <div className="my-4 p-4 rounded-xl bg-yellow-50 border-2 border-brand-yellow flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-yellow-900 uppercase">
                  Composite Score
                </span>
                <span className="font-display font-black text-3xl text-brand-dark">
                  {Number(teamB.total_score || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                  Criteria Signals:
                </span>
                {teamB.score_details?.map((s, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-600">{s.label}</span>
                    <span className="font-mono font-bold text-[#0F172A]">{s.raw_value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Differential Explanation Card */}
      {teamA && teamB && (
        <div className="bg-yellow-100/90 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono font-black text-xs text-yellow-900 uppercase">
              Rank Differential Explanation:
            </span>
            <p className="text-sm font-sans text-[#0F172A] font-medium leading-relaxed">
              {isTeamAWinner
                ? `Team "${teamA.team_name}" is ranked ahead of "${teamB.team_name}" by a margin of ${Math.abs(scoreDiff)} points, demonstrating superior metric performance across key technical indicators.`
                : `Team "${teamB.team_name}" is ranked ahead of "${teamA.team_name}" by a margin of ${Math.abs(scoreDiff)} points.`}
            </p>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl border-2 border-[#0F172A] font-mono font-bold text-xs text-[#0F172A] shrink-0">
            Δ Diff: {Math.abs(scoreDiff)} pts
          </div>
        </div>
      )}
    </section>
  );
}
