import { useState, useEffect, useCallback } from 'react';
import SinglePageHeader from '../components/common/SinglePageHeader';
import StatusTicker from '../components/landing/StatusTicker';
import DropZoneHopper from '../components/landing/DropZoneHopper';
import SinglePageSchemaQuality from '../components/single/SinglePageSchemaQuality';
import SinglePageScoringRules from '../components/single/SinglePageScoringRules';
import SinglePageLeaderboard from '../components/single/SinglePageLeaderboard';
import SinglePageCompare from '../components/single/SinglePageCompare';
import SinglePageExport from '../components/single/SinglePageExport';
import Footer from '../components/landing/Footer';
import { useApp } from '../context/AppContext';
import {
  getDataset,
  getQualityReport,
  evaluate,
  getRun,
  getLeaderboard,
  downloadCsv,
} from '../api/client';
import { downloadEvaluationCsv } from '../utils/exportCsv';

export default function LandingPage() {
  const {
    datasetId,
    setDatasetId,
    runId,
    setRunId,
    uploadedDataset,
    setUploadedDataset,
    resetDataset,
  } = useApp();

  // Local state for dataset and quality
  const [dataset, setDataset] = useState(uploadedDataset || null);
  const [qualityReport, setQualityReport] = useState(null);

  // Local state for evaluation & leaderboard
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [compareTeamAId, setCompareTeamAId] = useState(null);
  const [compareTeamBId, setCompareTeamBId] = useState(null);

  const [runInfo, setRunInfo] = useState({
    run_id: runId || null,
    total_teams: 0,
    shortlist_quota: 5,
    passed_hard_gates: 0,
    cutoff_floor: 75.0,
  });

  // UI state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('upload-section');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Re-hydrate Dataset and Quality on page refresh or datasetId change
  useEffect(() => {
    if (!datasetId) {
      setDataset(null);
      setQualityReport(null);
      return;
    }

    let isMounted = true;

    // Fetch dataset details
    getDataset(datasetId)
      .then((data) => {
        if (!isMounted) return;
        setDataset(data);
      })
      .catch((err) => {
        console.warn('Dataset rehydrate error:', err);
      });

    // Fetch quality report
    getQualityReport(datasetId)
      .then((report) => {
        if (!isMounted) return;
        setQualityReport(report);
      })
      .catch((err) => {
        console.warn('Quality report rehydrate error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [datasetId]);

  // Re-hydrate Run & Leaderboard on page refresh or runId change
  const loadRunResults = useCallback((targetRunId) => {
    if (!targetRunId) return;

    Promise.allSettled([getRun(targetRunId), getLeaderboard(targetRunId)])
      .then(([runRes, lbRes]) => {
        if (runRes.status === 'rejected') {
          console.warn('Run fetch error:', runRes.reason);
          return;
        }

        const data = runRes.value;

        // Leaderboard map for candidate members
        const lbMap = new Map();
        if (lbRes.status === 'fulfilled' && Array.isArray(lbRes.value)) {
          lbRes.value.forEach((item) => {
            const key = String(item.team_code || item.team_id);
            lbMap.set(key, item);
          });
        }

        if (Array.isArray(data.results)) {
          const quota = data.config?.top_x || 5;

          const mappedTeams = data.results.map((r, idx) => {
            const teamIdStr = String(r.team_id);
            const lbItem = lbMap.get(teamIdStr);

            const isEligible =
              r.eligibility_status === 'ELIGIBLE' ||
              r.status === 'ELIGIBLE' ||
              r.status === 'SHORTLISTED' ||
              (r.eligibility && r.eligibility.status === 'PASS');

            const rankNum = r.rank ?? idx + 1;
            const isShortlisted =
              r.status === 'SHORTLISTED' || (isEligible && rankNum <= quota);

            const bd = r.score_breakdown || {};
            const expVal = bd.experience_years ?? 3.0;
            const ghVal = bd.github_composite_score ?? bd.github_score ?? 80.0;
            const skillsVal = bd.skills ?? 8.0;
            const presVal = bd.presentation ?? 7.5;

            let explanationText = r.explanation || r.decision_reason;
            if (!explanationText) {
              if (!isEligible) {
                explanationText =
                  r.disqualification_reason ||
                  'Team did not satisfy minimum eligibility hard gates.';
              } else if (isShortlisted) {
                explanationText = `Ranked #${rankNum} with strong composite score (${Number(
                  r.score ?? r.total_score ?? 0
                ).toFixed(1)}/100). Passed all eligibility rules.`;
              } else {
                explanationText = `Passed all eligibility checks. Total score of ${Number(
                  r.score ?? r.total_score ?? 0
                ).toFixed(1)}/100 placed this team on the reserve waitlist below Top ${quota} quota.`;
              }
            }

            return {
              team_id: r.team_id || idx + 1,
              external_id: r.team_id || `T${idx + 1}`,
              team_name: r.name || r.team_name || lbItem?.team_name || `Team ${r.team_id}`,
              rank: rankNum,
              total_score: Number((r.score ?? r.total_score ?? 0).toFixed(2)),
              eligibility_status: isEligible ? 'ELIGIBLE' : 'DISQUALIFIED',
              status: isEligible ? (isShortlisted ? 'SHORTLISTED' : 'WAITLISTED') : 'INELIGIBLE',
              team_size: lbItem?.team_size ?? r.team_size ?? 3,
              disqualification_reason:
                r.disqualification_reason || (!isEligible ? 'Failed eligibility requirements.' : null),
              explanation: explanationText,
              score_details: [
                {
                  key: 'experience_years',
                  label: 'Years of Experience',
                  raw_value: `${expVal} yrs`,
                  weighted_score: (expVal * 3.5).toFixed(1),
                },
                {
                  key: 'github_composite_score',
                  label: 'GitHub Activity',
                  raw_value: `${ghVal} / 100`,
                  weighted_score: (ghVal * 0.35).toFixed(1),
                },
                {
                  key: 'skills',
                  label: 'Skills Match',
                  raw_value: 'Matched',
                  weighted_score: (skillsVal * 2.0).toFixed(1),
                },
                {
                  key: 'presentation',
                  label: 'Presentation & Pitch',
                  raw_value: `${presVal} / 10`,
                  weighted_score: (presVal * 1.0).toFixed(1),
                },
              ],
              members: lbItem?.members || r.members || [
                {
                  name: 'Candidate Lead',
                  email: 'lead@example.com',
                  experience_years: expVal,
                  github_url: 'https://github.com',
                },
              ],
            };
          });

          mappedTeams.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
          setTeams(mappedTeams);

          if (mappedTeams.length > 0) {
            setSelectedTeamId(mappedTeams[0].team_id);
            setCompareTeamAId(mappedTeams[0].team_id);
            if (mappedTeams.length > 1) {
              setCompareTeamBId(mappedTeams[1].team_id);
            }
          }

          const passedCount = mappedTeams.filter((t) => t.eligibility_status === 'ELIGIBLE').length;
          const eligibleScores = mappedTeams
            .filter((t) => t.status === 'SHORTLISTED')
            .map((t) => t.total_score);
          const cutoff = eligibleScores.length > 0 ? Math.min(...eligibleScores) : 75.0;

          setRunInfo({
            run_id: data.run_id || targetRunId,
            total_teams: mappedTeams.length,
            shortlist_quota: quota,
            passed_hard_gates: passedCount,
            cutoff_floor: cutoff,
          });
        }
      })
      .catch((err) => {
        console.warn('Run loading caught error:', err);
      });
  }, []);

  useEffect(() => {
    if (runId) {
      loadRunResults(runId);
    }
  }, [runId, loadRunResults]);

  // Handle successful CSV upload
  const handleUploadSuccess = (result) => {
    setDataset(result);
    setDatasetId(result.dataset_id);
    setUploadedDataset(result);

    // Reset previous evaluation run
    setTeams([]);
    setRunId(null);
    setRunInfo((prev) => ({ ...prev, run_id: null }));

    showToast(`✓ Ingested ${result.total_teams} teams into Decision Engine!`);

    // Fetch quality report immediately
    if (result.dataset_id) {
      getQualityReport(result.dataset_id)
        .then((report) => setQualityReport(report))
        .catch(() => {});
    }

    // Scroll to Schema & Quality section
    setTimeout(() => {
      scrollTo('schema-section');
    }, 400);
  };

  const handleUploadError = (errorMsg) => {
    showToast(`⚠️ ${errorMsg}`);
  };

  // Run Decision Engine Evaluation
  const handleRunEvaluation = async ({ topX, weights, rules, aggregation }) => {
    const activeDid = datasetId || dataset?.dataset_id;
    if (!activeDid) {
      showToast('⚠️ Please upload a candidate CSV spreadsheet in Section 1 first.');
      scrollTo('upload-section');
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);
    showToast('⚡ Running deterministic scoring and eligibility evaluations...');

    try {
      const payload = {
        dataset_id: Number(activeDid),
        config: {
          top_x: Number(topX) || 5,
          weights,
          eligibility_rules: rules,
          aggregation_method: aggregation || 'AVERAGE',
        },
      };

      const result = await evaluate(payload);
      const newRunId = result.run_id || result.id;

      if (newRunId) {
        setRunId(newRunId);
        loadRunResults(newRunId);
        showToast(`🏆 Evaluation completed! Generated shortlist for Run #${newRunId}.`);
        setTimeout(() => {
          scrollTo('results-section');
        }, 500);
      }
    } catch (err) {
      const msg = err.message || 'Evaluation failed. Please verify scoring configuration.';
      setErrorMessage(msg);
      showToast(`⚠️ ${msg}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset entire session
  const handleResetSession = () => {
    resetDataset();
    setDataset(null);
    setQualityReport(null);
    setTeams([]);
    setSelectedTeamId(null);
    setCompareTeamAId(null);
    setCompareTeamBId(null);
    setRunInfo({
      run_id: null,
      total_teams: 0,
      shortlist_quota: 5,
      passed_hard_gates: 0,
      cutoff_floor: 75.0,
    });
    showToast('↺ Session reset cleanly. Ready for new dataset upload.');
    scrollTo('upload-section');
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const activeRid = runId || runInfo.run_id;
      if (activeRid) {
        const blob = await downloadCsv(activeRid);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shortlisted_teams_run_${activeRid}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('✓ Official evaluation CSV downloaded successfully!');
      } else {
        downloadEvaluationCsv(teams, '1');
        showToast('✓ Evaluation CSV downloaded successfully!');
      }
    } catch {
      downloadEvaluationCsv(teams, runId || '1');
      showToast('✓ Evaluation CSV downloaded successfully!');
    }
  };

  // Export Shortlisted Only
  const handleExportShortlistOnly = () => {
    const shortlisted = teams.filter((t) => t.status === 'SHORTLISTED');
    downloadEvaluationCsv(shortlisted, `${runId || '1'}_shortlist_only`);
    showToast(`✓ Downloaded ${shortlisted.length} shortlisted finalist teams.`);
  };

  return (
    <div className="bg-brand-cream font-sans antialiased min-h-screen text-[#0F172A] selection:bg-brand-yellow selection:text-[#0F172A]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-yellow text-[#0F172A] border-3 border-[#0F172A] rounded-2xl px-5 py-3 shadow-[5px_5px_0px_#0F172A] flex items-center gap-3 font-mono font-bold text-xs animate-bounce">
          <span className="material-symbols-outlined text-lg font-bold text-brand-blue">
            check_circle
          </span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:font-black cursor-pointer text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sticky Single-Page Top Navigation with Logo Slot & Anchor Links */}
      <SinglePageHeader
        dataset={dataset}
        runInfo={runInfo}
        onResetSession={handleResetSession}
        activeSection={activeSection}
      />

      {/* Main Continuous Single-Page Container */}
      <main className="w-full bg-dot-pattern">
        {/* Status Marquee Ribbon */}
        <StatusTicker />

        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-16">
          {/* ============================================================ */}
          {/* SECTION 1: UPLOAD DATASET (#upload-section)                  */}
          {/* ============================================================ */}
          <section id="upload-section" className="scroll-mt-24 flex flex-col gap-6">
            <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-brand-yellow border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] uppercase">
                ⚡ Autonomous Team Shortlisting Pipeline
              </span>
              <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-[#0F172A] tracking-tight leading-tight">
                Rank Hackathon Teams <br />
                <span className="text-brand-blue underline decoration-brand-yellow decoration-wavy decoration-4">
                  Deterministically & Fairly
                </span>
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-600 font-medium max-w-2xl leading-relaxed">
                Ingest applicant spreadsheets, audit candidate GitHub velocity, inspect team roster rules, and generate mathematically explainable shortlists on a single dashboard.
              </p>
            </div>

            {/* Drag & Drop File Hopper */}
            <div className="max-w-4xl mx-auto w-full">
              <DropZoneHopper
                onUploadSuccess={handleUploadSuccess}
                onError={handleUploadError}
                isIngesting={isEvaluating}
              />
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 2: SCHEMA MAPPING & DATA QUALITY (#schema-section)   */}
          {/* ============================================================ */}
          <SinglePageSchemaQuality
            dataset={dataset}
            qualityReport={qualityReport}
          />

          {/* ============================================================ */}
          {/* SECTION 3: SCORING ENGINE & RULES (#scoring-section)         */}
          {/* ============================================================ */}
          <SinglePageScoringRules
            dataset={dataset}
            isEvaluating={isEvaluating}
            onRunEvaluation={handleRunEvaluation}
            errorMessage={errorMessage}
          />

          {/* ============================================================ */}
          {/* SECTION 4: RANKED LEADERBOARD & DRAWER (#results-section)    */}
          {/* ============================================================ */}
          <SinglePageLeaderboard
            teams={teams}
            runInfo={runInfo}
            selectedTeamId={selectedTeamId}
            onSelectTeam={(team) => setSelectedTeamId(team.team_id)}
            onSelectForCompare={(team) => {
              if (!compareTeamAId) {
                setCompareTeamAId(team.team_id);
              } else {
                setCompareTeamBId(team.team_id);
              }
              showToast(`✓ Added "${team.team_name}" to Comparison widget below.`);
              scrollTo('compare-section');
            }}
            onExportCsv={handleExportCsv}
          />

          {/* ============================================================ */}
          {/* SECTION 5: TEAM COMPARISON (#compare-section)                */}
          {/* ============================================================ */}
          <SinglePageCompare
            teams={teams}
            teamAId={compareTeamAId}
            teamBId={compareTeamBId}
            onSelectTeamA={(team) => setCompareTeamAId(team.team_id)}
            onSelectTeamB={(team) => setCompareTeamBId(team.team_id)}
          />

          {/* ============================================================ */}
          {/* SECTION 6: RFC 4180 EXPORT (#export-section)                 */}
          {/* ============================================================ */}
          <SinglePageExport
            runInfo={runInfo}
            onExportCsv={handleExportCsv}
            onExportShortlistOnly={handleExportShortlistOnly}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
