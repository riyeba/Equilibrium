import React, { createContext, useContext, useState, useEffect } from 'react';
import { pwaApi, initDatabase } from './services/pwaApi';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/shared/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Payments from './pages/Payments';
import Sales from './pages/Sales';
import ReportCards from './pages/ReportCards';
import Payroll from './pages/Payroll';
import Attendance from './pages/Attendance';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import AdmissionLetter from './pages/AdmissionLetter';

export const AuthContext = createContext(null);
export const SettingsContext = createContext({});
export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);

// On Electron: window.api is injected by preload.js
// On PWA/browser: use pwaApi (sql.js + localStorage)
export const api = (typeof window !== 'undefined' && window.api) ? window.api : pwaApi;

const PAGES = {
  dashboard:     { component: Dashboard,       title: 'Dashboard' },
  students:      { component: Students,        title: 'Students' },
  staff:         { component: Staff,           title: 'Staff' },
  payments:      { component: Payments,        title: 'Student Payments' },
  sales:         { component: Sales,           title: 'Sales Records' },
  reportcards:   { component: ReportCards,     title: 'Report Cards' },
  payroll:       { component: Payroll,         title: 'Staff Payroll' },
  attendance:    { component: Attendance,      title: 'Attendance' },
  inventory:     { component: Inventory,       title: 'Inventory' },
  admissionletter: { component: AdmissionLetter, title: 'Admission Letter' },
  settings:      { component: Settings,        title: 'Settings' },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [settings, setSettings] = useState({});
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Only init pwaApi DB — Electron's DB is already handled by main.js
    if (!window.api) {
      initDatabase()
        .then(() => setDbReady(true))
        .catch(err => {
          console.error('[TEA] DB init failed:', err);
          setDbReady(true); // still proceed so user sees an error rather than blank screen
        });
    } else {
      setDbReady(true);
    }

    const saved = localStorage.getItem('tea_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (e) { localStorage.removeItem('tea_user'); }
    }
  }, []);

  useEffect(() => {
    if (user && dbReady) {
      api.getSettings().then(s => setSettings(s || {})).catch(() => {});
    }
  }, [user, dbReady]);

  const login = (u) => {
    setUser(u);
    localStorage.setItem('tea_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tea_user');
    setPage('dashboard');
  };

  const refreshSettings = () =>
    api.getSettings().then(s => setSettings(s || {})).catch(() => {});

  // Show loading while DB initialises on PWA
  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏫</div>
          <div className="font-bold text-lg mb-2">The Equilibrium Academy</div>
          <div className="text-blue-200 text-sm">Initialising database...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <ErrorBoundary><Login /></ErrorBoundary>
      </AuthContext.Provider>
    );
  }

  const Page = PAGES[page]?.component || Dashboard;
  const title = PAGES[page]?.title || 'Dashboard';

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <SettingsContext.Provider value={{ settings, refreshSettings }}>
        <ErrorBoundary>
          <Layout currentPage={page} setCurrentPage={setPage} pageTitle={title}>
            <ErrorBoundary><Page /></ErrorBoundary>
          </Layout>
        </ErrorBoundary>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}
