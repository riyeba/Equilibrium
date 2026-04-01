import React, { useEffect, useState } from 'react';
import { api, useSettings } from '../App';
import { Users, UserCheck, CreditCard, ShoppingCart, Package, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0, totalStaff: 0, todayPayments: 0,
        totalPayments: 0, monthSales: 0, lowStockItems: 0, recentPayments: []
    });
    const [loading, setLoading] = useState(true);
    const { settings } = useSettings();

    useEffect(() => {
        api.getDashboardStats().then(s => { setStats(s || {}); setLoading(false); });
    }, []);

    const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n || 0);

    const cards = [
        { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
        { label: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'bg-green-500', bg: 'bg-green-50' },
        { label: "Today's Payments", value: fmt(stats.todayPayments), icon: CreditCard, color: 'bg-purple-500', bg: 'bg-purple-50' },
        { label: 'Total Payments', value: fmt(stats.totalPayments), icon: TrendingUp, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
        { label: 'Sales This Month', value: fmt(stats.monthSales), icon: ShoppingCart, color: 'bg-orange-500', bg: 'bg-orange-50' },
        { label: 'Low Stock Items', value: stats.lowStockItems, icon: Package, color: 'bg-red-500', bg: 'bg-red-50' },
    ];

    return (
        <div>
            {/* Welcome */}
            <div className='mb-6 p-6 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl text-white'>
                <h2 className='text-2xl font-bold mb-1'>
                    Welcome back 👋
                </h2>
                <p className='text-blue-200 text-sm'>
                    {settings.school_name} &nbsp;·&nbsp; {settings.current_term} &nbsp;·&nbsp; {settings.current_year}
                </p>
            </div>

            {/* Stats grid */}
            {loading ? (
                <div className='text-center py-12 text-gray-400'>Loading dashboard...</div>
            ) : (
                <div className='grid grid-cols-3 gap-4 mb-6'>
                    {cards.map((c, i) => {
                        const Icon = c.icon;
                        return (
                            <div key={i} className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm`}>
                                <div className='flex items-center justify-between mb-3'>
                                    <div className={`${c.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                                        <Icon size={18} className='text-white' />
                                    </div>
                                </div>
                                <div className='text-2xl font-extrabold text-gray-800'>{c.value}</div>
                                <div className='text-xs text-gray-500 mt-1 font-medium'>{c.label}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recent Payments */}
            <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-100'>
                    <h3 className='font-bold text-gray-800'>Recent Payments</h3>
                </div>
                {stats.recentPayments?.length === 0 ? (
                    <div className='text-center py-10 text-gray-400 text-sm'>No payments yet</div>
                ) : (
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                                <th className='px-4 py-3 text-left font-semibold'>Receipt</th>
                                <th className='px-4 py-3 text-left font-semibold'>Student</th>
                                <th className='px-4 py-3 text-left font-semibold'>Type</th>
                                <th className='px-4 py-3 text-right font-semibold'>Amount</th>
                                <th className='px-4 py-3 text-left font-semibold'>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentPayments?.map((p, i) => (
                                <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className='px-4 py-3 border-b border-gray-100'><code className='text-xs bg-gray-100 px-2 py-0.5 rounded'>{p.receipt_number}</code></td>
                                    <td className='px-4 py-3 border-b border-gray-100 font-medium'>{p.student_name}</td>
                                    <td className='px-4 py-3 border-b border-gray-100 text-gray-500'>{p.payment_type}</td>
                                    <td className='px-4 py-3 border-b border-gray-100 text-right font-bold text-green-700'>{fmt(p.amount)}</td>
                                    <td className='px-4 py-3 border-b border-gray-100 text-gray-400'>{p.paid_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
