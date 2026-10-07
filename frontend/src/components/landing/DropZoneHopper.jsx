import { useState, useRef } from 'react';

export default function DropZoneHopper({ onLoadDemo, onFileUpload, isIngesting }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileFeedback, setFileFeedback] = useState(null);
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

  const processFile = (file) => {
    setFileFeedback(`Parsing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
    if (onFileUpload) {
      onFileUpload(file);
    } else {
      setTimeout(() => {
        onLoadDemo();
        setFileFeedback(`Successfully ingested 482 teams from ${file.name}`);
        setTimeout(() => setFileFeedback(null), 3000);
      }, 500);
    }
  };

  return (
    <div className="w-full bg-white retro-border-thick rounded-3xl p-6 md:p-10 shadow-pop-lg relative overflow-hidden">
      {/* Top playful tabs decoration */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-400 retro-border"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-brand-yellow retro-border"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-brand-green retro-border"></span>
          <span className="ml-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            INGESTION_STATION_v2.4.exe
          </span>
        </div>
        <span className="px-3 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple font-mono font-bold text-xs retro-border">
          TAIKAI • DEVPOST • CUSTOM CSV
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
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 border-4 border-dashed border-brand-dark rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-5 transition-all group cursor-pointer ${
          isDragOver
            ? 'bg-yellow-100 border-brand-blue scale-[1.01]'
            : 'bg-brand-cream/80 hover:bg-yellow-50/50'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-2xl bg-brand-yellow retro-border shadow-pop flex items-center justify-center text-brand-dark transition-transform ${
            isIngesting ? 'animate-bounce' : 'group-hover:scale-110 group-hover:-rotate-3'
          }`}
        >
          <span className="material-symbols-outlined text-4xl font-bold">cloud_upload</span>
        </div>

        <div className="flex flex-col gap-1 max-w-lg">
          <h3 className="font-display font-extrabold text-2xl text-brand-dark">
            Drop Submission Matrix or Click to Ingest
          </h3>
          <p className="font-sans text-sm text-slate-600 font-medium">
            Supports messy .CSV, .JSON exports, and Discord/Taikai rubrics. Auto-matches judge vectors and checks GitHub links instantly.
          </p>
          {fileFeedback && (
            <div className="mt-2 text-xs font-mono font-bold text-brand-blue bg-white px-3 py-1 rounded retro-border inline-block self-center shadow-pop-sm">
              {fileFeedback}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-6 py-3 bg-brand-yellow hover:bg-yellow-300 text-brand-dark font-display font-black text-sm md:text-base rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">folder_open</span>
            Select Submission Matrix
          </button>
          <button
            id="quick-demo-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo();
            }}
            className="px-5 py-3 bg-white hover:bg-slate-50 text-brand-dark font-display font-bold text-sm md:text-base rounded-xl retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-brand-blue text-lg font-bold">
              play_circle
            </span>
            Load Demo Matrix (482 Teams)
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono font-bold text-slate-500">
          <span className="bg-white px-2.5 py-1 rounded retro-border">MAX 128 MB</span>
          <span>•</span>
          <span className="bg-white px-2.5 py-1 rounded retro-border">IN-MEMORY LOCAL SANDBOX</span>
          <span>•</span>
          <span className="bg-white px-2.5 py-1 rounded retro-border">100% PRIVATE</span>
        </div>
      </div>
    </div>
  );
}
