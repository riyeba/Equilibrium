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
const mockApi = {
  login: async ({ username, password }) =>
    username === 'admin' && password === 'admin123'
      ? { success: true, user: { id: 1, username: 'admin', role: 'admin' } }
      : { success: false },
  getSettings: async () => ({ school_name: 'TEA Demo', current_term: 'First Term', current_year: '2024/2025', admission_prefix: 'TEA', chairman_name: 'Olarinre I.O.', school_address: '1, Alagbaa Village, Ibadan', school_phone: '09043523420', school_email: 'theequilibriumacademy@gmail.com' }),
  saveSettings: async () => ({ success: true }),
  changePassword: async () => ({ success: true }),
  getStudents: async () => [], createStudent: async () => ({ success: true, id: 1, admission_number: 'TEA/1001' }),
  updateStudent: async () => ({ success: true }), deleteStudent: async () => ({ success: true }),
  getStaff: async () => [], createStaff: async () => ({ success: true, id: 1, staff_id: 'STF/0001' }),
  updateStaff: async () => ({ success: true }),
  getPayments: async () => [], createPayment: async () => ({ success: true, receipt_number: 'RCP/2024/00001' }),
  getSales: async () => [], createSale: async () => ({ success: true }),
  getSubjects: async () => [], createSubject: async () => ({ success: true }), deleteSubject: async () => ({ success: true }),
  getGradesByStudent: async () => [], upsertGrade: async () => ({ success: true, grade: 'A', remark: 'Excellent', total: 85 }),
  getPayroll: async () => [], generatePayroll: async () => ({ success: true, count: 0 }), updatePayroll: async () => ({ success: true }),
  getStudentAttendanceByDate: async () => [], getStudentsByClass: async () => [],
  bulkMarkStudentAttendance: async () => ({ success: true }),
  getStaffAttendanceByDate: async () => [], bulkMarkStaffAttendance: async () => ({ success: true }),
  getInventory: async () => [],
  createInventoryItem: async () => ({ success: true }),
  updateInventoryItem: async () => ({ success: true }),
  adjustStock: async () => ({ success: true }),
  deleteInventoryItem: async () => ({ success: true }),
  getDashboardStats: async () => ({ totalStudents: 0, totalStaff: 0, todayPayments: 0, totalPayments: 0, monthSales: 0, lowStockItems: 0, recentPayments: [] }),
  getFees: async () => [],
  createFee: async () => ({ success: true }),
  updateFee: async () => ({ success: true }),
  deleteFee: async () => ({ success: true }),
  getStudentPaymentsByFee: async () => [],
  createStudentPayment: async () => ({ success: true, receipt_number: 'RCP/MOCK' }),
  deleteStudentPayment: async () => ({ success: true }),
  backupDatabase: async () => ({ success: true }),

};

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

  // if (!user) return (
  //   <AuthContext.Provider value={{ user, login, logout }}>
  //     <ErrorBoundary><Login /></ErrorBoundary>
  //   </AuthContext.Provider>
  // );

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
