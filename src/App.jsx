import React, { createContext, useContext, useState, useEffect } from 'react';
import { pwaApi } from './services/pwaApi';
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
import { initDatabase } from './services/pwaApi';


export const AuthContext = createContext(null);
export const SettingsContext = createContext({});
export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);

// Mock API for browser dev (Electron provides window.api in production)


export const api = (typeof window !== 'undefined' && window.api) ? window.api : pwaApi;

const PAGES = {
  dashboard: { component: Dashboard, title: 'Dashboard' },
  students: { component: Students, title: 'Students' },
  staff: { component: Staff, title: 'Staff' },
  payments: { component: Payments, title: 'Student Payments' },
  sales: { component: Sales, title: 'Sales Records' },
  reportcards: { component: ReportCards, title: 'Report Cards' },
  payroll: { component: Payroll, title: 'Staff Payroll' },
  attendance: { component: Attendance, title: 'Attendance' },
  inventory: { component: Inventory, title: 'Inventory' },
  admissionletter: { component: AdmissionLetter, title: 'Admission Letter' },
  settings: { component: Settings, title: 'Settings' },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    initDatabase();
    const saved = localStorage.getItem('tea_user');
    if (saved) setUser(JSON.parse(saved));

  }, []);

  useEffect(() => {
    if (user) api.getSettings().then(s => setSettings(s || {}));
  }, [user]);

  const login = (u) => { setUser(u); localStorage.setItem('tea_user', JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem('tea_user'); setPage('dashboard'); };
  const refreshSettings = () => api.getSettings().then(s => setSettings(s || {}));

  const Page = PAGES[page]?.component || Dashboard;
  const title = PAGES[page]?.title || 'Dashboard';

  if (!user) return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ErrorBoundary><Login /></ErrorBoundary>
    </AuthContext.Provider>
  );

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
