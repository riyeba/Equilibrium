

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { api, useSettings } from '../App';
import {
    Plus, Search, X, Pencil, Trash2, ChevronLeft, ChevronRight,
    Printer, BookOpen, Users, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';

import schoolLogo from '../assets/schoollogo.jpeg';

// Custom Naira sign icon (₦)
const NairaSign = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}>
        <line x1="5" y1="7" x2="19" y2="17" />
        <line x1="5" y1="17" x2="19" y2="7" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="3" y1="14" x2="21" y2="14" />
    </svg>
);

const CLASSES = [
    'All Classes',
    'Preparatory Zero', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'
];
const STUDENT_CLASSES = CLASSES.filter(c => c !== 'All Classes');

// Group classes for the per-class amount grid UI
const CLASS_GROUPS = [
    { label: 'Pre-School', classes: ['Preparatory Zero', 'Nursery 1', 'Nursery 2'] },
    { label: 'Kindergarten', classes: ['KG 1', 'KG 2'] },
    { label: 'Primary', classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'] },
    { label: 'Junior Secondary', classes: ['JSS1', 'JSS2', 'JSS3'] },
    { label: 'Senior Secondary', classes: ['SS1', 'SS2', 'SS3'] },
];

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const METHODS = ['Cash', 'Bank Transfer', 'POS', 'Cheque'];

// Get effective fee amount for a student's class (per-class override or default)
const getEffectiveAmount = (fee, studentClass) => {
    if (fee?.classAmounts && fee.classAmounts[studentClass] !== undefined) {
        return parseFloat(fee.classAmounts[studentClass]);
    }
    return parseFloat(fee?.amount || 0);
};

// ── helpers ──────────────────────────────────────────────────
const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];
function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function longDate(d) {
    if (!d) return fmtDate(today());
    const dt = new Date(d);
    return `${ordinal(dt.getDate())} ${dt.toLocaleString('en-GB', { month: 'long' })}, ${dt.getFullYear()}`;
}

// ── Modal wrapper ────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                    <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Field — syncs to parent on blur, not on every keystroke ──
const Field = ({ label, k, form, setForm, type = 'text', options, span }) => {
    const [local, setLocal] = useState(form[k] || '');
    // Keep in sync if form[k] changes externally (e.g. reset)
    // useEffect(() => { setLocal(form[k] || ''); }, [form[k]]);
    return (
        <div className={span === 2 ? 'col-span-2' : ''}>
            <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
            {options ? (
                <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[k] || ''}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
                    <option value="">Select...</option>
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
            ) : (
                <input
                    type={type}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    onBlur={() => setForm(f => ({ ...f, [k]: local }))}
                />
            )}
        </div>
    );
};

// ── Logo helper ──────────────────────────────────────────────
const getLogoBase64 = () => new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/jpeg')); };
    img.onerror = () => resolve('');
    img.src = schoolLogo;
});

// ═══════════════════════════════════════════════════════════════
//  RECEIPT PRINTER
// ═══════════════════════════════════════════════════════════════
async function printReceipt({ student, fee, payments, newPayment, settings }) {
    const logo = await getLogoBase64();
    const logoHtml = logo
        ? `<img src="${logo}" style="width:55px;height:55px;border-radius:55%;border:2px solid #92C0D8;object-fit:contain;" />`
        : `<div style="width:55px;height:55px;border-radius:50%;border:2px solid #92C0D8;display:flex;align-items:center;justify-content:center;color:#1A3C6E;font-weight:900;font-size:12px;background:white;">TEA</div>`;

    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
    const feeAmount = parseFloat(fee.amount || 0);
    const balance = Math.max(0, feeAmount - totalPaid);
    const isFullyPaid = balance <= 0;
    const latestPayment = newPayment || payments[0];
    const receiptNumber = latestPayment?.receipt_number || '—';

    // Find previous total before this payment
    const prevTotal = totalPaid - parseFloat(newPayment?.amount_paid || 0);

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
    <title>Receipt - ${student.first_name} ${student.last_name}</title>
    <style>
      @page { size: A5; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { width: 148mm; min-height: 210mm; padding: 10mm 12mm 10mm 12mm; position: relative; background: white; }

      /* Corner SVGs */
      /* Header */
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; margin-left: 28px; padding-top: 6px; }
      .brand { display: flex; align-items: center; gap: 8px; }
      .rc { font-size: 9px; color: #cc0000; font-weight: bold; margin-bottom: 1px; }
      .school-name { font-size: 14px; font-weight: 900; color: #1A3C6E; line-height: 1.1; text-transform: uppercase; }
      .receipt-badge {
        background: ${isFullyPaid ? '#1A3C6E' : '#f59e0b'};
        color: white; padding: 4px 12px; border-radius: 20px;
        font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      }

      .divider { border: none; border-bottom: 2px solid #1A3C6E; margin: 6px 0 10px 0; }

      /* Receipt title */
      .title { text-align: center; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #1A3C6E; }

      /* Info grid */
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 12px; }
      .info-row { font-size: 10px; }
      .info-label { color: #888; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 1px; }
      .info-value { color: #222; font-weight: 600; }

      /* Fee table */
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5px; }
      th { background: #1A3C6E; color: white; padding: 5px 8px; text-align: left; font-size: 10px; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; }
      .tr-even { background: #f8f9ff; }

      /* Summary box */
      .summary { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; }
      .sum-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
      .sum-row.total { font-size: 12px; font-weight: 700; color: #1A3C6E; border-top: 1px solid #c7d2fe; padding-top: 6px; margin-top: 4px; }
      .sum-row.balance { font-size: 12px; font-weight: 700; color: ${isFullyPaid ? '#16a34a' : '#dc2626'}; }

      /* Status banner */
      .status-banner {
        text-align: center; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 12px; margin-bottom: 10px;
        background: ${isFullyPaid ? '#dcfce7' : '#fef3c7'};
        color: ${isFullyPaid ? '#15803d' : '#92400e'};
        border: 1.5px solid ${isFullyPaid ? '#86efac' : '#fcd34d'};
      }

      /* Signature */
      .sig { display: flex; justify-content: space-between; margin-top: 12px; }
      .sig-box { font-size: 9.5px; text-align: center; }
      .sig-box span { display: block; border-bottom: 1px solid #555; width: 120px; height: 18px; margin-bottom: 2px; }

      /* Footer */
      .footer { margin-top: 10px; padding-top: 6px; border-top: 1px solid #ccc; }
      .footer-row { display: flex; align-items: center; gap: 6px; font-size: 8.5px; color: #555; margin-bottom: 3px; }
      .ficon { width: 12px; height: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ficon-pin { background: #c0392b; color: white; }
      .ficon-phone { background: #27ae60; color: white; }
      .ficon-email { background: #d35400; color: white; }
    </style>
  </head><body>
  <div class="page">

    <!-- TOP-LEFT corners -->
    <svg style="position:absolute;top:0;left:0;pointer-events:none;" width="100" height="130" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
     <path d="M 0,0 L 0,130 L 67,65 L 54,58 Z" fill="#92C0D8"/>
      <path d="M 0,0 L 100,0 L 50,56 Z" fill="#1A3C6E"/>
      </svg>
    <!-- BOTTOM-RIGHT corners -->
    
    <svg style="position:absolute;bottom:70;right:0;pointer-events:none;" width="100" height="130" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
       <path d="M 100,130 L 100,0 L 33,65 L 46,72 Z" fill="#1A3C6E"/>
     <path d="M 100,130 L 0,130 L 50,74 Z" fill="#92C0D8"/>
    </svg>

    <!-- Header -->
    <div class="header">
      <div class="brand">
        ${logoHtml}
        <div>
          <div class="rc">RC: 7022145</div>
          <div class="school-name">THE EQUILIBRIUM<br>ACADEMY (TEA)</div>
        </div>
      </div>
      <div class="receipt-badge">${isFullyPaid ? '✓ PAID IN FULL' : 'PART PAYMENT'}</div>
    </div>

    <div class="divider"></div>
    <div class="title">${isFullyPaid ? 'OFFICIAL PAYMENT RECEIPT' : 'PART PAYMENT RECEIPT'}</div>

    <!-- Student & Receipt Info -->
    <div class="info-grid">
      <div class="info-row"><div class="info-label">Receipt No.</div><div class="info-value">${receiptNumber}</div></div>
      <div class="info-row"><div class="info-label">Date</div><div class="info-value">${longDate(latestPayment?.payment_date)}</div></div>
      <div class="info-row"><div class="info-label">Student Name</div><div class="info-value">${student.first_name} ${student.last_name}</div></div>
      <div class="info-row"><div class="info-label">Admission No.</div><div class="info-value">${student.admission_number}</div></div>
      <div class="info-row"><div class="info-label">Class</div><div class="info-value">${student.class}</div></div>
      <div class="info-row"><div class="info-label">Term / Session</div><div class="info-value">${fee.term || '—'} / ${fee.academic_year || settings.current_year || '—'}</div></div>
    </div>

    <!-- Fee Description -->
    <table>
      <thead><tr><th>Fee Description</th><th>Total Fee</th><th>This Payment</th></tr></thead>
      <tbody>
        <tr class="tr-even">
          <td>${fee.name}</td>
          <td>${fmt(fee.amount)}</td>
          <td><b>${fmt(newPayment?.amount_paid || latestPayment?.amount_paid)}</b></td>
        </tr>
      </tbody>
    </table>

    <!-- Payment History (if multiple payments) -->
    ${payments.length > 1 ? `
    <table>
      <thead><tr><th>Date</th><th>Receipt</th><th>Method</th><th>Amount</th></tr></thead>
      <tbody>
        ${payments.map((p, i) => `
        <tr class="${i % 2 === 0 ? 'tr-even' : ''}">
          <td>${fmtDate(p.payment_date)}</td>
          <td>${p.receipt_number}</td>
          <td>${p.payment_method}</td>
          <td>${fmt(p.amount_paid)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ` : ''}

    <!-- Summary -->
    <div class="summary">
      <div class="sum-row"><span>Fee Amount:</span><span>${fmt(feeAmount)}</span></div>
      ${prevTotal > 0 ? `<div class="sum-row"><span>Previously Paid:</span><span>${fmt(prevTotal)}</span></div>` : ''}
      <div class="sum-row"><span>This Payment:</span><span>${fmt(newPayment?.amount_paid || latestPayment?.amount_paid)}</span></div>
      <div class="sum-row total"><span>Total Paid:</span><span>${fmt(totalPaid)}</span></div>
      <div class="sum-row balance"><span>Balance Remaining:</span><span>${isFullyPaid ? 'NIL' : fmt(balance)}</span></div>
    </div>

    <!-- Status banner -->
    <div class="status-banner">
      ${isFullyPaid
            ? '✓ PAYMENT COMPLETE — Thank you!'
            : `⚠ OUTSTANDING BALANCE: ${fmt(balance)} — Please pay before ${fmtDate(fee.due_date) !== '—' ? fmtDate(fee.due_date) : 'due date'}`}
    </div>

    <!-- Method & Notes -->
    <div style="font-size:10px;color:#555;margin-bottom:8px;">
      Payment Method: <b>${latestPayment?.payment_method || 'Cash'}</b>
      ${latestPayment?.notes ? ` &nbsp;|&nbsp; Note: ${latestPayment.notes}` : ''}
    </div>

    <!-- Signatures -->
    <div class="sig">
      <div class="sig-box"><span></span>Cashier / Bursar</div>
      <div class="sig-box"><span></span>Parent / Guardian</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-row"><div class="ficon ficon-pin">&#9679;</div><span>${settings.school_address || '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State, Nigeria'}</span></div>
      <div class="footer-row"><div class="ficon ficon-phone">&#9990;</div><span>${settings.school_phone || '09043523420, 07063749964, 09029918157, 08075938594'}</span></div>
      <div class="footer-row"><div class="ficon ficon-email">&#9993;</div><span>${settings.school_email || 'theequilibriumacademy@gmail.com'}</span></div>
    </div>

  </div>
  </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ═══════════════════════════════════════════════════════════════
//  PER-CLASS AMOUNTS EDITOR
// ═══════════════════════════════════════════════════════════════
function ClassAmountsEditor({ form, setForm }) {
    const [expanded, setExpanded] = useState(false);
    // Keep a LOCAL copy of classAmounts so typing doesn't re-render the parent
    const [localAmounts, setLocalAmounts] = useState(() => ({ ...(form.classAmounts || {}) }));

    // Sync local → parent only when a field loses focus
    const syncToParent = (updated) => {
        setForm(f => ({ ...f, classAmounts: { ...updated } }));
    };

    const setClassAmt = (cls, val) => {
        const clean = val.replace(/[^0-9.]/g, '');
        setLocalAmounts(prev => ({ ...prev, [cls]: clean }));
    };

    const onBlur = (cls) => {
        syncToParent({ ...localAmounts });
        // Remove empty strings so they don't clutter
        if (!localAmounts[cls]) {
            setLocalAmounts(prev => { const n = { ...prev }; delete n[cls]; return n; });
        }
    };

    const clearAll = () => {
        setLocalAmounts({});
        syncToParent({});
    };

    const hasAny = Object.values(localAmounts).some(v => v !== '' && v !== null && v !== undefined);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
            <button type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-2">
                    <span>Set Different Amounts Per Class</span>
                    {hasAny && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">Configured</span>}
                </span>
                <span className="text-gray-400 text-xs">{expanded ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {expanded && (
                <div className="p-4">
                    <p className="text-xs text-gray-500 mb-4">
                        Leave a class blank to use the default amount above. Only fill in classes that have a <b>different</b> amount.
                    </p>
                    {CLASS_GROUPS.map(group => (
                        <div key={group.label} className="mb-4">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{group.label}</div>
                            <div className="grid grid-cols-3 gap-2">
                                {group.classes.map(cls => (
                                    <div key={cls}>
                                        <label className="block text-xs text-gray-600 mb-0.5">{cls}</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            placeholder={form.amount ? `Default: ${fmt(form.amount)}` : 'Amount'}
                                            value={localAmounts[cls] || ''}
                                            onChange={e => setClassAmt(cls, e.target.value)}
                                            onBlur={() => onBlur(cls)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {hasAny && (
                        <button type="button" onClick={clearAll}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold mt-1">
                            Clear all per-class amounts
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  ISOLATED PAYMENT MODAL — own state, never re-mounts from parent
// ═══════════════════════════════════════════════════════════════
function PaymentModal({ student, fee, initialHistory, initialTotalPaid, settings, onClose, onPaymentSaved }) {
    const [history, setHistory] = useState(initialHistory || []);
    const [totalPaid, setTotalPaid] = useState(initialTotalPaid || 0);
    const [amountInput, setAmountInput] = useState('');
    const [method, setMethod] = useState('Cash');
    const [payDate, setPayDate] = useState(today());
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [amountError, setAmountError] = useState('');

    const feeAmt = parseFloat(fee.amount);
    const balance = Math.max(0, feeAmt - totalPaid);
    const isFullPaid = balance <= 0;

    const handleAmountChange = (val) => {
        const clean = val.replace(/[^0-9.]/g, '');
        setAmountInput(clean);
        if (!clean) { setAmountError(''); return; }
        const num = parseFloat(clean);
        if (num <= 0) setAmountError('Amount must be greater than zero');
        else if (num > balance + 0.01) setAmountError(`Maximum payable is ${fmt(balance)}`);
        else setAmountError('');
    };

    const handlePay = async (andPrint) => {
        const amount = parseFloat(amountInput);
        if (!amount || amount <= 0) { setAmountError('Enter a valid amount'); return; }
        if (amount > balance + 0.01) { setAmountError(`Maximum payable is ${fmt(balance)}`); return; }
        setSaving(true);
        const result = await window.api.createStudentPayment({
            student_id: student.id, fee_type_id: fee.id,
            amount_paid: amount, payment_method: method,
            payment_date: payDate, notes,
        });
        const newHistory = await window.api.getStudentPaymentsByFee({ studentId: student.id, feeTypeId: fee.id });
        const newTotal = newHistory.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
        setSaving(false);
        setHistory(newHistory);
        setTotalPaid(newTotal);
        setAmountInput('');
        setNotes('');
        setAmountError('');
        onPaymentSaved(newHistory, newTotal);
        if (andPrint && result.success) {
            const newPayment = newHistory.find(p => p.receipt_number === result.receipt_number) || newHistory[newHistory.length - 1];
            await printReceipt({ student, fee, payments: newHistory, newPayment, settings });
        } else if (!andPrint) {
            alert(`Payment of ${fmt(amount)} recorded successfully!`);
        }
    };

    const handleReprint = async (payment) => {
        const allPayments = await window.api.getStudentPaymentsByFee({ studentId: student.id, feeTypeId: fee.id });
        const idx = allPayments.findIndex(p => p.id === payment.id);
        const paymentsUpTo = allPayments.slice(0, idx + 1);
        await printReceipt({ student, fee, payments: paymentsUpTo, newPayment: payment, settings });
    };

    return (
        <Modal title={`${student.first_name} ${student.last_name} — ${fee.name}`} onClose={onClose} wide>
            <div className="grid grid-cols-2 gap-6">

                {/* Left: Record payment */}
                <div>
                    <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
                        <div className="flex justify-between mb-1"><span className="text-gray-600">Fee Amount:</span><span className="font-bold">{fmt(feeAmt)}</span></div>
                        <div className="flex justify-between mb-1"><span className="text-gray-600">Total Paid:</span><span className="font-bold text-green-700">{fmt(totalPaid)}</span></div>
                        <div className="flex justify-between border-t border-blue-100 pt-2 mt-2">
                            <span className="font-bold text-gray-700">Balance:</span>
                            <span className={`font-bold text-lg ${isFullPaid ? 'text-green-600' : 'text-red-600'}`}>
                                {isFullPaid ? 'FULLY PAID ✓' : fmt(balance)}
                            </span>
                        </div>
                    </div>

                    {isFullPaid ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-semibold text-sm">
                            ✓ This student has fully paid this fee.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Amount to Pay (₦) *</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${amountError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'}`}
                                    placeholder={`Max: ${fmt(balance)}`}
                                    value={amountInput}
                                    onChange={e => handleAmountChange(e.target.value)}
                                />
                                {amountError && <p className="text-red-500 text-xs mt-1">{amountError}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Payment Method</label>
                                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={method} onChange={e => setMethod(e.target.value)}>
                                    {METHODS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Payment Date</label>
                                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={payDate} onChange={e => setPayDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Notes (optional)</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handlePay(false)} disabled={saving || !!amountError}
                                    className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                                    {saving ? 'Recording...' : 'Record Only'}
                                </button>
                                <button onClick={() => handlePay(true)} disabled={saving || !!amountError}
                                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                                    <Printer size={13} /> Record & Print
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Payment history */}
                <div>
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Payment History</h4>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">No payments recorded yet</div>
                    ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {history.map(p => (
                                <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800">{fmt(p.amount_paid)}</div>
                                        <div className="text-xs text-gray-400">{fmtDate(p.payment_date)} · {p.payment_method}</div>
                                        <div className="text-xs text-blue-600 font-mono">{p.receipt_number}</div>
                                    </div>
                                    <button onClick={() => handleReprint(p)}
                                        className="flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                                        <Printer size={11} /> Reprint
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Payments() {
    const { settings } = useSettings();
    const [tab, setTab] = useState('fees'); // 'fees' | 'students'

    // ── Fee Types state ──
    const [fees, setFees] = useState([]);
    const [showAddFee, setShowAddFee] = useState(false);
    const [editFee, setEditFee] = useState(null);
    const emptyFeeForm = { name: '', amount: '', due_date: '', term: '', academic_year: '', target_class: 'All Classes', description: '', classAmounts: {} };
    const [feeForm, setFeeForm] = useState(emptyFeeForm);
    const [savingFee, setSavingFee] = useState(false);

    // ── Students state ──
    const [students, setStudents] = useState([]);
    const [selectedFeeFilter, setSelectedFeeFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 50;

    // ── Payment modal state ──
    const [payModal, setPayModal] = useState(null); // { student, fee }
    const [payHistory, setPayHistory] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);

    const loadFees = () => window.api?.getFees ? window.api.getFees().then(setFees) : api.getSettings && setFees([]);
    const loadStudents = () => api.getStudents().then(s => setStudents(s.filter(st => st.status === 'active')));

    useEffect(() => { loadFees(); loadStudents(); }, []);

    // ── Fee CRUD ──
    const handleAddFee = async () => {
        if (!feeForm.name || !feeForm.amount) { alert('Fee name and amount are required'); return; }
        setSavingFee(true);
        await window.api.createFee(feeForm);
        setSavingFee(false); loadFees(); setShowAddFee(false);
        setFeeForm(emptyFeeForm);
    };
    const handleEditFee = async () => {
        setSavingFee(true);
        await window.api.updateFee(editFee);
        setSavingFee(false); loadFees(); setEditFee(null);
    };
    const handleDeleteFee = async (id, name) => {
        if (!window.confirm(`Delete fee "${name}"? This will also delete all related payment records.`)) return;
        await window.api.deleteFee(id); loadFees();
    };

    // ── Open payment modal ──
    const openPayModal = async (student, fee) => {
        const history = await window.api.getStudentPaymentsByFee({ studentId: student.id, feeTypeId: fee.id });
        const paid = history.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
        // Use per-class amount if set, otherwise default
        const effectiveAmount = getEffectiveAmount(fee, student.class);
        const feeWithEffectiveAmount = { ...fee, amount: effectiveAmount };
        setPayHistory(history);
        setTotalPaid(paid);
        setPayModal({ student, fee: feeWithEffectiveAmount });
    };

    // ── Filtered students for fee view (memoized to prevent re-render loops) ──
    const activeFee = useMemo(() => fees.find(f => f.id === parseInt(selectedFeeFilter)), [fees, selectedFeeFilter]);

    const filteredStudents = useMemo(() => {
        const eligible = students.filter(s => {
            if (!activeFee) return true;
            return activeFee.target_class === 'All Classes' || s.class === activeFee.target_class;
        });
        return eligible.filter(s => {
            const ms = `${s.first_name} ${s.last_name} ${s.admission_number} ${s.class}`.toLowerCase().includes(search.toLowerCase());
            const mc = !classFilter || s.class === classFilter;
            return ms && mc;
        });
    }, [students, activeFee, search, classFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PER_PAGE));
    const paginated = filteredStudents.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Per-student payment status — only reload when fee or student list actually changes
    const [payStatusCache, setPayStatusCache] = useState({});
    const cacheKeyRef = useRef('');
    useEffect(() => {
        const key = `${selectedFeeFilter}__${filteredStudents.map(s => s.id).join(',')}`;
        if (!activeFee || filteredStudents.length === 0) { setPayStatusCache({}); cacheKeyRef.current = ''; return; }
        if (key === cacheKeyRef.current) return; // already loaded this exact set
        cacheKeyRef.current = key;
        Promise.all(
            filteredStudents.map(s =>
                window.api.getStudentPaymentsByFee({ studentId: s.id, feeTypeId: activeFee.id })
                    .then(hist => ({ id: s.id, paid: hist.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0) }))
            )
        ).then(results => {
            const cache = {};
            results.forEach(r => { cache[r.id] = r.paid; });
            setPayStatusCache(cache);
        });
    }, [selectedFeeFilter, filteredStudents]);

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setTab('fees')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'fees' ? 'bg-blue-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <BookOpen size={15} /> Fee Setup
                </button>
                <button onClick={() => setTab('students')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'students' ? 'bg-blue-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <Users size={15} /> Student Payments
                </button>
            </div>

            {/* ═══════════════ FEE SETUP TAB ═══════════════ */}
            {tab === 'fees' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-800 text-lg">Fee Types</h2>
                        <button onClick={() => setShowAddFee(true)}
                            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                            <Plus size={14} /> Add Fee
                        </button>
                    </div>

                    {fees.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                            <NairaSign size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">No fees set up yet</p>
                            <p className="text-gray-400 text-sm mt-1">Click "Add Fee" to create the first fee type</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {fees.map(fee => {
                                const hasClassAmounts = fee.classAmounts && Object.keys(fee.classAmounts).length > 0;
                                return (
                                    <div key={fee.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className="font-bold text-gray-800 text-base">{fee.name}</span>
                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                        {hasClassAmounts ? 'Variable per class' : fmt(fee.amount)}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${fee.target_class === 'All Classes' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                                                        {fee.target_class}
                                                    </span>
                                                    {fee.term && <span className="bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{fee.term}</span>}
                                                    {hasClassAmounts && <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">Per-class amounts set</span>}
                                                </div>
                                                <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                                                    {fee.academic_year && <span>Session: {fee.academic_year}</span>}
                                                    {fee.due_date && <span>Due: {fmtDate(fee.due_date)}</span>}
                                                    {fee.description && <span>— {fee.description}</span>}
                                                    {!hasClassAmounts && <span className="text-gray-400">Default: {fmt(fee.amount)} for all classes</span>}
                                                </div>
                                                {/* Show per-class breakdown if set */}
                                                {hasClassAmounts && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {STUDENT_CLASSES.map(cls => {
                                                            const amt = fee.classAmounts[cls];
                                                            if (!amt) return null;
                                                            return (
                                                                <span key={cls} className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg text-xs text-gray-600">
                                                                    <span className="font-semibold">{cls}:</span> {fmt(amt)}
                                                                </span>
                                                            );
                                                        })}
                                                        {/* Show classes using default */}
                                                        {STUDENT_CLASSES.some(cls => !fee.classAmounts[cls]) && (
                                                            <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-xs text-blue-600">
                                                                Others: {fmt(fee.amount)} (default)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button onClick={() => setEditFee({ ...fee, classAmounts: { ...(fee.classAmounts || {}) } })}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg transition-colors">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => handleDeleteFee(fee.id, fee.name)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Fee Modal */}
                    {showAddFee && (
                        <Modal title="Add New Fee" onClose={() => { setShowAddFee(false); setFeeForm(emptyFeeForm); }} wide>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Field label="Fee Name *" k="name" form={feeForm} setForm={setFeeForm} span={2} />
                                <Field label="Default Amount (₦) *" k="amount" form={feeForm} setForm={setFeeForm} type="number" />
                                <Field label="Due Date" k="due_date" form={feeForm} setForm={setFeeForm} type="date" />
                                <Field label="Term" k="term" form={feeForm} setForm={setFeeForm} options={TERMS} />
                                <Field label="Academic Year" k="academic_year" form={feeForm} setForm={setFeeForm} />
                                <Field label="Target Class" k="target_class" form={feeForm} setForm={setFeeForm} options={CLASSES} span={2} />
                                <Field label="Description (optional)" k="description" form={feeForm} setForm={setFeeForm} span={2} />
                            </div>
                            <ClassAmountsEditor form={feeForm} setForm={setFeeForm} />
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => { setShowAddFee(false); setFeeForm(emptyFeeForm); }} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
                                <button onClick={handleAddFee} disabled={savingFee}
                                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                                    {savingFee ? 'Saving...' : 'Add Fee'}
                                </button>
                            </div>
                        </Modal>
                    )}

                    {/* Edit Fee Modal */}
                    {editFee && (
                        <Modal title={`Edit — ${editFee.name}`} onClose={() => setEditFee(null)} wide>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Field label="Fee Name *" k="name" form={editFee} setForm={setEditFee} span={2} />
                                <Field label="Default Amount (₦) *" k="amount" form={editFee} setForm={setEditFee} type="number" />
                                <Field label="Due Date" k="due_date" form={editFee} setForm={setEditFee} type="date" />
                                <Field label="Term" k="term" form={editFee} setForm={setEditFee} options={TERMS} />
                                <Field label="Academic Year" k="academic_year" form={editFee} setForm={setEditFee} />
                                <Field label="Target Class" k="target_class" form={editFee} setForm={setEditFee} options={CLASSES} span={2} />
                                <Field label="Description (optional)" k="description" form={editFee} setForm={setEditFee} span={2} />
                            </div>
                            <ClassAmountsEditor form={editFee} setForm={setEditFee} />
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setEditFee(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
                                <button onClick={handleEditFee} disabled={savingFee}
                                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                                    {savingFee ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </Modal>
                    )}
                </div>
            )}

            {/* ═══════════════ STUDENT PAYMENTS TAB ═══════════════ */}
            {tab === 'students' && (
                <div>
                    {/* Controls */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
                        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white min-w-[200px]"
                            value={selectedFeeFilter} onChange={e => { setSelectedFeeFilter(e.target.value); setPage(1); }}>
                            <option value="">— Select a Fee to view —</option>
                            {fees.map(f => <option key={f.id} value={f.id}>{f.name} ({fmt(f.amount)}) — {f.target_class}</option>)}
                        </select>
                        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                            value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
                            <option value="">All Classes</option>
                            {CLASSES.filter(c => c !== 'All Classes').map(c => <option key={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
                            <Search size={14} className="text-gray-400" />
                            <input className="flex-1 text-sm outline-none" placeholder="Search student..."
                                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                            {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                        </div>
                    </div>

                    {!selectedFeeFilter ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                            <NairaSign size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">Select a fee above to view student payment status</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Summary Stats Panel ── */}
                            {activeFee && (() => {
                                const totalStudents = filteredStudents.length;
                                const totalExpected = filteredStudents.reduce((sum, s) => sum + getEffectiveAmount(activeFee, s.class), 0);
                                const totalCollected = filteredStudents.reduce((sum, s) => sum + (payStatusCache[s.id] || 0), 0);
                                const totalOutstanding = Math.max(0, totalExpected - totalCollected);
                                const fullyPaidCount = filteredStudents.filter(s => (payStatusCache[s.id] || 0) >= getEffectiveAmount(activeFee, s.class) - 0.01).length;
                                const partPaidCount = filteredStudents.filter(s => { const p = payStatusCache[s.id] || 0; return p > 0 && p < getEffectiveAmount(activeFee, s.class) - 0.01; }).length;
                                const unpaidCount = filteredStudents.filter(s => !(payStatusCache[s.id] || 0)).length;
                                const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
                                const isFiltered = !!classFilter || !!search;
                                const hasClassAmounts = activeFee.classAmounts && Object.keys(activeFee.classAmounts).length > 0;

                                return (
                                    <div className="mb-4">
                                        {/* Fee title bar */}
                                        <div className="bg-blue-900 text-white rounded-t-2xl px-5 py-3 flex flex-wrap items-center gap-3">
                                            <span className="font-bold text-base">{activeFee.name}</span>
                                            {hasClassAmounts
                                                ? <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold"></span>
                                                : <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">{fmt(activeFee.amount)} per student</span>
                                            }
                                            {activeFee.term && <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">{activeFee.term}</span>}
                                            {activeFee.due_date && <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">Due: {fmtDate(activeFee.due_date)}</span>}
                                            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">{activeFee.target_class}</span>
                                            {isFiltered && <span className="ml-auto text-blue-200 text-xs italic"></span>}
                                        </div>

                                        {/* Stats cards */}
                                        <div className="grid grid-cols-2 gap-0 border-x border-b border-gray-200 rounded-b-2xl overflow-hidden">
                                            {/* Row 1 */}
                                            <div className="bg-white p-4 border-r border-b border-gray-100">
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Students</div>
                                                <div className="text-2xl font-extrabold text-gray-800">{totalStudents}</div>
                                                <div className="flex gap-3 mt-2 text-xs">
                                                    <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 size={11} /> {fullyPaidCount} fully paid</span>
                                                    <span className="flex items-center gap-1 text-yellow-600 font-semibold"><Clock size={11} /> {partPaidCount} part paid</span>
                                                    <span className="flex items-center gap-1 text-red-500 font-semibold"><AlertCircle size={11} /> {unpaidCount} unpaid</span>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 border-b border-gray-100">
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Expected</div>
                                                <div className="text-2xl font-extrabold text-gray-800">{fmt(totalExpected)}</div>
                                                <div className="text-xs text-gray-400 mt-2">{fmt(activeFee.amount)} × {totalStudents} student{totalStudents !== 1 ? 's' : ''}</div>
                                            </div>

                                            {/* Row 2 */}
                                            <div className="bg-green-50 p-4 border-r border-gray-100">
                                                <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Total Collected</div>
                                                <div className="text-2xl font-extrabold text-green-700">{fmt(totalCollected)}</div>
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Collection rate</span><span className="font-bold text-green-700">{collectionPct}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${collectionPct}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-red-50 p-4">
                                                <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Total Outstanding</div>
                                                <div className="text-2xl font-extrabold text-red-600">{fmt(totalOutstanding)}</div>
                                                <div className="text-xs text-gray-400 mt-2">
                                                    {totalOutstanding <= 0
                                                        ? '🎉 All payments complete!'
                                                        : `${unpaidCount + partPaidCount} student${unpaidCount + partPaidCount !== 1 ? 's' : ''} yet to complete payment`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                                            <th className="px-4 py-3 text-left font-semibold">Student</th>
                                            <th className="px-4 py-3 text-left font-semibold">Class</th>
                                            <th className="px-4 py-3 text-right font-semibold">Fee Amount</th>
                                            <th className="px-4 py-3 text-right font-semibold">Paid</th>
                                            <th className="px-4 py-3 text-right font-semibold">Balance</th>
                                            <th className="px-4 py-3 text-center font-semibold">Status</th>
                                            <th className="px-4 py-3 text-center font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((s, i) => {
                                            const paid = payStatusCache[s.id] || 0;
                                            const feeAmt = getEffectiveAmount(activeFee, s.class);
                                            const balance = Math.max(0, feeAmt - paid);
                                            const isFullPaid = balance <= 0;
                                            const isPartPaid = paid > 0 && !isFullPaid;
                                            return (
                                                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                                    <td className="px-4 py-3 border-b border-gray-100">
                                                        <div className="font-semibold text-gray-800">{s.first_name} {s.last_name}</div>
                                                        <div className="text-xs text-gray-400">{s.admission_number}</div>
                                                    </td>
                                                    <td className="px-4 py-3 border-b border-gray-100">
                                                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">{s.class}</span>
                                                    </td>
                                                    <td className="px-4 py-3 border-b border-gray-100 text-right font-semibold text-gray-700">{fmt(feeAmt)}</td>
                                                    <td className="px-4 py-3 border-b border-gray-100 text-right text-green-700 font-semibold">{paid > 0 ? fmt(paid) : '—'}</td>
                                                    <td className="px-4 py-3 border-b border-gray-100 text-right font-semibold"
                                                        style={{ color: isFullPaid ? '#16a34a' : '#dc2626' }}>
                                                        {isFullPaid ? 'NIL' : fmt(balance)}
                                                    </td>
                                                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                                                        {isFullPaid ? (
                                                            <span className="flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold w-fit mx-auto">
                                                                <CheckCircle2 size={10} /> Paid
                                                            </span>
                                                        ) : isPartPaid ? (
                                                            <span className="flex items-center justify-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold w-fit mx-auto">
                                                                <Clock size={10} /> Part Paid
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center justify-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold w-fit mx-auto">
                                                                <AlertCircle size={10} /> Unpaid
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                                                        <button onClick={() => openPayModal(s, activeFee)}
                                                            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors mx-auto">
                                                            <NairaSign size={11} /> {isFullPaid ? 'History' : 'Pay / History'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                                    <div className="text-xs text-gray-500">
                                        Showing <span className="font-semibold text-gray-700">{((page - 1) * PER_PAGE) + 1}</span> – <span className="font-semibold text-gray-700">{Math.min(page * PER_PAGE, filteredStudents.length)}</span> of <span className="font-semibold text-gray-700">{filteredStudents.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPage(1)} disabled={page === 1} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">First</button>
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                                                .map((p, i) => p === '...' ? <span key={`d${i}`} className="px-1 text-gray-400 text-xs">...</span> :
                                                    <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-blue-900 text-white' : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}`}>{p}</button>)}
                                        </div>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
                                        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Last</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════ PAYMENT MODAL ═══════════════ */}
            {payModal && (
                <PaymentModal
                    key={`${payModal.student.id}-${payModal.fee.id}`}
                    student={payModal.student}
                    fee={payModal.fee}
                    initialHistory={payHistory}
                    initialTotalPaid={totalPaid}
                    settings={settings}
                    onClose={() => setPayModal(null)}
                    onPaymentSaved={(newHistory, newTotal) => {
                        setPayHistory(newHistory);
                        setTotalPaid(newTotal);
                        // refresh the table cache for this student
                        setPayStatusCache(prev => ({ ...prev, [payModal.student.id]: newTotal }));
                    }}
                />
            )}

        </div>
    );
}

