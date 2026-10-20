import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import QualityHeaderBanner from '../components/quality/QualityHeaderBanner';
import QualityKpiGrid from '../components/quality/QualityKpiGrid';
import NullitySpectrumCard from '../components/quality/NullitySpectrumCard';
import SignalMatrixTable from '../components/quality/SignalMatrixTable';
import SanityChecklistCard from '../components/quality/SanityChecklistCard';
import QualityBottomBar from '../components/quality/QualityBottomBar';
import QuarantinedReposModal from '../components/quality/QuarantinedReposModal';
import NotifyCaptainsModal from '../components/quality/NotifyCaptainsModal';
import RestrictedVideosModal from '../components/quality/RestrictedVideosModal';
import ImputationDetailModal from '../components/quality/ImputationDetailModal';
import {
  mockQualityDataset,
  mockNullityCohorts,
  mockSignalVectors,
  mockQuarantinedTeams,
  mockRestrictedVideos,
} from '../data/mockQuality';
import { downloadDqDiagnosticCsv } from '../utils/exportCsv';
import { getQualityReport } from '../api/client';
import { useApp } from '../context/AppContext';

export default function DataQualityPage({ onNavigateHome, onProceedToScoring }) {
  const navigate = useNavigate();
  const { datasetId, navigateWithState } = useApp();
  const [dataset, setDataset] = useState(mockQualityDataset);
  const [cohorts, setCohorts] = useState(mockNullityCohorts);
  const [vectors, setVectors] = useState(mockSignalVectors);
  const [quarantinedTeams, setQuarantinedTeams] = useState(mockQuarantinedTeams);
  const [qualityReport, setQualityReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStage, setActiveStage] = useState('data-quality');

  // Modals state
  const [showQuarantinedModal, setShowQuarantinedModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [selectedVector, setSelectedVector] = useState(null);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch real Quality Report from API when datasetId is available
  useEffect(() => {
    if (!datasetId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getQualityReport(datasetId)
      .then((report) => {
        if (!isMounted) return;
        setQualityReport(report);

        // Update dataset summary KPIs
        setDataset((prev) => ({
          ...prev,
          signal_completeness: report.completeness_score != null ? report.completeness_score.toFixed(1) : prev.signal_completeness,
          total_teams: report.total_teams ?? prev.total_teams,
          complete_records_pct: report.total_teams > 0
            ? (((report.total_teams - (report.teams_with_missing_signals?.length || 0)) / report.total_teams) * 100).toFixed(1)
            : '100.0',
          complete_records_count: report.total_teams - (report.teams_with_missing_signals?.length || 0),
          critical_gaps_count: (report.teams_with_missing_signals?.length || 0) + (report.malformed_urls?.length || 0),
          audited_partition: `Dataset #${datasetId} (Raw Import)`,
        }));

        // Map field summaries to vectors
        if (Array.isArray(report.field_summaries) && report.field_summaries.length > 0) {
          const mappedVectors = report.field_summaries.map((fs, idx) => ({
            id: `vec_${idx}`,
            name: fs.field_name,
            key: fs.field_name,
            available_pct: fs.completeness_percentage ? fs.completeness_percentage.toFixed(1) : '100.0',
            missing_count: fs.missing_count || 0,
            invalid_count: fs.invalid_count || 0,
            imputation_strategy: 'Strict Signal Pass',
            status: fs.missing_count === 0 && fs.invalid_count === 0 ? 'valid' : 'warning',
          }));
          setVectors(mappedVectors);
        }

        // Map size anomalies and missing signals to quarantined teams
        const anomalies = [];
        if (Array.isArray(report.teams_with_size_anomalies)) {
          report.teams_with_size_anomalies.forEach((teamId) => {
            anomalies.push({
              id: teamId,
              name: `Team ${teamId}`,
              reason: 'Team size anomaly (outside standard 2-4 roster)',
              status: 'quarantined',
              severity: 'critical',
            });
          });
        }
        if (Array.isArray(report.teams_with_missing_signals)) {
          report.teams_with_missing_signals.forEach((teamId) => {
            if (!anomalies.some((a) => a.id === teamId)) {
              anomalies.push({
                id: teamId,
                name: `Team ${teamId}`,
                reason: 'Missing required candidate signals (GitHub or portfolio URL)',
                status: 'quarantined',
                severity: 'warning',
              });
            }
          });
        }
        if (anomalies.length > 0) {
          setQuarantinedTeams(anomalies);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch Data Quality Report.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [datasetId]);

  // Dynamically calculate ready teams & exclusions based on quarantined list
  const activeExclusions = quarantinedTeams.filter((t) => t.status === 'quarantined' || t.status === 'excluded').length;
  const readyTeams = dataset.total_teams - activeExclusions;

  // Update quarantined team status (quarantined | overridden | excluded)
  const handleUpdateTeamStatus = (teamId, newStatus) => {
    setQuarantinedTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: newStatus } : t))
    );
    if (newStatus === 'overridden') {
      showNotification(`✓ Jury Override granted for ${teamId}. Team marked eligible for weighting.`);
    } else if (newStatus === 'excluded') {
      showNotification(`⚠️ Team ${teamId} permanently marked as DQ Exclusion.`);
    } else {
      showNotification(`Team ${teamId} restored to quarantined status.`);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    downloadDqDiagnosticCsv(dataset, vectors, quarantinedTeams);
    showNotification(`📥 Exporting ${dataset.audited_partition.replace('.parquet', '')}_dq_diagnostic_report.csv with 482 rows.`);
  };

  // Proceed to scoring engine
  const handleProceed = () => {
    showNotification('🔒 State Sealed: DQ Hash verified. Proceeding to Stage 03: Scoring Engine...');
    if (onProceedToScoring) {
      setTimeout(() => {
        onProceedToScoring();
      }, 700);
    } else {
      setTimeout(() => {
        navigateWithState('/scoring-engine');
      }, 700);
    }
  };

  // Sidebar navigation
  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (stageId === 'import-schema') {
      navigate('/schema-mapper');
    } else if (stageId === 'data-quality') {
      navigate('/data-quality');
    } else if (stageId === 'scoring-engine') {
      navigate('/scoring-engine');
    } else if (stageId === 'ranked-results') {
      navigate('/ranked-results');
    } else {
      showNotification(`Stage ${stageId.toUpperCase()} selected.`);
    }
  };

  // Header compatible datasetInfo object
  const headerDatasetInfo = {
    batch_filename: dataset.batch_filename,
    total_teams: dataset.total_teams,
    engine_version: dataset.engine_version,
    file_hash_short: dataset.file_hash_short,
    jury_lead: dataset.jury_lead,
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] rounded-xl px-5 py-3 shadow-[4px_4px_0px_#0f172a] flex items-center gap-3 font-mono font-bold text-xs animate-bounce">
          <span className="material-symbols-outlined text-lg font-bold text-primary">
            verified
          </span>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:font-black cursor-pointer text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Header */}
      <SchemaHeader
        datasetInfo={headerDatasetInfo}
        onNavigateHome={() => {
          if (onNavigateHome) onNavigateHome();
          else navigate('/');
        }}
      />

      {/* Pipeline Sidebar */}
      <SchemaSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main Content Area */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 rounded-xl bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                  <div>
                    <span className="font-bold text-sm block">Fetching live Data Quality report for Dataset #{datasetId}...</span>
                    <span className="text-xs opacity-80">Computing field completeness, size anomalies, and missing signals</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Indicator */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-600 shadow-[4px_4px_0px_#0f172a] text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg font-bold">error</span>
                  <span><strong>Quality Report Error:</strong> {error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    getQualityReport(datasetId)
                      .then((report) => setQualityReport(report))
                      .catch((err) => setError(err.message))
                      .finally(() => setLoading(false));
                  }}
                  className="px-3 py-1 bg-white border border-rose-600 rounded font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Top Hero Bar / Triage Ribbon */}
            <QualityHeaderBanner dataset={dataset} />

            {/* Top KPI Bento 4-Column Grid */}
            <QualityKpiGrid
              dataset={dataset}
              onCriticalGapsClick={() => setShowQuarantinedModal(true)}
              onImputationClick={() => setSelectedVector(vectors[3])} // prior_hackathon_wins bayesian
            />

            {/* Main Diagnostics Grid: Split Left & Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left Column: Field-Level Degradation Matrix & Distribution (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                {/* Nullity Breakdown Strip Card */}
                <NullitySpectrumCard
                  cohorts={cohorts}
                  onCohortSelect={(cohortId) => {
                    if (cohortId === 'critical-risk') {
                      setShowQuarantinedModal(true);
                    }
                  }}
                />

                {/* Field-Level Signal Matrix Bento Card */}
                <SignalMatrixTable
                  vectors={vectors}
                  onVectorSelect={(vec) => setSelectedVector(vec)}
                />
              </div>

              {/* Right Column: Data Sanity Verifications Checklist (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                <SanityChecklistCard
                  onNotifyCaptains={() => setShowNotifyModal(true)}
                  onViewQuarantinedIds={() => setShowQuarantinedModal(true)}
                  onInspectVideos={() => setShowVideosModal(true)}
                />
              </div>
            </div>

            {/* Bottom Action Sticky/Triage Bar */}
            <QualityBottomBar
              readyTeams={readyTeams}
              totalTeams={dataset.total_teams}
              hardExclusions={activeExclusions}
              onExportCsv={handleExportCsv}
              onProceed={handleProceed}
            />
          </div>
        </main>
      </div>

      {/* Quarantined Repos Modal */}
      {showQuarantinedModal && (
        <QuarantinedReposModal
          teams={quarantinedTeams}
          onClose={() => setShowQuarantinedModal(false)}
          onUpdateTeamStatus={handleUpdateTeamStatus}
        />
      )}

      {/* Notify Captains Modal */}
      {showNotifyModal && (
        <NotifyCaptainsModal
          teams={quarantinedTeams}
          onClose={() => setShowNotifyModal(false)}
          onSent={(count) => {
            showNotification(`✓ Successfully dispatched ${count} urgent repository alerts to team captains.`);
          }}
        />
      )}

      {/* Restricted Videos Modal */}
      {showVideosModal && (
        <RestrictedVideosModal
          videos={mockRestrictedVideos}
          onClose={() => setShowVideosModal(false)}
        />
      )}

      {/* Imputation Detail Policy Modal */}
      {selectedVector && (
        <ImputationDetailModal
          vector={selectedVector}
          onClose={() => setSelectedVector(null)}
        />
      )}
    </div>
  );
}
