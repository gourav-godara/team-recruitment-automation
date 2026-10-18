import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SchemaMapperPage from './pages/SchemaMapperPage';
import DataQualityPage from './pages/DataQualityPage';
import ScoringEnginePage from './pages/ScoringEnginePage';
import RankedResultsPage from './pages/RankedResultsPage';
import TeamComparePage from './pages/TeamComparePage';
import StabilityStressPage from './pages/StabilityStressPage';
import ExportAuditPage from './pages/ExportAuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/schema-mapper" element={<SchemaMapperPage />} />
          <Route path="/import-schema" element={<SchemaMapperPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/quality" element={<DataQualityPage />} />
          <Route path="/scoring-engine" element={<ScoringEnginePage />} />
          <Route path="/scoring" element={<ScoringEnginePage />} />
          <Route path="/weights" element={<ScoringEnginePage />} />
          <Route path="/ranked-results" element={<RankedResultsPage />} />
          <Route path="/ranked" element={<RankedResultsPage />} />
          <Route path="/results" element={<RankedResultsPage />} />
          <Route path="/team-compare" element={<TeamComparePage />} />
          <Route path="/compare" element={<TeamComparePage />} />
          <Route path="/deliberation" element={<TeamComparePage />} />
          <Route path="/arbitration" element={<TeamComparePage />} />
          <Route path="/stability-stress" element={<StabilityStressPage />} />
          <Route path="/stress-test" element={<StabilityStressPage />} />
          <Route path="/stability" element={<StabilityStressPage />} />
          <Route path="/stress" element={<StabilityStressPage />} />
          <Route path="/export-audit" element={<ExportAuditPage />} />
          <Route path="/audit" element={<ExportAuditPage />} />
          <Route path="/export" element={<ExportAuditPage />} />
          <Route path="/page-5" element={<TeamComparePage />} />
          <Route path="/page-6" element={<StabilityStressPage />} />
          <Route path="/page-7" element={<ExportAuditPage />} />
          <Route path="/stage-7" element={<ExportAuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
