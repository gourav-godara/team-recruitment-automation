import { useState } from 'react';
import { mockAuditLedger } from '../../data/mockAudit';

export default function CryptographicInspector({ onVerificationSuccess }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedIpfs, setCopiedIpfs] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setHasVerified(true);
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    }, 650);
  };

  const handleCopyMerkle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mockAuditLedger.root_merkle_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleCopyIpfs = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mockAuditLedger.ipfs_cid);
      setCopiedIpfs(true);
      setTimeout(() => setCopiedIpfs(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#10b981] border border-[#0f172a] rounded-sm"></span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight font-extrabold">
            Cryptographic Inspector
          </h2>
        </div>
        <span className="font-label-sm text-label-sm px-2 py-0.5 bg-[#10b981] text-on-primary border border-[#0f172a] rounded-full font-bold">
          ECDSA-SECP256K1
        </span>
      </div>

      {/* Terminal Receipt Box */}
      <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
        {/* Terminal Retro Top Header */}
        <div className="bg-secondary-fixed px-space-md py-2 border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f43f5e] border border-[#0f172a]"></div>
            <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim border border-[#0f172a]"></div>
            <div className="w-3 h-3 rounded-full bg-[#10b981] border border-[#0f172a]"></div>
            <span className="font-label-sm text-label-sm uppercase font-mono font-bold text-on-secondary-fixed ml-2 tracking-wider">
              ledger_receipt.proof
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-lowest text-on-surface rounded border border-[#0f172a] font-mono font-bold">
            v2.4-STABLE
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-space-md bg-[#0f172a] text-surface-container-lowest font-mono text-xs flex flex-col gap-3 select-all">
          <div className="flex items-center justify-between text-secondary-fixed pb-2 border-b border-surface-variant/20">
            <span className="font-bold">// DETERMINISTIC RECEIPT MATRIX</span>
            <span className="text-[#10b981] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              STATE SEALED
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
                Root State Merkle Hash:
              </span>
              <button
                type="button"
                onClick={handleCopyMerkle}
                className="text-[10px] text-slate-300 hover:text-secondary-fixed font-sans underline cursor-pointer"
                title="Copy Full Hash"
              >
                {copiedHash ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-secondary-fixed break-all font-bold tracking-tight">
              {mockAuditLedger.root_merkle_hash}
            </p>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
              Ingestion Data Fingerprint:
            </span>
            <p className="text-slate-100 break-all font-semibold">
              {mockAuditLedger.ingestion_fingerprint}
            </p>
            <p className="text-slate-400 text-[11px]">
              ({mockAuditLedger.ingestion_meta})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
                Weight Matrix Hash:
              </span>
              <p className="text-slate-100">{mockAuditLedger.weight_matrix_name}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
                Monte Carlo Seed:
              </span>
              <p className="text-secondary-fixed font-bold">{mockAuditLedger.monte_carlo_seed}</p>
            </div>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
              Timestamp (UTC):
            </span>
            <p className="text-slate-100">
              {mockAuditLedger.timestamp_utc} (UNIX: {mockAuditLedger.unix_timestamp})
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/60">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider block">
              Digital Signature (ECDSA):
            </span>
            <p className="text-[#10b981] break-all leading-tight font-semibold">
              {mockAuditLedger.digital_signature_ecdsa}
            </p>
          </div>
        </div>

        {/* Interactive Proof Validator */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-label-lg text-label-lg text-on-surface font-extrabold">
                One-Click Proof Verification
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Verify math integrity against public block explorer
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className={`px-3.5 py-1.5 rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_#0f172a] font-label-md text-label-md uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                isVerifying
                  ? 'bg-primary-fixed text-primary opacity-80 cursor-wait'
                  : 'bg-[#2563eb] text-on-primary hover:bg-[#1d4ed8]'
              }`}
            >
              {isVerifying ? 'Verifying...' : hasVerified ? 'Re-verify' : 'Verify Online'}
            </button>
          </div>

          {/* Dynamic Verification Result */}
          <div className="p-3 bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#10b981] text-2xl shrink-0 font-bold">
              {hasVerified ? 'task_alt' : 'check_circle'}
            </span>
            <div className="flex-1">
              <div className="font-label-md text-label-md text-on-surface font-black">
                {hasVerified
                  ? '100% Cryptographically Intact'
                  : 'Integrity Verified (Consensus OK)'}
              </div>
              <div className="text-xs text-on-surface-variant font-mono">
                {hasVerified
                  ? 'SHA-256 + ECDSA Signatures Verified • Block #19842910 Confirmed'
                  : '0.00% Algorithmic Drift • 100% Reproducible'}
              </div>
            </div>
            <span className="font-label-sm text-label-sm font-mono px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded border border-[#0f172a] font-bold">
              {mockAuditLedger.verification_latency}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Hash Comparison Pill Box */}
      <div className="bg-surface-container p-space-sm rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl font-bold">
            fingerprint
          </span>
          <span className="font-label-md text-label-md text-on-surface font-extrabold">
            IPFS CID Snapshot
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyIpfs}
          className="font-mono text-xs text-on-surface-variant hover:text-on-surface bg-surface-container-lowest px-2 py-1 rounded border border-[#0f172a] cursor-pointer font-bold flex items-center gap-1"
          title="Click to copy full IPFS CID"
        >
          <span>{mockAuditLedger.short_ipfs}</span>
          <span className="material-symbols-outlined text-xs">
            {copiedIpfs ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>
    </div>
  );
}
