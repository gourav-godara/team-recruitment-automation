import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SchemaMapperPage from './pages/SchemaMapperPage';
import DataQualityPage from './pages/DataQualityPage';

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
