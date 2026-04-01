import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { Plus, Search, X } from 'lucide-react';

const CATEGORIES = ['Uniform', 'Books', 'Stationery', 'Food', 'Sports', 'Other'];

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

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ staff_id: '', item_name: '', quantity: 1, unit_price: '', category: '', sale_date: new Date().toISOString().split('T')[0], notes: '' });

    const load = () => { api.getSales().then(setSales); api.getStaff().then(s => setStaff(s.filter(st => st.status === 'active'))); };
    useEffect(() => { load(); }, []);

    const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n || 0);
    const filtered = sales.filter(s => `${s.item_name} ${s.staff_name || ''} ${s.category}`.toLowerCase().includes(search.toLowerCase()));
    const totalMonth = sales.filter(s => s.sale_date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((t, s) => t + (s.total_price || 0), 0);

    const handleAdd = async () => {
        if (!form.item_name || !form.unit_price) { alert('Item name and price required'); return; }
        setSaving(true);
        await api.createSale(form);
        setSaving(false); load(); setShowAdd(false);
        setForm({ staff_id: '', item_name: '', quantity: 1, unit_price: '', category: '', sale_date: new Date().toISOString().split('T')[0], notes: '' });
    };

    return (
        <div>
            <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='bg-orange-50 rounded-2xl p-5 border border-white shadow-sm'>
                    <div className='text-2xl font-extrabold text-orange-600'>{fmt(totalMonth)}</div>
                    <div className='text-xs text-gray-500 mt-1 font-medium'>Sales This Month</div>
                </div>
                <div className='bg-blue-50 rounded-2xl p-5 border border-white shadow-sm'>
                    <div className='text-2xl font-extrabold text-blue-700'>{sales.length}</div>
                    <div className='text-xs text-gray-500 mt-1 font-medium'>Total Transactions</div>
                </div>
            </div>

            <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                <div className='flex items-center gap-3 p-4 border-b bg-gray-50/50'>
                    <div className='flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs'>
                        <Search size={14} className='text-gray-400' />
                        <input className='flex-1 text-sm outline-none' placeholder='Search sales...' value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={() => setShowAdd(true)} className='ml-auto flex items-center gap-2 bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold'>
                        <Plus size={14} /> Record Sale
                    </button>
                </div>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                            <th className='px-4 py-3 text-left font-semibold'>Sale No</th>
                            <th className='px-4 py-3 text-left font-semibold'>Item</th>
                            <th className='px-4 py-3 text-left font-semibold'>Staff</th>
                            <th className='px-3 py-3 text-center font-semibold'>Qty</th>
                            <th className='px-4 py-3 text-right font-semibold'>Total</th>
                            <th className='px-4 py-3 text-left font-semibold'>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className='text-center py-12 text-gray-400'>No sales recorded yet</td></tr>
                        ) : filtered.map((s, i) => (
                            <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className='px-4 py-3 border-b border-gray-100'><code className='text-xs bg-gray-100 px-2 py-0.5 rounded'>{s.sale_number}</code></td>
                                <td className='px-4 py-3 border-b border-gray-100 font-medium'>{s.item_name}<div className='text-xs text-gray-400'>{s.category}</div></td>
                                <td className='px-4 py-3 border-b border-gray-100 text-gray-500'>{s.staff_name || '—'}</td>
                                <td className='px-3 py-3 border-b border-gray-100 text-center'>{s.quantity}</td>
                                <td className='px-4 py-3 border-b border-gray-100 text-right font-bold text-orange-600'>{fmt(s.total_price)}</td>
                                <td className='px-4 py-3 border-b border-gray-100 text-gray-400 text-xs'>{s.sale_date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <Modal title='Record Sale' onClose={() => setShowAdd(false)}>
                    <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='col-span-2'>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Item Name *</label>
                                <input className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Quantity</label>
                                <input type='number' min='1' className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Unit Price (₦) *</label>
                                <input type='number' className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Category</label>
                                <select className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    <option value=''>Select...</option>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Staff (optional)</label>
                                <select className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                                    <option value=''>No staff</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>Date</label>
                                <input type='date' className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={form.sale_date} onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))} />
                            </div>
                        </div>
                        {form.quantity && form.unit_price && (
                            <div className='bg-green-50 rounded-xl px-4 py-3 text-green-700 font-bold text-sm'>
                                Total: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(form.quantity * form.unit_price)}
                            </div>
                        )}
                        <div className='flex justify-end gap-3 pt-2'>
                            <button onClick={() => setShowAdd(false)} className='px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold'>Cancel</button>
                            <button onClick={handleAdd} disabled={saving} className='px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-semibold disabled:opacity-60'>
                                {saving ? 'Saving...' : 'Record Sale'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
