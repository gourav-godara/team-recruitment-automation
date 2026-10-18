import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SchemaMapperPage from './pages/SchemaMapperPage';
import DataQualityPage from './pages/DataQualityPage';
import ScoringEnginePage from './pages/ScoringEnginePage';
import RankedResultsPage from './pages/RankedResultsPage';
import StabilityStressPage from './pages/StabilityStressPage';

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
          <Route path="/stability-stress" element={<StabilityStressPage />} />
          <Route path="/stress-test" element={<StabilityStressPage />} />
          <Route path="/stability" element={<StabilityStressPage />} />
          <Route path="/stress" element={<StabilityStressPage />} />
          <Route path="/page-5" element={<StabilityStressPage />} />
          <Route path="/page-6" element={<StabilityStressPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
