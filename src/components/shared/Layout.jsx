import React from 'react';
import { useAuth, useSettings, api } from '../../App';
import {
    LayoutDashboard, Users, UserCheck, CreditCard, ShoppingCart,
    GraduationCap, Wallet, CalendarCheck, Package, Settings,
    LogOut, Database, FileText
} from 'lucide-react';
import schoolLogo from "../../assets/schoollogo.jpeg";

const NAV = [
    { section: 'Main' },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Academic' },
    { key: 'students', label: 'Students', icon: Users },
    { key: 'admissionletter', label: 'Admission Letter', icon: FileText },
    { key: 'reportcards', label: 'Report Cards', icon: GraduationCap },
    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { section: 'Finance' },
    { key: 'payments', label: 'Student Payments', icon: CreditCard },
    { key: 'sales', label: 'Sales Records', icon: ShoppingCart },
    { key: 'payroll', label: 'Staff Payroll', icon: Wallet },
    { section: 'Operations' },
    { key: 'staff', label: 'Staff / HR', icon: UserCheck },
    { key: 'inventory', label: 'Inventory', icon: Package },
    { section: 'System' },
    { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ currentPage, setCurrentPage, pageTitle, children }) {
    const { user, logout } = useAuth();
    const { settings } = useSettings();

    const handleBackup = async () => {
        const r = await api.backupDatabase();
        if (r.success) alert('Backup saved successfully!');
        else alert('Backup was cancelled.');
    };

    const handleRestore = async () => {
        if (!window.confirm('Restoring will REPLACE all current data with the backup file you select. This cannot be undone. Are you sure?')) return;
        const r = await api.restoreDatabase();
        if (r.success) {
            alert('Database restored successfully! The app will now reload.');
            window.location.reload();
        } else if (r.error) {
            alert('Restore failed: ' + r.error);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-tea-bg">
            {/* ── SIDEBAR ── */}
            <aside className="w-64 flex-shrink-0 flex flex-col h-screen overflow-y-auto
        bg-gradient-to-b from-tea-dark via-tea-primary to-tea-light">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="mb-3">
                        <img
                            src={schoolLogo}
                            alt="School Logo"
                            className="w-10 h-10 rounded-full border-2 border-white/20 object-cover bg-white"
                        />
                    </div>
                    <div className="font-serif text-white font-bold text-sm leading-tight">
                        {settings.school_name || 'TEA School Management'}
                    </div>
                    <div className="text-white/40 text-xs mt-1">Management System</div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-3">
                    {NAV.map((item, i) => {
                        if (item.section) return (
                            <div key={i} className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1">{item.section}</div>
                        );
                        const Icon = item.icon;
                        const active = currentPage === item.key;
                        return (
                            <div key={item.key} onClick={() => setCurrentPage(item.key)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium mb-0.5 transition-all
                  ${active ? 'bg-white/15 text-white font-semibold' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}>
                                <Icon size={15} />
                                {item.label}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-white/10">
                    {/* User info */}
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/8 cursor-pointer mb-3"
                        onClick={() => setCurrentPage('settings')}>
                        <div className="w-8 h-8 rounded-full bg-tea-accent flex items-center justify-center font-bold text-tea-dark text-sm">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white text-xs font-semibold">{user?.username}</div>
                            <div className="text-white/40 text-xs">{user?.role}</div>
                        </div>
                    </div>

                    {/* Backup & Restore */}
                    <div className="flex gap-2 mb-2">
                        <button onClick={handleBackup}
                            className="flex-1 flex items-center justify-center gap-1 text-white/50 hover:text-white text-xs py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <Database size={12} /> Backup
                        </button>
                        <button onClick={handleRestore}
                            className="flex-1 flex items-center justify-center gap-1 text-amber-400/70 hover:text-amber-300 text-xs py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <Database size={12} /> Restore
                        </button>
                    </div>

                    {/* Logout */}
                    <button onClick={logout}
                        className="w-full flex items-center justify-center gap-1 text-white/50 hover:text-white text-xs py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <LogOut size={12} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 flex items-center justify-between px-7 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
                    <h1 className="text-lg font-bold text-gray-800">{pageTitle}</h1>
                    <span className="text-xs text-gray-400 font-medium">
                        {settings.current_term} · {settings.current_year}
                    </span>
                </header>
                <main className="flex-1 overflow-y-auto p-7">{children}</main>
            </div>
        </div>
    );
}
