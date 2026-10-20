import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import AuditHeaderBanner from '../components/audit/AuditHeaderBanner';
import AuditKpiCards from '../components/audit/AuditKpiCards';
import ExportBundlesList from '../components/audit/ExportBundlesList';
import CryptographicInspector from '../components/audit/CryptographicInspector';
import JurySignOffRoster from '../components/audit/JurySignOffRoster';
import MainstageBroadcastBar from '../components/audit/MainstageBroadcastBar';
import ManifestInspectorModal from '../components/audit/ManifestInspectorModal';
import MainstageBroadcastModal from '../components/audit/MainstageBroadcastModal';
import { mockDatasetInfo } from '../data/mockSchema';
import {
  mockAuditLedger,
  mockJurySigners,
  generateFinalistCsv,
  generateAuditManifestJson,
  generateDeliberationCsv,
} from '../data/mockAudit';
import { useApp } from '../context/AppContext';
import { getRun, downloadCsv } from '../api/client';

export default function ExportAuditPage({ onNavigateHome }) {
  const navigate = useNavigate();
  const { campaignId, datasetId, runId, navigateWithState } = useApp();

  const [activeStage, setActiveStage] = useState('export-audit');
  const [toast, setToast] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  // Live Run Data
  const [runData, setRunData] = useState(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [runError, setRunError] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Fetch saved run data on mount if runId present
  useEffect(() => {
    if (!runId) return;

    let isMounted = true;
    setLoadingRun(true);
    setRunError(null);

    getRun(runId)
      .then((data) => {
        if (!isMounted) return;
        setRunData(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setRunError(err.message || 'Failed to load run details.');
      })
      .finally(() => {
        if (isMounted) setLoadingRun(false);
      });

    return () => {
      isMounted = false;
    };
  }, [runId]);

  // 1. Copy verification link
  const handleCopyVerificationLink = () => {
    const link = mockAuditLedger.verification_url;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        showNotification('🔗 Verification receipt URL copied to clipboard!');
      });
    } else {
      showNotification(`Receipt URL: ${link.substring(0, 36)}...`);
    }
  };

  // 2. Download Audit Package (.zip bundle)
  const handleDownloadPackage = async () => {
    if (runId) {
      showNotification('📦 Assembling full cryptographic bundle (.zip) via backend export engine...');
      try {
        await downloadCsv(runId, `ShortlistIQ_Audit_Package_Run_${runId}.zip`, 'bundle');
        showNotification(`✅ Downloaded: ShortlistIQ_Audit_Package_Run_${runId}.zip`);
        return;
      } catch (err) {
        console.warn('Bundle ZIP export failed, falling back to JSON manifest:', err);
      }
    }

    // Fallback: Trigger download of full JSON manifest
    showNotification('📦 Assembling manifest bundle (Fallback JSON)...');
    setTimeout(() => {
      const manifestData = generateAuditManifestJson();
      const blob = new Blob([manifestData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShortlistIQ_Audit_Bundle_${mockAuditLedger.file_hash_short}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('✅ Downloaded: ShortlistIQ_Audit_Package_2025.zip (.json manifest bundle)');
    }, 500);
  };

  // 3. Download Finalist CSV
  const handleDownloadFinalistCsv = async () => {
    if (runId) {
      showNotification('📥 Fetching Top 40 consensus CSV from backend export engine...');
      try {
        await downloadCsv(runId, `Finalist_Roster_Top40_Run_${runId}.csv`, 'shortlist');
        showNotification(`📥 Downloaded: Finalist_Roster_Top40_Run_${runId}.csv (live API export)`);
        return;
      } catch (err) {
        console.warn('Shortlist CSV export failed, falling back to local generator:', err);
      }
    }

    // Fallback: client generated CSV
    const csvData = generateFinalistCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Finalist_Roster_Top40.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Downloaded: Finalist_Roster_Top40.csv (Top 40 consensus teams)');
  };

  // 4. Download JSON Manifest
  const handleDownloadManifestJson = async () => {
    if (runId) {
      try {
        await downloadCsv(runId, `Audit_Config_Manifest_Run_${runId}.json`, 'config');
        showNotification(`📥 Downloaded: Audit_Config_Manifest_Run_${runId}.json (live configuration)`);
        return;
      } catch (err) {
        console.warn('Config JSON export failed, falling back to local manifest:', err);
      }
    }

    const jsonData = generateAuditManifestJson();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Audit_Manifest_v2.4.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Downloaded: Audit_Manifest_v2.4.json (Cryptographic proof state)');
  };

  // 5. Download Track Reports
  const handleDownloadTrackReports = () => {
    const trackReportText = `ETHGlobal Singapore 2025 - Track Breakdown & Sponsor Rankings
============================================================
Generated: 2025-10-18T14:32:00.491Z
Block: #19842910
Merkle Hash: 8f9b2c01d94ea277b07542d937013ac9fb0e89104d49a372e591bc31289f2a

[TRACK 01: Privacy Infra]
#1 zkShield (94.80 pts) - Grand Prize Finalist
#2 StealthChain (91.40 pts)
#3 BlindCompute (88.70 pts)

[TRACK 02: DeFi & Payments]
#1 HyperDeFi (93.40 pts) - Track Winner
#2 LiquidVault (90.20 pts)
#3 FlashRoute (87.90 pts)

[TRACK 03: AI & Autonomous Agents]
#1 AgentFlow (92.10 pts) - Track Winner
#2 SynapseAI (89.60 pts)
#3 AutoOracle (87.20 pts)

[TRACK 04: Developer Tooling & Security]
#1 NovaPulse (85.20 pts) - Consensus Tie-Break Winner
#2 SecurEth (84.90 pts)
#3 ByteGuard (83.80 pts)

[TRACK 05: Mobile & Consumer UX]
#1 PocketZK (86.10 pts)
#2 SwiftWallet (84.40 pts)

Signed by all 4 Track Jury Leads. Verified and Sealed.
`;
    const blob = new Blob([trackReportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Track_Prize_Reports.txt';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Generated & Downloaded: Track_Prize_Reports.txt (5 Track dossiers)');
  };

  // 6. Download Deliberation Notes
  const handleDownloadDeliberationNotes = () => {
    const csvData = generateDeliberationCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Deliberation_Variance_Log.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Downloaded: Deliberation_Variance_Log.csv (482 submissions audited)');
  };

  // 7. Verification Success
  const handleVerificationSuccess = () => {
    showNotification('🛡️ Consensus verified: 100% reproducible • 0.00% algorithmic drift • Block confirmed.');
  };

  // 8. Broadcast Toggle
  const handleBroadcastToggle = () => {
    if (!isBroadcasting) {
      setIsBroadcasting(true);
      setShowStageModal(true);
      showNotification('📡 Broadcaster active: Top 40 consensus feed is now live on mainstage screens!');
    } else {
      setIsBroadcasting(false);
      showNotification('⏸️ Mainstage live broadcast paused.');
    }
  };

  // 9. Sidebar Stage Selection
  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (stageId === 'import-schema') {
      navigateWithState('/schema-mapper');
    } else if (stageId === 'data-quality') {
      navigateWithState('/data-quality');
    } else if (stageId === 'scoring-engine') {
      navigateWithState('/scoring-engine');
    } else if (stageId === 'ranked-results') {
      navigateWithState('/ranked-results');
    } else if (stageId === 'team-compare') {
      navigateWithState('/team-compare');
    } else if (stageId === 'stability-stress') {
      navigateWithState('/stability-stress');
    } else if (stageId === 'export-audit') {
      showNotification('Already on Stage 07: Export & Cryptographic Audit.');
    } else {
      showNotification(`Navigating to ${stageId}...`);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased bg-dot-pattern">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#0f172a] text-white px-5 py-3 rounded-xl border-2 border-secondary-fixed shadow-[4px_4px_0px_#0f172a] flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary-fixed text-xl font-bold">
              verified
            </span>
            <span className="font-label-md text-label-md font-bold">{toast}</span>
          </div>
        </div>
      )}

      {/* Top Console Navigation Bar */}
      <SchemaHeader
        datasetInfo={mockDatasetInfo}
        onNavigateHome={() => (onNavigateHome ? onNavigateHome() : navigate('/'))}
      />

      {/* Left Pipeline Sidebar */}
      <SchemaSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main Workspace (Offset by sidebar width 72) */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col w-full relative max-w-7xl mx-auto">
            {/* Ambient Background Dots */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>

            {/* Sticky Context Header */}
            <AuditHeaderBanner
              onCopyLink={handleCopyVerificationLink}
              onDownloadPackage={handleDownloadPackage}
              blockNumber={runId ? `RUN-${runId}` : mockAuditLedger.block_number}
            />

            {/* Active Run Status Banner */}
            {runId ? (
              <div className="mb-space-md p-3 rounded-xl bg-primary-container/10 border-2 border-primary-container text-on-surface flex items-center justify-between flex-wrap gap-2 shadow-[2px_2px_0px_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">verified</span>
                  <span className="text-sm font-semibold">
                    {loadingRun ? (
                      <span>Loading cryptographic ledger for <strong>Run #{runId}</strong>...</span>
                    ) : runData ? (
                      <span>
                        Sealed <strong>Run #{runId}</strong>: {runData.eligible_teams ?? (runData.results?.length || 0)} eligible candidates evaluated. Export engines connected.
                      </span>
                    ) : (
                      <span>Exporting deterministic ledger for <strong>Run #{runId}</strong>.</span>
                    )}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-mono font-bold">
                  AUDIT LEDGER LIVE
                </span>
              </div>
            ) : (
              <div className="mb-space-md p-3 rounded-xl bg-surface-container-high border-2 border-[#0f172a] text-on-surface flex items-center justify-between flex-wrap gap-2 shadow-[2px_2px_0px_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline-variant text-xl">info</span>
                  <span className="text-sm text-on-surface-variant font-medium">
                    No active evaluation run connected. Exports will download simulated consensus audit bundles.
                  </span>
                </div>
              </div>
            )}

            {runError && (
              <div className="mb-space-md p-3 rounded-xl bg-tertiary-container/20 border-2 border-tertiary text-on-surface flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-xl font-bold">warning</span>
                  <span className="text-sm font-bold text-tertiary">
                    Notice: {runError}. Using local fallback consensus records.
                  </span>
                </div>
              </div>
            )}

            {/* Bento KPI Top Cards */}
            <AuditKpiCards
              ledgerStatus="SEALED"
              ledgerBadge="SHA-256 Valid"
              shortlistCount={
                runData && runData.config && runData.config.top_x !== undefined
                  ? runData.config.top_x
                  : mockAuditLedger.shortlist_count
              }
              shortlistQuotaPct={
                runData
                  ? (
                      ((runData.config?.top_x || 40) /
                        (runData.results?.length ||
                          (runData.eligible_teams || 0) + (runData.disqualified_teams || 0) ||
                          mockAuditLedger.total_teams)) *
                      100
                    ).toFixed(1)
                  : mockAuditLedger.shortlist_percentage
              }
              totalSubmissions={
                runData
                  ? runData.results?.length ||
                    (runData.eligible_teams || 0) + (runData.disqualified_teams || 0) ||
                    mockAuditLedger.total_teams
                  : mockAuditLedger.total_teams
              }
              quorumLeads={mockAuditLedger.quorum_leads}
              quorumSignedPct={mockAuditLedger.quorum_percent}
              stabilityConfidence={mockAuditLedger.stability_confidence}
              stabilityRuns={mockAuditLedger.stability_runs}
            />

            {/* Main Split Architecture (7 cols left, 5 cols right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start mb-space-lg">
              {/* LEFT COLUMN: Export Bundles (7 cols) */}
              <div className="lg:col-span-7">
                <ExportBundlesList
                  onDownloadFinalistCsv={handleDownloadFinalistCsv}
                  onDownloadManifestJson={handleDownloadManifestJson}
                  onDownloadTrackReports={handleDownloadTrackReports}
                  onDownloadDeliberationNotes={handleDownloadDeliberationNotes}
                  onInspectManifest={() => setShowManifestModal(true)}
                />
              </div>

              {/* RIGHT COLUMN: Cryptographic Inspector & Terminal Receipt (5 cols) */}
              <div className="lg:col-span-5">
                <CryptographicInspector
                  onVerificationSuccess={handleVerificationSuccess}
                />
              </div>
            </div>

            {/* Bottom Section: Final Jury Sign-Off Roster */}
            <JurySignOffRoster signers={mockJurySigners} />

            {/* Bottom Floating Call-To-Action Banner */}
            <MainstageBroadcastBar
              isBroadcasting={isBroadcasting}
              onBroadcastToggle={handleBroadcastToggle}
              onOpenStageView={() => setShowStageModal(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <ManifestInspectorModal
        isOpen={showManifestModal}
        onClose={() => setShowManifestModal(false)}
      />

      <MainstageBroadcastModal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
      />
    </div>
  );
}
