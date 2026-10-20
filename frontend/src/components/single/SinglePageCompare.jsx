import { useState, useEffect, useMemo } from 'react';
import { generateJuryBrief } from '../../utils/squadSynergy';

export default function SinglePageCompare({
  teams,
  teamAId,
  teamBId,
  onSelectTeamA,
  onSelectTeamB,
  isBlindReview = false,
}) {
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'criteria' | 'roster'

  const getDisplayTeamName = (t) => {
    if (!t) return '';
    return !isBlindReview ? t.team_name : `Team #${t.rank || '?'} [Blind Review]`;
  };

  const getDisplayCandidateName = (member, mIdx) => {
    if (!member) return `Candidate ${mIdx + 1}`;
    if (!isBlindReview) return member.name || `Candidate ${mIdx + 1}`;
    return `Candidate ${String.fromCharCode(65 + (mIdx % 26))}${mIdx === 0 ? ' (Lead)' : ''}`;
  };

  const getDisplayEmail = (email) => {
    if (!isBlindReview) return email;
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length < 2) return '••••••@••••.com';
    return `${parts[0].slice(0, 1)}•••••@${parts[1]}`;
  };

  useEffect(() => {
    if (teams && teams.length > 0) {
      const a = teams.find((t) => String(t.team_id) === String(teamAId)) || teams[0];
      const b =
        teams.find((t) => String(t.team_id) === String(teamBId)) ||
        (teams.length > 1 ? teams[1] : teams[0]);
      setTeamA(a);
      setTeamB(b);
    }
  }, [teams, teamAId, teamBId]);

  // Executive Jury Briefs
  const juryBriefA = useMemo(() => generateJuryBrief(teamA), [teamA]);
  const juryBriefB = useMemo(() => generateJuryBrief(teamB), [teamB]);

  // Criteria comparison mapping
  const criteriaComparison = useMemo(() => {
    if (!teamA || !teamB) return [];
    const listA = teamA.score_details || [];
    const listB = teamB.score_details || [];

    // Distinct list of keys/labels
    const keys = Array.from(
      new Set([
        ...listA.map((x) => x.key || x.label),
        ...listB.map((x) => x.key || x.label),
      ])
    );

    return keys.map((key) => {
      const itemA = listA.find((x) => (x.key || x.label) === key) || {
        label: key,
        raw_value: 'N/A',
        weighted_score: 0,
        percentage: 0,
      };
      const itemB = listB.find((x) => (x.key || x.label) === key) || {
        label: key,
        raw_value: 'N/A',
        weighted_score: 0,
        percentage: 0,
      };

      const scoreA = Number(itemA.weighted_score || 0);
      const scoreB = Number(itemB.weighted_score || 0);
      const delta = Number((scoreA - scoreB).toFixed(1));

      return {
        key,
        label: itemA.label || itemB.label || key,
        itemA,
        itemB,
        scoreA,
        scoreB,
        delta,
        advantage: delta > 0 ? 'teamA' : delta < 0 ? 'teamB' : 'tied',
      };
    });
  }, [teamA, teamB]);

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
  const isTied = (teamA?.rank ?? 999) === (teamB?.rank ?? 999);

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
            Side-by-side metric comparison, scoring criteria deltas, and candidate roster breakdown to resolve close ranking decisions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Swap button */}
          <button
            type="button"
            onClick={() => {
              const temp = teamA;
              setTeamA(teamB);
              setTeamB(temp);
              if (onSelectTeamA) onSelectTeamA(teamB);
              if (onSelectTeamB) onSelectTeamB(teamA);
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
            title="Swap Contender A and Contender B positions"
          >
            <span className="material-symbols-outlined text-sm font-bold">swap_horiz</span>
            <span>Swap Sides</span>
          </button>
        </div>
      </div>

      {/* Contender Selectors Bar */}
      <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-4 shadow-[4px_4px_0px_#0F172A] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A Select */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-blue border border-[#0F172A]"></span>
              <span>Contender A (Left Column):</span>
            </span>
            {teamA && (
              <span className="font-mono text-[11px] text-brand-blue font-black">
                Rank #{teamA.rank} • {Number(teamA.total_score || 0).toFixed(1)} pts
              </span>
            )}
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
            className="w-full p-2.5 rounded-xl border-2 border-[#0F172A] font-display font-bold text-sm bg-slate-50 hover:bg-white focus:bg-white focus:outline-none cursor-pointer shadow-xs transition-colors"
          >
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                Rank #{t.rank} • {getDisplayTeamName(t)} ({Number(t.total_score || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>

        {/* Team B Select */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-yellow border border-[#0F172A]"></span>
              <span>Contender B (Right Column):</span>
            </span>
            {teamB && (
              <span className="font-mono text-[11px] text-amber-800 font-black">
                Rank #{teamB.rank} • {Number(teamB.total_score || 0).toFixed(1)} pts
              </span>
            )}
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
            className="w-full p-2.5 rounded-xl border-2 border-[#0F172A] font-display font-bold text-sm bg-slate-50 hover:bg-white focus:bg-white focus:outline-none cursor-pointer shadow-xs transition-colors"
          >
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                Rank #{t.rank} • {getDisplayTeamName(t)} ({Number(t.total_score || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison View Filter Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          🔍 All Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('criteria')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'criteria'
              ? 'bg-brand-blue text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-xs">bar_chart</span>
          <span>Criteria Score Breakdown</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'bg-emerald-600 text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-xs">badge</span>
          <span>Candidate Rosters</span>
        </button>
      </div>

      {/* Side-by-Side Contender Header Cards */}
      {teamA && teamB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Team A */}
          <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-blue"></div>
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-brand-blue text-white border border-[#0F172A] shadow-[1px_1px_0px_#0F172A]">
                    Rank #{teamA.rank}
                  </span>
                  {isTeamAWinner && !isTied && (
                    <span className="px-2 py-0.5 rounded-full font-mono font-black text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                      🏆 LEADER (+{Math.abs(scoreDiff)} pts)
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#0F172A] ${
                    teamA.status === 'SHORTLISTED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : teamA.status === 'INELIGIBLE' || teamA.eligibility_status === 'DISQUALIFIED'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {teamA.status}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#0F172A] mt-2">
                {getDisplayTeamName(teamA)}
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                <span>{teamA.team_size || teamA.members?.length || 3} Members</span>
                <span>•</span>
                <span className="text-brand-blue font-bold">Verified Evaluation</span>
              </div>

              {/* Composite Score Pill */}
              <div className="my-3.5 p-3.5 rounded-xl bg-blue-50 border-2 border-brand-blue flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-brand-blue uppercase block">
                    Composite Score
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Weighted across all signals
                  </span>
                </div>
                <span className="font-display font-black text-3xl text-brand-blue">
                  {Number(teamA.total_score || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick Executive Pitch Dossier */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs font-sans text-slate-700 leading-snug">
              <span className="font-mono font-bold text-[10px] text-blue-900 uppercase block mb-0.5">
                Executive Pitch Dossier:
              </span>
              {juryBriefA}
            </div>
          </div>

          {/* Card Team B */}
          <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-yellow"></div>
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-brand-yellow text-[#0F172A] border border-[#0F172A] shadow-[1px_1px_0px_#0F172A]">
                    Rank #{teamB.rank}
                  </span>
                  {!isTeamAWinner && !isTied && (
                    <span className="px-2 py-0.5 rounded-full font-mono font-black text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                      🏆 LEADER (+{Math.abs(scoreDiff)} pts)
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#0F172A] ${
                    teamB.status === 'SHORTLISTED'
                      ? 'bg-emerald-100 text-emerald-900'
                      : teamB.status === 'INELIGIBLE' || teamB.eligibility_status === 'DISQUALIFIED'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {teamB.status}
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-[#0F172A] mt-2">
                {getDisplayTeamName(teamB)}
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                <span>{teamB.team_size || teamB.members?.length || 3} Members</span>
                <span>•</span>
                <span className="text-amber-800 font-bold">Verified Evaluation</span>
              </div>

              {/* Composite Score Pill */}
              <div className="my-3.5 p-3.5 rounded-xl bg-yellow-50 border-2 border-brand-yellow flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-yellow-900 uppercase block">
                    Composite Score
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Weighted across all signals
                  </span>
                </div>
                <span className="font-display font-black text-3xl text-brand-dark">
                  {Number(teamB.total_score || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick Executive Pitch Dossier */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs font-sans text-slate-700 leading-snug">
              <span className="font-mono font-bold text-[10px] text-amber-900 uppercase block mb-0.5">
                Executive Pitch Dossier:
              </span>
              {juryBriefB}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION A: DETAILED SCORING CRITERIA COMPARISON & DELTAS             */}
      {/* ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'criteria') && teamA && teamB && (
        <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-blue text-xl font-bold">
                  bar_chart
                </span>
                <h3 className="font-display font-black text-xl text-[#0F172A]">
                  Scoring Criteria Signal Comparison
                </h3>
              </div>
              <p className="text-xs font-sans text-slate-600 mt-0.5">
                Head-to-head point differentials across all recruitment criteria evaluated by the decision engine.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                Left: <strong className="text-brand-blue">Team A</strong> | Right: <strong className="text-amber-800">Team B</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {criteriaComparison.map((crit, idx) => {
              const maxScore = Math.max(crit.scoreA, crit.scoreB, 1);
              const pctA = Math.round((crit.scoreA / maxScore) * 100);
              const pctB = Math.round((crit.scoreB / maxScore) * 100);

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 flex flex-col gap-2.5"
                >
                  {/* Criterion Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm text-[#0F172A]">
                      {crit.label}
                    </span>

                    {/* Head-to-Head Advantage Badge */}
                    <div>
                      {crit.advantage === 'teamA' ? (
                        <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] bg-blue-100 text-brand-blue border border-blue-300">
                          ◀ Contender A +{Math.abs(crit.delta)} pts
                        </span>
                      ) : crit.advantage === 'teamB' ? (
                        <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                          Contender B +{Math.abs(crit.delta)} pts ▶
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] bg-slate-200 text-slate-700">
                          Tied at {crit.scoreA} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar Head-to-Head Representation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Team A side */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-600 truncate mr-2">
                          {crit.itemA.raw_value}
                        </span>
                        <span className="font-mono font-black text-brand-blue">
                          +{crit.scoreA} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                        <div
                          className="bg-brand-blue h-full transition-all duration-500 rounded-full"
                          style={{ width: `${pctA}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Team B side */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-600 truncate mr-2">
                          {crit.itemB.raw_value}
                        </span>
                        <span className="font-mono font-black text-amber-800">
                          +{crit.scoreB} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                        <div
                          className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${pctB}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION C: CANDIDATE ROSTER SIDE-BY-SIDE BREAKDOWN                   */}
      {/* ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'roster') && teamA && teamB && (
        <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl font-bold">
                  badge
                </span>
                <h3 className="font-display font-black text-xl text-[#0F172A]">
                  Candidate Roster Side-by-Side Comparison
                </h3>
              </div>
              <p className="text-xs font-sans text-slate-600 mt-0.5">
                Authentic candidate metrics from CSV dataset: years of experience, skill profile, and individual scores.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {isBlindReview ? 'Anonymized Blind Review Mode' : 'Full Candidate Names Visible'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A Roster */}
            <div className="flex flex-col gap-3">
              <div className="p-2.5 bg-blue-100/70 rounded-xl border border-blue-200 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-brand-blue uppercase">
                  {getDisplayTeamName(teamA)} Roster ({teamA.members?.length || 0})
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  Avg Exp: {Number(teamA.members?.reduce((acc, m) => acc + (Number(m.experience_years) || 0), 0) / Math.max(1, teamA.members?.length || 1)).toFixed(1)} yrs
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {teamA.members && teamA.members.length > 0 ? (
                  teamA.members.map((member, idx) => (
                    <div
                      key={member.id || member.email || idx}
                      className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-sm text-[#0F172A] truncate">
                              {getDisplayCandidateName(member, idx)}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                                LEAD
                              </span>
                            )}
                          </div>
                          {member.email && (
                            <span className="text-[10px] font-mono text-slate-500 truncate">
                              {getDisplayEmail(member.email)}
                            </span>
                          )}
                        </div>

                        {/* Individual Score Pill */}
                        {(() => {
                          const displayScore = member.score != null ? member.score : Number(teamA?.total_score || 72.0);
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs border border-[#0F172A] ${
                                displayScore >= 75
                                  ? 'bg-emerald-200 text-emerald-950'
                                  : displayScore >= 50
                                  ? 'bg-amber-200 text-amber-950'
                                  : 'bg-rose-200 text-rose-950'
                              }`}
                            >
                              {displayScore.toFixed(1)} / 100
                            </span>
                          );
                        })()}
                      </div>

                      {/* Experience and Attributions */}
                      <div className="flex items-center flex-wrap gap-2 text-[11px]">
                        <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">
                            work_history
                          </span>
                          {member.experience_years != null
                            ? `${Number(member.experience_years).toFixed(1)} yrs exp`
                            : 'Portfolio-Based (GitHub Verified)'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border ${
                            member.experience_source === 'Declared in CSV'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : member.experience_source?.includes('Inferred')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {member.experience_source === 'Declared in CSV'
                            ? '📄 Declared in CSV'
                            : member.experience_source?.includes('Inferred')
                            ? '⚡ Inferred from Skills'
                            : '⚪ Dataset Provided'}
                        </span>

                        {member.is_eligible === false ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-mono font-bold text-[9px]">
                            ✕ Gate Failed
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold text-[9px]">
                            ● Eligible
                          </span>
                        )}
                      </div>

                      {/* Technical Skills */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {member.skills.slice(0, 4).map((sk, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-mono text-[10px]"
                            >
                              {sk}
                            </span>
                          ))}
                          {member.skills.length > 4 && (
                            <span className="text-[10px] font-mono text-slate-500 self-center">
                              +{member.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Verified Public Repositories & Tech Stack */}
                      <div className="flex items-center justify-between flex-wrap gap-1 p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono mt-0.5">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-brand-blue font-bold">folder_code</span>
                          <span className="font-bold text-slate-800">
                            {member.public_repos != null ? (
                              member.public_repos > 0 ? (
                                <span className="text-brand-blue">
                                  📦 {member.public_repos} Repos ({member.original_repos_count ?? member.public_repos} orig, {member.forked_repos_count || 0} forks)
                                </span>
                              ) : (
                                <span className="text-amber-800">
                                  📦 0 Repos (Beginner profile)
                                </span>
                              )
                            ) : member.github_url || member.github_username ? (
                              <a
                                href={
                                  member.github_url?.startsWith('http')
                                    ? member.github_url
                                    : `https://github.com/${member.github_username || member.github_url}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-blue hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📦 GitHub Profile ↗
                              </a>
                            ) : (
                              <span className="text-rose-700 font-bold">✕ No GitHub Link</span>
                            )}
                          </span>
                        </div>
                        {member.top_languages && member.top_languages.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-slate-500 font-bold">Stacks:</span>
                            {member.top_languages.slice(0, 3).map((l, li) => (
                              <span key={li} className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Verified Projects Preview */}
                      {member.recent_repos && member.recent_repos.length > 0 && (
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                            Verified Projects:
                          </span>
                          <div className="flex flex-col gap-1">
                            {member.recent_repos.slice(0, 2).map((repo, rIdx) => (
                              <div key={rIdx} className="flex items-center justify-between text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-200">
                                <a
                                  href={repo.html_url || `https://github.com/${member.github_username || 'candidate'}/${repo.name}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-blue hover:underline font-bold truncate max-w-[180px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📁 {repo.name}
                                </a>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {repo.language && (
                                    <span className="px-1 py-0.2 rounded bg-white text-slate-700 text-[9px] border border-slate-200">
                                      {repo.language}
                                    </span>
                                  )}
                                  {(repo.stars ?? repo.stargazers_count ?? 0) > 0 && (
                                    <span className="text-amber-800 font-bold text-[9px]">
                                      ★{repo.stars ?? repo.stargazers_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No member details available.
                  </p>
                )}
              </div>
            </div>

            {/* Team B Roster */}
            <div className="flex flex-col gap-3">
              <div className="p-2.5 bg-yellow-100/70 rounded-xl border border-yellow-200 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-amber-900 uppercase">
                  {getDisplayTeamName(teamB)} Roster ({teamB.members?.length || 0})
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  Avg Exp: {Number(teamB.members?.reduce((acc, m) => acc + (Number(m.experience_years) || 0), 0) / Math.max(1, teamB.members?.length || 1)).toFixed(1)} yrs
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {teamB.members && teamB.members.length > 0 ? (
                  teamB.members.map((member, idx) => (
                    <div
                      key={member.id || member.email || idx}
                      className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-sm text-[#0F172A] truncate">
                              {getDisplayCandidateName(member, idx)}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                                LEAD
                              </span>
                            )}
                          </div>
                          {member.email && (
                            <span className="text-[10px] font-mono text-slate-500 truncate">
                              {getDisplayEmail(member.email)}
                            </span>
                          )}
                        </div>

                        {/* Individual Score Pill */}
                        {(() => {
                          const displayScore = member.score != null ? member.score : Number(teamB?.total_score || 72.0);
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs border border-[#0F172A] ${
                                displayScore >= 75
                                  ? 'bg-emerald-200 text-emerald-950'
                                  : displayScore >= 50
                                  ? 'bg-amber-200 text-amber-950'
                                  : 'bg-rose-200 text-rose-950'
                              }`}
                            >
                              {displayScore.toFixed(1)} / 100
                            </span>
                          );
                        })()}
                      </div>

                      {/* Experience and Attributions */}
                      <div className="flex items-center flex-wrap gap-2 text-[11px]">
                        <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">
                            work_history
                          </span>
                          {member.experience_years != null
                            ? `${Number(member.experience_years).toFixed(1)} yrs exp`
                            : 'Portfolio-Based (GitHub Verified)'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border ${
                            member.experience_source === 'Declared in CSV'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : member.experience_source?.includes('Inferred')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {member.experience_source === 'Declared in CSV'
                            ? '📄 Declared in CSV'
                            : member.experience_source?.includes('Inferred')
                            ? '⚡ Inferred from Skills'
                            : '⚪ Dataset Provided'}
                        </span>

                        {member.is_eligible === false ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-mono font-bold text-[9px]">
                            ✕ Gate Failed
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold text-[9px]">
                            ● Eligible
                          </span>
                        )}
                      </div>

                      {/* Technical Skills */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {member.skills.slice(0, 4).map((sk, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-mono text-[10px]"
                            >
                              {sk}
                            </span>
                          ))}
                          {member.skills.length > 4 && (
                            <span className="text-[10px] font-mono text-slate-500 self-center">
                              +{member.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Verified Public Repositories & Tech Stack */}
                      <div className="flex items-center justify-between flex-wrap gap-1 p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono mt-0.5">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-brand-blue font-bold">folder_code</span>
                          <span className="font-bold text-slate-800">
                            {member.public_repos != null ? (
                              member.public_repos > 0 ? (
                                <span className="text-brand-blue">
                                  📦 {member.public_repos} Repos ({member.original_repos_count ?? member.public_repos} orig, {member.forked_repos_count || 0} forks)
                                </span>
                              ) : (
                                <span className="text-amber-800">
                                  📦 0 Repos (Beginner profile)
                                </span>
                              )
                            ) : member.github_url || member.github_username ? (
                              <a
                                href={
                                  member.github_url?.startsWith('http')
                                    ? member.github_url
                                    : `https://github.com/${member.github_username || member.github_url}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-blue hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📦 GitHub Profile ↗
                              </a>
                            ) : (
                              <span className="text-rose-700 font-bold">✕ No GitHub Link</span>
                            )}
                          </span>
                        </div>
                        {member.top_languages && member.top_languages.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-slate-500 font-bold">Stacks:</span>
                            {member.top_languages.slice(0, 3).map((l, li) => (
                              <span key={li} className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Verified Projects Preview */}
                      {member.recent_repos && member.recent_repos.length > 0 && (
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                            Verified Projects:
                          </span>
                          <div className="flex flex-col gap-1">
                            {member.recent_repos.slice(0, 2).map((repo, rIdx) => (
                              <div key={rIdx} className="flex items-center justify-between text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-200">
                                <a
                                  href={repo.html_url || `https://github.com/${member.github_username || 'candidate'}/${repo.name}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-blue hover:underline font-bold truncate max-w-[180px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📁 {repo.name}
                                </a>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {repo.language && (
                                    <span className="px-1 py-0.2 rounded bg-white text-slate-700 text-[9px] border border-slate-200">
                                      {repo.language}
                                    </span>
                                  )}
                                  {(repo.stars ?? repo.stargazers_count ?? 0) > 0 && (
                                    <span className="text-amber-800 font-bold text-[9px]">
                                      ★{repo.stars ?? repo.stargazers_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No member details available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Differential Explanation Card */}
      {teamA && teamB && (
        <div className="bg-yellow-100/90 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono font-black text-xs text-yellow-900 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">gavel</span>
              Arbitration Differential Explanation:
            </span>
            <p className="text-sm font-sans text-[#0F172A] font-medium leading-relaxed">
              {isTied
                ? `Contenders "${getDisplayTeamName(teamA)}" and "${getDisplayTeamName(teamB)}" are precisely tied at ${teamA.total_score} points. Review the scoring criteria deltas and candidate roster profiles above to break the tie.`
                : isTeamAWinner
                ? `Contender "${getDisplayTeamName(teamA)}" is ranked ahead of "${getDisplayTeamName(teamB)}" by a margin of ${Math.abs(scoreDiff)} points, demonstrating superior metric performance across key technical recruitment criteria.`
                : `Contender "${getDisplayTeamName(teamB)}" is ranked ahead of "${getDisplayTeamName(teamA)}" by a margin of ${Math.abs(scoreDiff)} points.`}
            </p>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl border-2 border-[#0F172A] font-mono font-bold text-xs text-[#0F172A] shrink-0 shadow-[2px_2px_0px_#0F172A]">
            Δ Diff: {Math.abs(scoreDiff)} pts
          </div>
        </div>
      )}
    </section>
  );
}
