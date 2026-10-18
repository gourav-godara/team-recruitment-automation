import { useState } from 'react';
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

export default function DataQualityPage({ onNavigateHome, onProceedToScoring }) {
  const navigate = useNavigate();
  const [dataset] = useState(mockQualityDataset);
  const [cohorts] = useState(mockNullityCohorts);
  const [vectors] = useState(mockSignalVectors);
  const [quarantinedTeams, setQuarantinedTeams] = useState(mockQuarantinedTeams);
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
      }, 900);
    } else {
      setTimeout(() => {
        navigate('/scoring-engine');
      }, 900);
    }
  };

  // Sidebar navigation
  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (stageId === 'import-schema') {
      navigate('/schema-mapper');
    } else if (stageId === 'data-quality') {
      navigate('/data-quality');
    } else if (stageId === 'ranked-results' || stageId === 'export-audit') {
      showNotification(`Navigating to ${stageId.replace('-', ' ').toUpperCase()} view...`);
      if (onNavigateHome) {
        setTimeout(() => onNavigateHome(stageId), 400);
      } else {
        setTimeout(() => navigate('/'), 400);
      }
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
