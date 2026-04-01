import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { Printer, RefreshCw, X, Save } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Modal({ title, onClose, children }) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50' onClick={e => e.target === e.currentTarget && onClose()}>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col'>
                <div className='flex items-center justify-between px-6 py-4 border-b flex-shrink-0'>
                    <h3 className='font-bold text-gray-800'>{title}</h3>
                    <button onClick={onClose} className='p-1.5 rounded-lg hover:bg-gray-100'><X size={16} /></button>
                </div>
                <div className='overflow-y-auto flex-1 p-6'>{children}</div>
            </div>
        </div>
    );
}

export default function Payroll() {
    const [payroll, setPayroll] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [generating, setGen] = useState(false);
    const now = new Date();
    const [selMonth, setSelMonth] = useState(MONTHS[now.getMonth()]);
    const [selYear, setSelYear] = useState(now.getFullYear().toString());

    const load = () => api.getPayroll().then(setPayroll);
    useEffect(() => { load(); }, []);

    const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n || 0);

    const filtered = payroll.filter(p => p.month === selMonth && p.year === selYear);
    const totalNet = filtered.reduce((t, p) => t + (p.net_salary || 0), 0);

    const handleGenerate = async () => {
        setGen(true);
        const r = await api.generatePayroll({ month: selMonth, year: selYear });
        setGen(false); load();
        if (r.success) alert(`Payroll generated for ${r.count} staff members`);
    };

    const handleSave = async () => {
        setSaving(true);
        await api.updatePayroll(editItem);
        setSaving(false); setEditItem(null); load();
    };

    const printPayroll = () => {
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>Payroll Sheet</title>
      <style>body{font-family:Arial,sans-serif;padding:30px}h2{color:#1A3C6E;text-align:center}
      table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1A3C6E;color:white;padding:8px}
      td{padding:6px 8px;border:1px solid #ddd}tr:nth-child(even){background:#f9f9f9}
      .total{font-weight:bold;background:#e8f4e8!important}</style>
    </head><body>
      <h2>PAYROLL SHEET — ${selMonth} ${selYear}</h2>
      <table><thead><tr>
        <th>Staff ID</th><th>Name</th><th>Basic Salary</th><th>Allowances</th>
        <th>Tax</th><th>Penalty</th><th>Other Deductions</th><th>Net Salary</th><th>Bank</th><th>Account No</th>
      </tr></thead><tbody>
      ${filtered.map(p => `<tr>
        <td>${p.staff_code}</td><td>${p.staff_name}</td>
        <td>${fmt(p.basic_salary)}</td><td>${fmt(p.allowances)}</td>
        <td>${fmt(p.tax_deduction)}</td><td>${fmt(p.penalty_deduction)}</td><td>${fmt(p.other_deduction)}</td>
        <td><strong>${fmt(p.net_salary)}</strong></td><td>${p.bank_name || '—'}</td><td>${p.account_number || '—'}</td>
      </tr>`).join('')}
      <tr class='total'><td colspan='7'>TOTAL NET PAYROLL</td><td colspan='3'>${fmt(totalNet)}</td></tr>
      </tbody></table>
    </body></html>`);
        w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400);
    };

    return (
        <div>
            {/* Controls */}
            <div className='flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm'>
                <select className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={selMonth} onChange={e => setSelMonth(e.target.value)}>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
                <select className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    value={selYear} onChange={e => setSelYear(e.target.value)}>
                    {['2023', '2024', '2025', '2026'].map(y => <option key={y}>{y}</option>)}
                </select>
                <button onClick={handleGenerate} disabled={generating}
                    className='flex items-center gap-2 bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60'>
                    <RefreshCw size={14} /> {generating ? 'Generating...' : 'Generate Payroll'}
                </button>
                {filtered.length > 0 && (
                    <button onClick={printPayroll} className='flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold ml-auto'>
                        <Printer size={14} /> Print Sheet
                    </button>
                )}
            </div>

            {/* Summary */}
            {filtered.length > 0 && (
                <div className='bg-green-50 rounded-2xl p-5 border border-white shadow-sm mb-6'>
                    <div className='text-2xl font-extrabold text-green-700'>{fmt(totalNet)}</div>
                    <div className='text-xs text-gray-500 mt-1 font-medium'>Total Net Payroll — {selMonth} {selYear} ({filtered.length} staff)</div>
                </div>
            )}

            {/* Table */}
            <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                            <th className='px-4 py-3 text-left font-semibold'>Staff</th>
                            <th className='px-3 py-3 text-right font-semibold'>Basic</th>
                            <th className='px-3 py-3 text-right font-semibold'>Allowances</th>
                            <th className='px-3 py-3 text-right font-semibold'>Deductions</th>
                            <th className='px-3 py-3 text-right font-semibold'>Net Salary</th>
                            <th className='px-3 py-3 text-left font-semibold'>Bank</th>
                            <th className='px-3 py-3 text-center font-semibold'>Status</th>
                            <th className='px-3 py-3 text-center font-semibold'>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} className='text-center py-12 text-gray-400'>No payroll for {selMonth} {selYear}. Click Generate Payroll.</td></tr>
                        ) : filtered.map((p, i) => (
                            <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className='px-4 py-3 border-b border-gray-100'>
                                    <div className='font-semibold text-gray-800'>{p.staff_name}</div>
                                    <div className='text-xs text-gray-400'>{p.staff_code}</div>
                                </td>
                                <td className='px-3 py-3 border-b border-gray-100 text-right'>{fmt(p.basic_salary)}</td>
                                <td className='px-3 py-3 border-b border-gray-100 text-right text-green-600'>{fmt(p.allowances)}</td>
                                <td className='px-3 py-3 border-b border-gray-100 text-right text-red-500'>{fmt((p.tax_deduction || 0) + (p.penalty_deduction || 0) + (p.other_deduction || 0))}</td>
                                <td className='px-3 py-3 border-b border-gray-100 text-right font-bold text-green-700'>{fmt(p.net_salary)}</td>
                                <td className='px-3 py-3 border-b border-gray-100 text-xs'>{p.bank_name || '—'}<div className='text-gray-400'>{p.account_number || ''}</div></td>
                                <td className='px-3 py-3 border-b border-gray-100 text-center'>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                                </td>
                                <td className='px-3 py-3 border-b border-gray-100 text-center'>
                                    <button onClick={() => setEditItem({ ...p })} className='text-blue-600 hover:text-blue-800 text-xs font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg'>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editItem && (
                <Modal title={`Edit Payroll — ${editItem.staff_name}`} onClose={() => setEditItem(null)}>
                    <div className='grid grid-cols-2 gap-4'>
                        {[['basic_salary', 'Basic Salary'], ['allowances', 'Allowances'], ['tax_deduction', 'Tax Deduction'], ['penalty_deduction', 'Penalty Deduction'], ['other_deduction', 'Other Deductions']].map(([k, label]) => (
                            <div key={k}>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>{label} (₦)</label>
                                <input type='number' className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={editItem[k] || 0} onChange={e => setEditItem(ei => ({ ...ei, [k]: parseFloat(e.target.value) || 0 }))} />
                            </div>
                        ))}
                        <div>
                            <label className='block text-xs font-bold text-gray-600 mb-1'>Status</label>
                            <select className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                value={editItem.status} onChange={e => setEditItem(ei => ({ ...ei, status: e.target.value }))}>
                                <option value='pending'>Pending</option>
                                <option value='paid'>Paid</option>
                            </select>
                        </div>
                        <div className='col-span-2'>
                            <label className='block text-xs font-bold text-gray-600 mb-1'>Notes</label>
                            <input className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                value={editItem.notes || ''} onChange={e => setEditItem(ei => ({ ...ei, notes: e.target.value }))} />
                        </div>
                    </div>
                    <div className='bg-blue-50 rounded-xl px-4 py-3 mt-4 text-blue-800 font-bold text-sm'>
                        Net Salary: {fmt((editItem.basic_salary || 0) + (editItem.allowances || 0) - (editItem.tax_deduction || 0) - (editItem.penalty_deduction || 0) - (editItem.other_deduction || 0))}
                    </div>
                    <div className='flex justify-end gap-3 mt-4'>
                        <button onClick={() => setEditItem(null)} className='px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold'>Cancel</button>
                        <button onClick={handleSave} disabled={saving} className='flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60'>
                            <Save size={14} />{saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

