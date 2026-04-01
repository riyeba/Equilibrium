import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { Plus, Search, TrendingDown, TrendingUp, AlertTriangle, X, Package } from 'lucide-react';

const CATEGORIES = ['Stationery', 'Books', 'Furniture', 'Electronics', 'Cleaning', 'Sports', 'Lab Equipment', 'Food & Canteen', 'Other'];

function Modal({ title, onClose, children }) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col'>
                <div className='flex items-center justify-between px-6 py-4 border-b flex-shrink-0'>
                    <h3 className='font-bold text-gray-800'>{title}</h3>
                    <button onClick={onClose} className='p-1.5 rounded-lg hover:bg-gray-100'><X size={16} /></button>
                </div>
                <div className='overflow-y-auto flex-1 p-6'>{children}</div>
            </div>
        </div>
    );
}

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCat] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [adjustItem, setAdj] = useState(null);
    const [adjDelta, setAdjDelta] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [form, setForm] = useState({
        item_name: '', category: '', quantity: 0, unit: 'unit',
        unit_price: 0, supplier: '', location: '', low_stock_threshold: 5, notes: ''
    });

    const load = () => api.getInventory().then(setItems);
    useEffect(() => { load(); }, []);

    const filtered = items.filter(it => {
        const ms = `${it.item_name} ${it.category} ${it.supplier}`.toLowerCase().includes(search.toLowerCase());
        const mc = !catFilter || it.category === catFilter;
        return ms && mc;
    });

    const lowStock = items.filter(it => it.quantity <= it.low_stock_threshold);
    const totalValue = items.reduce((s, it) => s + (it.quantity * it.unit_price), 0);
    const fmt = (n) => new Intl.NumberFormat().format(n || 0);

    const handleAdd = async () => {
        if (!form.item_name) { alert('Item name required'); return; }
        await api.createInventoryItem(form);
        load(); setShowAdd(false);
        setForm({ item_name: '', category: '', quantity: 0, unit: 'unit', unit_price: 0, supplier: '', location: '', low_stock_threshold: 5, notes: '' });
    };

    const handleAdjust = async () => {
        if (!adjDelta) return;
        await api.adjustStock({ id: adjustItem.id, delta: parseInt(adjDelta), note: adjNote });
        load(); setAdj(null); setAdjDelta(''); setAdjNote('');
    };

    return (
        <div>
            {/* Stats */}
            <div className='grid grid-cols-3 gap-4 mb-6'>
                {[
                    { label: 'Total Items', value: items.length, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Low Stock Alerts', value: lowStock.length, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Total Stock Value', value: `₦${fmt(totalValue)}`, color: 'text-green-700', bg: 'bg-green-50' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-2xl p-5 border border-white shadow-sm`}>
                        <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                        <div className='text-xs text-gray-500 mt-1 font-medium'>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Low Stock Alert Banner */}
            {lowStock.length > 0 && (
                <div className='flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-5'>
                    <AlertTriangle size={18} className='text-amber-500 flex-shrink-0' />
                    <span className='text-sm font-medium text-amber-800'>
                        {lowStock.length} item{lowStock.length > 1 ? 's are' : ' is'} running low:
                        {' '}{lowStock.map(i => i.item_name).join(', ')}
                    </span>
                </div>
            )}

            {/* Table */}
            <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                <div className='flex items-center gap-3 p-4 border-b bg-gray-50/50'>
                    <div className='flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs'>
                        <Search size={14} className='text-gray-400' />
                        <input className='flex-1 text-sm outline-none' placeholder='Search inventory...'
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className='border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white'
                        value={catFilter} onChange={e => setCat(e.target.value)}>
                        <option value=''>All Categories</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button onClick={() => setShowAdd(true)}
                        className='ml-auto flex items-center gap-2 bg-tea-primary hover:bg-tea-light text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors'>
                        <Plus size={14} /> Add Item
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className='flex flex-col items-center py-20 text-gray-300'>
                        <Package size={40} className='mb-3' />
                        <p className='text-gray-500 font-medium'>No inventory items found</p>
                    </div>
                ) : (
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                                <th className='px-4 py-3 text-left font-semibold'>Item Name</th>
                                <th className='px-4 py-3 text-left font-semibold'>Category</th>
                                <th className='px-3 py-3 text-center font-semibold'>Qty</th>
                                <th className='px-3 py-3 text-center font-semibold'>Unit</th>
                                <th className='px-3 py-3 text-center font-semibold'>Unit Price</th>
                                <th className='px-3 py-3 text-center font-semibold'>Total Value</th>
                                <th className='px-3 py-3 text-center font-semibold'>Status</th>
                                <th className='px-3 py-3 text-center font-semibold'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((it, i) => {
                                const isLow = it.quantity <= it.low_stock_threshold;
                                return (
                                    <tr key={it.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                        <td className='px-4 py-3 font-semibold text-gray-800 border-b border-gray-100'>
                                            {it.item_name}
                                            {it.supplier && <div className='text-xs text-gray-400 font-normal'>{it.supplier}</div>}
                                        </td>
                                        <td className='px-4 py-3 border-b border-gray-100'>
                                            <span className='bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold'>{it.category || '—'}</span>
                                        </td>
                                        <td className={`px-3 py-3 text-center font-bold border-b border-gray-100 ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                                            {it.quantity}
                                        </td>
                                        <td className='px-3 py-3 text-center border-b border-gray-100 text-gray-500'>{it.unit}</td>
                                        <td className='px-3 py-3 text-center border-b border-gray-100'>₦{fmt(it.unit_price)}</td>
                                        <td className='px-3 py-3 text-center border-b border-gray-100 font-semibold text-green-700'>₦{fmt(it.quantity * it.unit_price)}</td>
                                        <td className='px-3 py-3 text-center border-b border-gray-100'>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isLow ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td className='px-3 py-3 text-center border-b border-gray-100'>
                                            <div className='flex items-center justify-center gap-1'>
                                                <button onClick={() => setAdj(it)}
                                                    className='flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors'>
                                                    <TrendingUp size={11} /> Adjust
                                                </button>
                                                <button onClick={async () => { if (window.confirm('Delete this item?')) { await api.deleteInventoryItem(it.id); load(); } }}
                                                    className='bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors'>
                                                    Del
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Item Modal */}
            {showAdd && (
                <Modal title='Add Inventory Item' onClose={() => setShowAdd(false)}>
                    <div className='grid grid-cols-2 gap-4'>
                        {[
                            ['item_name', 'Item Name *', 'text'], ['category', 'Category', 'select'],
                            ['quantity', 'Initial Quantity', 'number'], ['unit', 'Unit (e.g. pcs, kg)', 'text'],
                            ['unit_price', 'Unit Price (₦)', 'number'], ['low_stock_threshold', 'Low Stock Alert At', 'number'],
                            ['supplier', 'Supplier', 'text'], ['location', 'Storage Location', 'text'],
                        ].map(([k, label, type]) => (
                            <div key={k} className={k === 'item_name' || k === 'supplier' ? 'col-span-2' : ''}>
                                <label className='block text-xs font-bold text-gray-600 mb-1'>{label}</label>
                                {type === 'select' ? (
                                    <select className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
                                        <option value=''>Select...</option>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <input type={type} className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                                )}
                            </div>
                        ))}
                        <div className='col-span-2'>
                            <label className='block text-xs font-bold text-gray-600 mb-1'>Notes</label>
                            <textarea rows={2} className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                    </div>
                    <div className='flex justify-end gap-3 mt-4'>
                        <button onClick={() => setShowAdd(false)} className='px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold'>Cancel</button>
                        <button onClick={handleAdd} className='px-6 py-2 bg-tea-primary text-white rounded-xl text-sm font-semibold'>Add Item</button>
                    </div>
                </Modal>
            )}

            {/* Adjust Stock Modal */}
            {adjustItem && (
                <Modal title={`Adjust Stock — ${adjustItem.item_name}`} onClose={() => setAdj(null)}>
                    <p className='text-sm text-gray-500 mb-4'>Current quantity: <strong>{adjustItem.quantity} {adjustItem.unit}</strong></p>
                    <div className='space-y-4'>
                        <div>
                            <label className='block text-xs font-bold text-gray-600 mb-1'>Adjustment (use negative to remove stock)</label>
                            <input type='number' className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='e.g. +10 to add, -3 to remove' value={adjDelta} onChange={e => setAdjDelta(e.target.value)} />
                        </div>
                        <div>
                            <label className='block text-xs font-bold text-gray-600 mb-1'>Note / Reason</label>
                            <input type='text' className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='e.g. New delivery, Used in class...' value={adjNote} onChange={e => setAdjNote(e.target.value)} />
                        </div>
                        {adjDelta && (
                            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${parseInt(adjDelta) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                New quantity will be: {Math.max(0, adjustItem.quantity + parseInt(adjDelta || 0))} {adjustItem.unit}
                            </div>
                        )}
                    </div>
                    <div className='flex justify-end gap-3 mt-6'>
                        <button onClick={() => setAdj(null)} className='px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold'>Cancel</button>
                        <button onClick={handleAdjust} className='px-6 py-2 bg-tea-primary text-white rounded-xl text-sm font-semibold'>Save Adjustment</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

