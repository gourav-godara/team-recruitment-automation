import { useState, useRef } from 'react';

export default function ReuploadModal({ onClose, onFileSelect, isUploading = false, uploadError = null, campaignId = null }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    if (!isUploading) setIsDragOver(true);
  };

  const handleLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (!isUploading && e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest retro-border-thick rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_#0f172a] overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 bg-primary-fixed border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold text-primary">
              upload_file
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Re-upload File Specimen
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] flex items-center justify-center font-bold hover:bg-rose-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Drop Area */}
        <div className="p-6 flex flex-col gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".csv,.json"
            className="hidden"
          />

          <div
            onDragOver={handleDrag}
            onDragLeave={handleLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`p-8 rounded-xl border-3 border-dashed border-[#0f172a] flex flex-col items-center justify-center gap-3 text-center transition-all ${
              isUploading
                ? 'bg-surface-container-high opacity-80 cursor-wait'
                : isDragOver
                ? 'bg-secondary-fixed/50 scale-[1.02] cursor-pointer'
                : 'bg-surface-container-low hover:bg-surface-container cursor-pointer'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <span className="material-symbols-outlined text-4xl animate-spin text-primary">
                  progress_activity
                </span>
                <span className="font-headline-sm text-base font-bold text-on-surface">
                  Ingesting &amp; Parsing Dataset into Backend...
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  Sending file with campaign_id: {campaignId || 'None (Default)'}
                </span>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-on-surface font-bold">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <div>
                  <div className="font-headline-sm text-lg font-bold text-on-surface">
                    Drop new CSV / JSON batch here
                  </div>
                  <div className="font-body-sm text-xs text-on-surface-variant mt-1">
                    Supports registrations CSV with headers (team_id, team_name, name, email, etc.)
                  </div>
                  {campaignId && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold border border-[#0f172a]">
                      <span className="material-symbols-outlined text-xs">folder</span>
                      <span>Target Campaign #{campaignId}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm font-bold">error</span>
              <span className="font-medium">Upload failed: {uploadError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-1.5 rounded bg-surface-container text-on-surface font-bold border-2 border-[#0f172a] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 rounded bg-primary-container text-on-primary-container font-bold border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] cursor-pointer disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Browse Local File'}
          </button>
        </div>
      </div>
    </div>
  );
}
