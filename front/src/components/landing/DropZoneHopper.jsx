import { useState, useRef } from 'react';
import { uploadImport } from '../../api/client';
import { useApp } from '../../context/AppContext';

export default function DropZoneHopper({ onUploadSuccess, onError, isIngesting }) {
  const { campaignId, setDatasetId, setUploadedDataset, navigateWithState } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileFeedback, setFileFeedback] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file) => {
    // 1. Extension validation (CSV preferred, JSON also accepted)
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.json')) {
      const err = 'Unsupported file format. Please upload a .CSV candidate registration spreadsheet.';
      setFileFeedback(err);
      if (onError) onError(err);
      return;
    }

    // 2. Size validation (10 MB cap)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const err = `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB limit.`;
      setFileFeedback(err);
      if (onError) onError(err);
      return;
    }

    setUploading(true);
    setFileFeedback(`Uploading and parsing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);

    try {
      const result = await uploadImport(file, file.name, campaignId);
      const datasetId = result.dataset_id;
      setDatasetId(datasetId);
      setUploadedDataset(result);
      setFileFeedback(`✓ Successfully imported ${result.total_teams} teams (${result.total_records || 'all'} candidates)!`);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      } else {
        setTimeout(() => {
          navigateWithState('/schema-mapper', { datasetId });
        }, 500);
      }
    } catch (err) {
      const msg = err.message || 'File upload failed. Please verify CSV formatting.';
      setFileFeedback(`Error: ${msg}`);
      if (onError) onError(msg);
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || isIngesting;

  return (
    <div className="w-full bg-white retro-border-thick rounded-3xl p-6 md:p-10 shadow-pop-lg relative overflow-hidden">
      {/* Top clean header */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-400 retro-border"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-brand-yellow retro-border"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-brand-green retro-border"></span>
          <span className="ml-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            CANDIDATE REGISTRATION UPLOAD
          </span>
        </div>
        <span className="px-3 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple font-mono font-bold text-xs retro-border">
          PUBLIC • NO LOGIN REQUIRED • CSV SPREADSHEETS
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Interactive Card Surface */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !busy && fileInputRef.current?.click()}
        className={`mt-6 border-4 border-dashed border-brand-dark rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-5 transition-all group ${
          busy ? 'opacity-80 cursor-wait' : 'cursor-pointer'
        } ${
          isDragOver
            ? 'bg-yellow-100 border-brand-blue scale-[1.01]'
            : 'bg-brand-cream/80 hover:bg-yellow-50/50'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-2xl bg-brand-yellow retro-border shadow-pop flex items-center justify-center text-brand-dark transition-transform ${
            busy ? 'animate-bounce' : 'group-hover:scale-110 group-hover:-rotate-3'
          }`}
        >
          <span className="material-symbols-outlined text-4xl font-bold">
            {busy ? 'hourglass_top' : 'upload_file'}
          </span>
        </div>

        <div className="flex flex-col gap-1 max-w-lg">
          <h3 className="font-display font-extrabold text-2xl text-brand-dark">
            {busy ? 'Ingesting Candidate Registrations...' : 'Drop Candidate Registrations CSV or Click to Browse'}
          </h3>
          <p className="font-sans text-sm text-slate-600 font-medium">
            Upload your candidate registrations CSV spreadsheet. The system automatically groups team members, checks for missing data, and prepares teams for scoring.
          </p>
          {fileFeedback && (
            <div
              className={`mt-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg retro-border inline-block self-center shadow-pop-sm ${
                fileFeedback.startsWith('Error')
                  ? 'bg-rose-100 text-rose-800'
                  : fileFeedback.startsWith('✓')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-brand-yellow text-brand-dark'
              }`}
            >
              {fileFeedback}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-8 py-3.5 bg-brand-yellow hover:bg-yellow-300 text-brand-dark font-display font-black text-sm md:text-base rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl font-bold">folder_open</span>
            Select CSV File
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono font-bold text-slate-500">
          <span className="bg-white px-2.5 py-1 rounded retro-border">CSV SPREADSHEETS</span>
          <span>•</span>
          <span className="bg-white px-2.5 py-1 rounded retro-border">MAX 10 MB</span>
          <span>•</span>
          <span className="bg-white px-2.5 py-1 rounded retro-border">EXPLAINABLE FASTAPI ENGINE</span>
          <span>•</span>
          <span className="bg-white px-2.5 py-1 rounded retro-border">ANONYMOUS & PRIVATE</span>
        </div>
      </div>
    </div>
  );
}
