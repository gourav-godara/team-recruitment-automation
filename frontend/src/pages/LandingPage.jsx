import { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import StatusTicker from '../components/landing/StatusTicker';
import HeroSection from '../components/landing/HeroSection';
import PipelineStages from '../components/landing/PipelineStages';
import LiveConsole from '../components/landing/LiveConsole';
import ComparisonSection from '../components/landing/ComparisonSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';
import AuditModal from '../components/landing/AuditModal';
import { mockTeams } from '../data/mockTeams';

export default function LandingPage() {
  const [teams, setTeams] = useState(mockTeams);
  const [selectedAuditTeam, setSelectedAuditTeam] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLoadDemo = () => {
    setIsSimulating(true);
    showToast('⚡ Ingesting 482 teams into in-memory SIMD evaluation sandbox...');
    setTimeout(() => {
      setTeams([...mockTeams]);
      setIsSimulating(false);
      showToast('✓ 482 submissions parsed and normalized with zero schema errors!');
      const consoleEl = document.getElementById('live-console');
      if (consoleEl) {
        consoleEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  };

  const handleDropCsvClick = () => {
    const dropzone = document.getElementById('dropzone-area');
    if (dropzone) {
      dropzone.scrollIntoView({ behavior: 'smooth' });
      dropzone.click();
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      showToast('🎲 10,000 Monte Carlo runs completed! Rank #10 cutoff tension verified.');
    }, 1200);
  };

  return (
    <div className="bg-brand-cream font-sans antialiased min-h-screen text-brand-dark selection:bg-brand-yellow selection:text-brand-dark">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-yellow text-brand-dark retro-border-thick rounded-2xl px-5 py-3 shadow-pop-lg flex items-center gap-3 font-mono font-bold text-xs animate-bounce">
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

      {/* Floating Sticky Top Navigation */}
      <Navbar onLoadDemo={handleLoadDemo} onDropCsvClick={handleDropCsvClick} />

      {/* Main Content */}
      <main className="w-full pt-24 bg-dot-pattern">
        {/* Status Marquee Ribbon */}
        <StatusTicker />

        {/* Hero Section */}
        <HeroSection
          onLoadDemo={handleLoadDemo}
          isIngesting={isSimulating}
        />

        {/* 7-Stage Pipeline Bento Grid */}
        <PipelineStages />

        {/* Interactive Evaluation Console */}
        <LiveConsole
          teams={teams}
          onInspectAudit={(team) => setSelectedAuditTeam(team)}
          isSimulating={isSimulating}
          onRunSimulation={handleRunSimulation}
        />

        {/* Head-to-Head Comparison */}
        <ComparisonSection />

        {/* Call to Action Banner */}
        <CtaBanner
          onLaunchSandbox={handleLoadDemo}
          onUploadCsv={handleDropCsvClick}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Audit Certificate Inspection Modal */}
      {selectedAuditTeam && (
        <AuditModal
          team={selectedAuditTeam}
          onClose={() => setSelectedAuditTeam(null)}
        />
      )}
    </div>
  );
}
