import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SchemaMapperPage from './pages/SchemaMapperPage';

function RouteSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSchema = location.pathname.startsWith('/schema') || location.pathname.startsWith('/import');

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center bg-[#0f172a] text-white p-1 rounded-full border-2 border-[#0f172a] shadow-[3px_3px_0px_#ffe24c] text-xs font-mono font-bold">
      <button
        type="button"
        onClick={() => navigate('/schema-mapper')}
        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
          isSchema
            ? 'bg-[#ffe24c] text-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Stage 01: Schema Mapper
      </button>
      <button
        type="button"
        onClick={() => navigate('/')}
        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
          !isSchema
            ? 'bg-[#ffe24c] text-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Landing Deck
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative">
        <RouteSwitcher />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/schema-mapper" element={<SchemaMapperPage />} />
          <Route path="/import-schema" element={<SchemaMapperPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
