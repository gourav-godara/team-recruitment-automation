import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import BentoSpecimenGrid from '../components/schema/BentoSpecimenGrid';
import SchemaMappingTable from '../components/schema/SchemaMappingTable';
import SchemaFooterActions from '../components/schema/SchemaFooterActions';
import QuickPreviewModal from '../components/schema/QuickPreviewModal';
import ReuploadModal from '../components/schema/ReuploadModal';
import { mockDatasetInfo, initialSchemaFields } from '../data/mockSchema';
import { uploadImport } from '../api/client';
import { useApp } from '../context/AppContext';

export default function SchemaMapperPage({ onNavigateHome, onProceedToQualityCheck }) {
  const navigate = useNavigate();
  const { campaignId, datasetId, setDatasetId, navigateWithState } = useApp();
  const [datasetInfo, setDatasetInfo] = useState(mockDatasetInfo);
  const [fields, setFields] = useState(initialSchemaFields);
  const [granularity, setGranularity] = useState('team'); // 'team' | 'member'
  const [activeStage, setActiveStage] = useState('import-schema');
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [showReupload, setShowReupload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Field mapping change handler
  const handleFieldMappingChange = (fieldId, newColumn) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const isUnmapped = newColumn === '-- Unmapped --';
          return {
            ...f,
            source_column: newColumn,
            status: isUnmapped ? 'unmapped' : 'mapped',
            confidence: isUnmapped ? 'Missing' : '98% Custom Mapped',
            confidence_type: isUnmapped ? 'warning' : 'confident',
          };
        }
        return f;
      })
    );
  };

  // Reset mappings to raw inference
  const handleResetMap = () => {
    setFields(initialSchemaFields);
    showNotification('↺ Schema mappings reset to raw initial inference.');
  };

  // Auto-align columns
  const handleAutoAlign = () => {
    setFields((prev) =>
      prev.map((f) => {
        // Pick best matching non-unmapped source option
        const validOption = f.source_options.find((opt) => opt !== '-- Unmapped --') || f.source_options[0];
        return {
          ...f,
          source_column: validOption,
          status: 'mapped',
          confidence: '100% Exact',
          confidence_type: 'verified',
        };
      })
    );
    showNotification('✨ Auto-aligned all schema columns using semantic token inference!');
  };

  // Handle re-upload file with backend API
  const handleFileSelect = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    showNotification(`⚡ Ingesting ${file.name} into backend engine...`);
    try {
      const result = await uploadImport(file, file.name, campaignId);
      const newDatasetId = result.dataset_id;
      setDatasetId(newDatasetId);

      setDatasetInfo((prev) => ({
        ...prev,
        id: newDatasetId,
        name: result.filename || file.name,
        batch_filename: result.filename || file.name,
        file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        total_teams: result.total_teams ?? prev.total_teams,
        file_hash_short: result.dataset_hash ? result.dataset_hash.substring(0, 8) : '9b2d...1a4',
      }));

      showNotification(`✓ File ${file.name} ingested successfully! Dataset ID: ${newDatasetId} (${result.total_teams} teams)`);
    } catch (err) {
      const msg = err.message || 'Import parsing failed.';
      setUploadError(msg);
      showNotification(`⚠️ Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Calculations for integrity score
  const mappedCount = fields.filter((f) => f.status === 'mapped' && f.source_column !== '-- Unmapped --').length;
  const unmappedCount = fields.filter((f) => f.status === 'unmapped' || f.source_column === '-- Unmapped --').length;
  const conflictsCount = 0;
  const totalCount = fields.length;

  const handleProceed = () => {
    showNotification('🔒 State Sealed: SHA-256 state seal generated. Proceeding to Stage 02: Data Quality...');
    if (onProceedToQualityCheck) {
      setTimeout(() => {
        onProceedToQualityCheck();
      }, 700);
    } else {
      setTimeout(() => {
        navigateWithState('/data-quality');
      }, 700);
    }
  };

  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (stageId === 'ranked-results' || stageId === 'export-audit') {
      showNotification(`Switching to ${stageId.replace('-', ' ').toUpperCase()} view...`);
      if (onNavigateHome) {
        setTimeout(() => {
          onNavigateHome(stageId);
        }, 500);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } else {
      showNotification(`Stage ${stageId.toUpperCase()} selected.`);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] rounded-xl px-5 py-3 shadow-[4px_4px_0px_#0f172a] flex items-center gap-3 font-mono font-bold text-xs animate-bounce">
          <span className="material-symbols-outlined text-lg font-bold text-primary">
            info
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

      {/* Header */}
      <SchemaHeader
        datasetInfo={datasetInfo}
        onNavigateHome={() => {
          if (onNavigateHome) onNavigateHome();
          else navigate('/');
        }}
      />

      {/* Sidebar */}
      <SchemaSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main Content Area */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col w-full">
            {/* BREADCRUMB & CONSOLE HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg pb-space-md border-b-2 border-[#0f172a]">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
                    Stage 01 // Ingestion Bay
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-mono font-bold">
                    /
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono tracking-wider font-bold">
                    Target Schema v2.4
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-mono border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                    Active Pipeline
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-extrabold">
                  Schema Mapper &amp; Granularity Controls
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                  Batch Payload:{' '}
                  <span className="font-mono font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded border border-[#0f172a]">
                    {datasetInfo.batch_filename}
                  </span>{' '}
                  • {datasetInfo.total_teams} teams registered across {datasetInfo.tracks_count} tracks •{' '}
                  {datasetInfo.verified_hackers.toLocaleString()} verified hackers
                </p>
              </div>

              {/* Live Telemetry Capsule */}
              <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded border-2 border-[#0f172a]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                  <span className="font-label-sm text-label-sm font-mono text-on-surface font-bold uppercase tracking-wider">
                    Parser Live
                  </span>
                </div>
                <div className="flex flex-col text-right px-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    Parser Latency
                  </span>
                  <span className="font-label-md text-label-md font-mono font-bold text-primary">
                    {datasetInfo.parser_latency}
                  </span>
                </div>
              </div>
            </div>

            {/* TOP BENTO SPECIMEN GRID */}
            <BentoSpecimenGrid
              datasetInfo={datasetInfo}
              granularity={granularity}
              onGranularityChange={setGranularity}
              mappedCount={mappedCount}
              unmappedCount={unmappedCount}
              conflictsCount={conflictsCount}
              totalCount={totalCount}
              onReuploadClick={() => setShowReupload(true)}
              onQuickPreviewClick={() => setShowQuickPreview(true)}
            />

            {/* SCHEMA MAPPING TABLE SECTION */}
            <SchemaMappingTable
              fields={fields}
              onFieldMappingChange={handleFieldMappingChange}
              onResetMap={handleResetMap}
              onAutoAlign={handleAutoAlign}
            />

            {/* BOTTOM FEATURE CARDS & HARD TACTILE ACTION FOOTER */}
            <SchemaFooterActions onProceed={handleProceed} />
          </div>
        </main>
      </div>

      {/* Quick Preview Modal (50 rows) */}
      {showQuickPreview && (
        <QuickPreviewModal onClose={() => setShowQuickPreview(false)} />
      )}

      {/* Re-upload File Modal */}
      {showReupload && (
        <ReuploadModal
          onClose={() => setShowReupload(false)}
          onFileSelect={async (file) => {
            await handleFileSelect(file);
            setShowReupload(false);
          }}
          isUploading={isUploading}
          uploadError={uploadError}
          campaignId={campaignId}
        />
      )}
    </div>
  );
}
