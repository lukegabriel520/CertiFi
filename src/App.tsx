import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import EnvTest from './components/EnvTest';
import ContractTest from './components/ContractTest';

const IssueCertificate = React.lazy(() => import('./pages/IssueCertificate'));
const VerifyDocument = React.lazy(() => import('./pages/VerifyDocument'));
const DemoVerify = React.lazy(() => import('./pages/DemoVerify'));

function envFlagTruthy(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  const s = value.trim().toLowerCase();
  return s === '1' || s === 'true';
}

const SHOW_DEBUG =
  import.meta.env.DEV || envFlagTruthy(import.meta.env.VITE_SHOW_DEBUG);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
  </div>
);

function App() {
  const location = useLocation();
  const isDemoRoute = location.pathname === '/demo';

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-[#f9fafb]">
      {SHOW_DEBUG && <EnvTest />}
      <Header />
      {SHOW_DEBUG && !isDemoRoute && (
        <div className="container mx-auto px-4 mb-8">
          <ContractTest />
        </div>
      )}
      <div className={isDemoRoute ? '' : 'container mx-auto px-4 py-6'}>
        <main>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<DemoVerify />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route element={<ProtectedRoute requiredRole="Institution" />}>
                <Route path="/issue-certificate" element={<IssueCertificate />} />
              </Route>
              <Route element={<ProtectedRoute requiredRole="Verifier" />}>
                <Route path="/verify-document" element={<VerifyDocument />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
