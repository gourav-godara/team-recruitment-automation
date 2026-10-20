import { useState } from 'react';
import { generateAuditManifestJson } from '../../data/mockAudit';

export default function ManifestInspectorModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const manifestJson = generateAuditManifestJson();

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(manifestJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([manifestJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Manifest_v2.4_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[85vh] rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-secondary-fixed px-space-lg py-3 border-b-2 border-[#0f172a] flex items-center justify-between text-on-secondary-fixed">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">code_blocks</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Audit Manifest Inspector (JSON Schema v2.4)
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-secondary-fixed-variant">
                Full deterministic state dump with signatures, Merkle root, and evaluation parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-space-md flex-1 overflow-y-auto bg-[#0f172a]">
          <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap select-all leading-relaxed p-2">
            {manifestJson}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="bg-surface-container-low px-space-lg py-3 border-t-2 border-[#0f172a] flex items-center justify-between">
          <span className="font-mono text-xs text-on-surface-variant font-medium">
            SHA-256 Verified • Strict Determinism
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-white text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-md text-label-md font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied JSON!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-md text-label-md font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base font-bold">download</span>
              <span>Download .json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
