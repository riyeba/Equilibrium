import React, { useEffect, useState } from 'react';
import { api, useSettings } from '../App';
import { Plus, Search, Printer, X, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import schoolLogo from '../assets/schoollogo.jpeg';

const ROLES = [
  'Class Teacher', 'Subject Teacher', 'Head Teacher', 'Deputy Head Teacher',
  'Principal', 'Vice Principal', 'Bursar', 'Librarian', 'Counsellor',
  'Administrative Officer', 'Security', 'Cleaner', 'Cook', 'Driver', 'Other'
];

const DEPARTMENTS = [
  'Sciences', 'Arts', 'Commercial', 'Social Sciences', 'Languages',
  'Mathematics', 'ICT', 'Physical Education', 'Administration', 'Support', 'Other'
];

const PER_PAGE = 50;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, k, form, setForm, type = 'text', options, textarea }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    {options ? (
      <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
        <option value="">Select...</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    ) : textarea ? (
      <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
    ) : (
      <input type={type} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
    )}
  </div>
);

const emptyForm = {
  first_name: '', last_name: '', role: 'Class Teacher', department: '',
  phone: '', email: '', bank_name: '', account_number: '', bank_branch: '',
  basic_salary: '', hire_date: new Date().toISOString().split('T')[0]
};

// Format salary as words (for the appointment letter)
function salaryInWords(amount) {
  const num = parseFloat(amount);
  if (!num || isNaN(num)) return 'as agreed';
  // Simple formatter for common Nigerian salary amounts
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function toWords(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100);
    if (n < 1000000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000);
    return toWords(Math.floor(n / 1000000)) + 'Million ' + toWords(n % 1000000);
  }
  return toWords(num).trim() + ' Naira only';
}

// Format date nicely e.g. "22nd April, 2025"
function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const d = new Date(dateStr);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix} ${d.toLocaleString('en-GB', { month: 'long' })}, ${d.getFullYear()}`;
}

const getLogoBase64 = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve('');
    img.src = schoolLogo;
  });
};

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const { settings } = useSettings();

  const load = () => api.getStaff().then(setStaff);
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const filtered = staff.filter(s => {
    const ms = `${s.first_name} ${s.last_name} ${s.staff_id} ${s.role} ${s.department || ''}`.toLowerCase().includes(search.toLowerCase());
    const mr = !roleFilter || s.role === roleFilter;
    return ms && mr;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const active = staff.filter(s => s.status === 'active').length;
  const inactive = staff.filter(s => s.status === 'inactive').length;

  const handleAdd = async () => {
    if (!form.first_name || !form.last_name || !form.role) { alert('First name, last name and role are required'); return; }
    setSaving(true);
    const result = await api.createStaff(form);
    setSaving(false);
    if (result.success) {
      load(); setShowAdd(false); setForm(emptyForm);
      alert(`Staff added successfully!\nStaff ID: ${result.staff_id}`);
    }
  };

  const handleEdit = async () => {
    if (!editItem.first_name || !editItem.last_name) { alert('First name and last name are required'); return; }
    setSaving(true);
    await api.updateStaff(editItem);
    setSaving(false); setEditItem(null); load();
  };

  const printAppointmentLetter = async (member) => {
    const logoBase64 = await getLogoBase64();
    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" style="width:60px;height:60px;border-radius:55%;border:2px solid #92C0D8;object-fit:contain;" />`
      : `<div style="width:60px;height:60px;border-radius:50%;border:2px solid #92C0D8;display:flex;align-items:center;justify-content:center;color:#1A3C6E;font-weight:900;font-size:14px;background:white;">TEA</div>`;

    const today = formatDate(new Date().toISOString().split('T')[0]);
    const fullName = `${member.first_name} ${member.last_name}`;
    const salaryNum = parseFloat(member.basic_salary) || 0;
    const salaryFormatted = salaryNum ? `₦${salaryNum.toLocaleString()}` : '[Salary]';
    const salaryWords = salaryNum ? salaryInWords(salaryNum) : '[amount in words]';
    const role = member.role || '[Role]';

    // Responsibilities vary by role — use a sensible default set matching the PDF
    const responsibilities = [
      { title: 'Lesson Planning and Delivery', desc: 'Prepare structured lesson plans in alignment with the approved curriculum, and deliver engaging and effective teaching across assigned subjects.' },
      { title: 'Classroom Management', desc: 'Foster a respectful, disciplined, and inclusive classroom environment conducive to learning.' },
      { title: 'Student Evaluation', desc: "Continuously assess students' academic progress through classwork, assignments, tests, and active participation." },
      { title: 'Record Keeping', desc: 'Maintain accurate records of attendance, student performance, behaviour, and other relevant matters.' },
      { title: 'Parent Communication', desc: 'Maintain open communication with parents/guardians concerning the progress and welfare of their children.' },
      { title: 'Extracurricular Participation', desc: 'Contribute to the enrichment of students through involvement in school programmes, extra lessons, and special events.' },
    ];

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Appointment Letter - ${fullName}</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        /* ── PAGE 1 ── */
        .page {
          width: 210mm; height: 297mm;
          padding: 14mm 18mm 12mm 18mm;
          position: relative;
          background: white;
          overflow: hidden;
          page-break-after: always;
        }
        /* ── PAGE 2 ── */
        .page2 {
          width: 210mm; min-height: 297mm;
          padding: 14mm 18mm 12mm 18mm;
          position: relative;
          background: white;
          overflow: hidden;
        }

        /* ── Corner SVGs sit outside flow via position:absolute on .page ── */

        /* ── Header ── */
        .header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          padding-top: 10px;
          padding-bottom: 8px;
          margin-bottom: 6px;
        }
        .rc { font-size: 10px; color: #cc0000; font-weight: bold; margin-bottom: 2px; text-align: right; }
        .school-name { font-size: 20px; font-weight: 900; color: #1A3C6E; line-height: 1.1; text-transform: uppercase; letter-spacing: -0.3px; }

        /* ── Page number ── */
        .pgnum { position: absolute; top: 10mm; right: 18mm; font-size: 10px; color: #555; font-weight: bold; }

        /* ── Title ── */
        .title {
          
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
          margin-top: 2px;
          margin-left: 18px;
           position: absolute;
           display: flex;
           flex-direction: column;
           justify-content: center;
           font-family="Times New Roman";
           

          
        }

        .re{
         font-size:14px;
         font-weight: 700;
         font-family="Times New Roman";
        }

        .right-left{
         text-align:center;
         margin-top:3px
        }

        .collaborate{
        font-size:14px;
        }

        

        /* ── Date ── */
        .date-line {font-size: 13px; font-weight: 700; margin-top: 62px; text-align:right}

        /* ── Body ── */
        .dear { font-size: 14px; font-weight: 600; margin-bottom: 10px;margin-top: 30px; }
        p { font-size: 13px; line-height: 1.75; margin-bottom: 9px; text-align: justify; }
        b { font-weight: 700; }
        em { font-style: italic; }

        /* ── Responsibilities ── */
        .resp-title { font-size: 14px; font-weight: 700; margin: 17px 0 6px 0; }
        ol { margin-left: 30px; margin-bottom: 8px;margin-bottom: 17px; }
        ol li { font-size: 13px; line-height: 1.7; margin-bottom: 4px; }

        /* ── Terms ── */
        ul { margin-left: 20px; margin-bottom: 8px; }
        ul li { font-size: 13px; line-height: 1.7; margin-bottom: 4px; }

        /* ── Signature ── */
        .signature { margin-top: 14px; }
        .sig-warm { font-size: 13px; font-weight: 700; }
        .sig-name { font-size: 13px; font-weight: 700; margin-top: 2px; }
        .sig-title { font-size: 13px; font-style: italic; }
        .sig-sub { font-size: 13px; color: #444; }

        /* ── Acknowledgement ── */
        .ack-title { font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 10px 0; padding-top: 12px; }
        .sig-line-parent{display: flex; Justify-content:space-between; align-items:center, margin-Top:16px}
        .sig-line { display: flex; gap:15px; align-items:center }
        
        .sig-box  {  border-bottom: 1px dotted #555; min-width: 200px; }


        /* ── Footer ── */
        .footer { margin-top: 10px; padding-top: 8px;  display: flex; flex-direction: column; gap:15px;}
        .footer-row { display: flex; align-items: flex-start; gap: 14px; font-size: 10px; color: #333; margin-bottom: 4px; line-height: 1.4; }
        .ficon { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ficon-pin { background: #c0392b; color: white; }
        .ficon-phone { background: #27ae60; color: white; }
        .ficon-email { background: #d35400; color: white; }
      </style>
    </head><body>

    <!-- ══════════════ PAGE 1 ══════════════ -->
    <div class="page">

      <!-- Page number -->
      <div class="pgnum">1</div>

      <!-- TOP-LEFT corners -->
      <svg style="position:absolute;top:0;left:0;pointer-events:none;" width="180" height="180" viewBox="0 0 180 230" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,0 L 0,230 L 120,115 L 96,103.5 Z" fill="#92C0D8"/>
        <path d="M 0,0 L 180,0 L 90,100 Z" fill="#1A3C6E"/>
      </svg>

      <!-- BOTTOM-RIGHT corners -->
      <svg style="position:absolute;bottom:0;right:0;pointer-events:none;" width="180" height="180" viewBox="0 0 180 230" xmlns="http://www.w3.org/2000/svg">
        <path d="M 180,230 L 180,0 L 60,115 L 84,126.5 Z" fill="#1A3C6E"/>
        <path d="M 180,230 L 0,230 L 90,130 Z" fill="#92C0D8"/>
      </svg>

      <!-- Header -->
      <div class="header">
        ${logoHtml}
        <div>
          <div class="rc">RC: 7022145</div>
          <div class="school-name">THE EQUILIBRIUM<br>ACADEMY (TEA)</div>
        </div>
      </div>

      <!-- Title -->
      <div class="title">
      <span> <span class="re">RE</span>: APPOINTMENT AS ${role.toUpperCase()} AT THE EQUILIBRIUM ACADEMY </span>
      <span class="right-left">(TEA)</span>
     
      
      </div>

      <!-- Date -->
      <div class="date-line">${today}</div>

      <!-- Dear -->
      <p class="dear">Dear ${fullName},</p>

      <!-- Opening -->
      <p>I am pleased to inform you that, following your successful performance in the recently concluded
      interview process, you have been <b>appointed as a ${role}</b> at <b>The Equilibrium Academy (TEA)</b>.</p>

      <p>Your appointment shall become effective <b>upon submission of the duly completed Assumption of
      Duty Form</b>, following your formal acceptance of this offer.</p>

      <p>In recognition of your new role, you shall be entitled to an <b>annual salary of ${salaryFormatted}</b>
      (${salaryWords}), exclusive of other <b>amazing benefits</b> which will be communicated in due course.
      This salary is subject to statutory deductions and applicable taxes.</p>

      <!-- Responsibilities -->
      <p class="resp-title">Your Key Responsibilities as a ${role} will include:</p>
      <ol>
        ${responsibilities.map(r => `<li><b>${r.title}</b>: ${r.desc}</li>`).join('\n        ')}
      </ol>

      <p ><span class="collaborate"><b>Team Collaboration:</b></span><br>
      Work harmoniously with fellow teachers and administrative staff to support the smooth operation of the school.</p>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-row"><div class="">📍</div><span>${settings.school_address || '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State, Nigeria'}</span></div>
        <div class="footer-row"><div class="ficon ficon-phone">&#9990;</div><span>${settings.school_phone || '09043523420, 07063749964, 09029918157, 08075938594'}</span></div>
        <div class="footer-row"><div class="ficon ficon-email">&#9993;</div><span>${settings.school_email || 'theequilibriumacademy@gmail.com'}</span></div>
      </div>

    </div>

    <!-- ══════════════ PAGE 2 ══════════════ -->
    <div class="page2">

      <!-- Page number -->
      <div class="pgnum">2</div>

      

      <!-- BOTTOM-RIGHT corners -->
     

      <!-- Terms and Conditions -->
      <p><b>Terms and Conditions:</b></p>
      <ul>
        <li>Your appointment is subject to the declaration of medical fitness by a recognised government hospital.</li>
        <li>You are required to submit all relevant credentials and documentation at the commencement of your duty.</li>
        <li>Enclosed herewith is the school's <b>Code of Conduct</b>. This document outlines the professional standards and ethical expectations of all staff. You are expected to read, understand, and adhere to it throughout your service.</li>
      </ul>

      <p><b>Termination Clause:</b></p>
      <p>This appointment may be terminated by either party with <b>one month's written notice</b> or <b>payment of
      one month's salary in lieu of notice</b>. In the event of serious misconduct, persistent negligence, or
      breach of the school's policies, the <b>Board of Management reserves the right to terminate your
      appointment without notice or compensation</b>.</p>

      <p>We are delighted to welcome you to our growing team at The Equilibrium Academy and look forward
      to your meaningful contribution towards nurturing future leaders through excellent academic and moral instruction.</p>

      <p>Please do not hesitate to reach out should you have any questions or require further clarification.</p>

      <p>Once again, congratulations and welcome to The Equilibrium Academy.</p>

      <!-- Signature with stamp -->
      <div style="position:relative; margin-top:14px;">
        <!-- Stamp -->
         <!-- Closing with stamp -->
      <div style="position: relative; width: 100%; min-height: 100px;">
        <!-- Stamp -->
        <div style="position: absolute; right: 70px; top: -15px; width: 120px; height: 120px; opacity: 0.95; pointer-events: none; z-index: 10;">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="141" height="141">
            <circle cx="50" cy="50" r="48" fill="none" stroke="#9BA8C0" stroke-width="1.2" stroke-dasharray="1.5 2" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#9BA8C0" stroke-width="0.7" />
            <circle cx="50" cy="50" r="33" fill="none" stroke="#9BA8C0" stroke-width="0.7" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#9BA8C0" stroke-width="0.7" />
            <path id="textTrack" d="M 11,50 A 39,39 0 0 1 89,50" fill="none" />
            <path id="bottomTrack" d="M 11,50 A 39,39 0 0 0 89,50" fill="none" />
            <text fill="#5B6A91" font-family="Times New Roman" font-size="7.5" font-weight="bold" letter-spacing="0.2" dy="1">
              <textPath href="#textTrack" startOffset="50%" text-anchor="middle">THE EQUILIBRIUM ACADEMY</textPath>
            </text>
            <text fill="#9BA8C0" font-family="Times New Roman" font-size="7.5" font-weight="bold" dy="2.3">
              <textPath href="#bottomTrack" startOffset="50%" text-anchor="middle">(TEA)</textPath>
            </text>
            <path d="M 12,62 L 15,60 L 18,62 L 17,65 L 13,65 Z" fill="#C5CDE0" transform="rotate(-5, 15, 62.5)" />
            <path d="M 82,62 L 85,60 L 88,62 L 87,65 L 83,65 Z" fill="#C5CDE0" transform="rotate(5, 85, 62.5)" />
            <text x="50" y="60" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="5.5" font-weight="bold">RC: 7022145</text>
          </svg>
        </div>

        <div class="signature">
          <div class="sig-warm">Best regards,</div>
          <div class="sig-name" style="margin-top:8px;">${settings.chairman_name || 'Olarinre I.O.'}</div>
          <div class="sig-title">Chairman, The Equilibrium Academy Management Board</div>
          <div class="sig-sub">(For: Board of Directors)</div>
        </div>
      </div>

      <!-- Acknowledgement -->
      <div class="ack-title">ACKNOWLEDGEMENT OF APPOINTMENT AND CODE OF CONDUCT</div>

      <p>I, <b>${fullName}</b>, hereby acknowledge the receipt of my appointment as ${role} at
      <b>The Equilibrium Academy</b>, with an annual salary of <b>${salaryFormatted}</b>. I confirm that I have read and
      understood the terms and conditions outlined in this appointment letter, as well as the attached <b>Code of
      Conduct</b>. I agree to comply with these terms and serve The Equilibrium Academy diligently and honourably.</p>
    <div class="sig-line-parent">
      <div class="sig-line">
        <p>Signature</p>
        <span class="sig-box"></span>
      </div>
      <div class="sig-line">
        <p>Date</p>
        <span class="sig-box"></span>
      </div>
    </div>

      <p style="margin-top:16px;">Please sign and return a copy of this letter to confirm your acceptance of the appointment.</p>

    </div>

    </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-2xl p-5 border border-white shadow-sm">
          <div className="text-2xl font-extrabold text-blue-700">{staff.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Total Staff</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-white shadow-sm">
          <div className="text-2xl font-extrabold text-green-700">{active}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Active</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 border border-white shadow-sm">
          <div className="text-2xl font-extrabold text-red-600">{inactive}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Inactive</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b bg-gray-50/50 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="text-gray-400" />
            <input className="flex-1 text-sm outline-none" placeholder="Search by name, ID or role..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>}
          </div>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            className="ml-auto flex items-center gap-2 bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={14} /> Add Staff
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-300">
            <Users size={40} className="mb-3" />
            <p className="text-gray-500 font-medium">{search || roleFilter ? 'No staff match your search' : 'No staff found'}</p>
            <p className="text-gray-400 text-sm mt-1">{!search && !roleFilter && 'Click "Add Staff" to add the first staff member'}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                  <th className="px-4 py-3 text-left font-semibold">Staff ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Salary (Annual)</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <code className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{s.staff_id}</code>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
                      {s.first_name} {s.last_name}
                      <div className="text-xs text-gray-400 font-normal">{s.department || ''}</div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{s.role}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-500 text-xs">{s.phone || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600 text-xs font-semibold">
                      {s.basic_salary ? `₦${parseFloat(s.basic_salary).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => printAppointmentLetter(s)}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                          <Printer size={11} /> Letter
                        </button>
                        <button onClick={() => setEditItem({ ...s })}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{((page - 1) * PER_PAGE) + 1}</span> – <span className="font-semibold text-gray-700">{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> staff
                {(search || roleFilter) && <span className="ml-1 text-blue-600">(filtered)</span>}
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
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add New Staff Member" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" k="first_name" form={form} setForm={setForm} />
            <Field label="Last Name *" k="last_name" form={form} setForm={setForm} />
            <Field label="Role *" k="role" form={form} setForm={setForm} options={ROLES} />
            <Field label="Department" k="department" form={form} setForm={setForm} options={DEPARTMENTS} />
            <Field label="Phone" k="phone" form={form} setForm={setForm} />
            <Field label="Email" k="email" form={form} setForm={setForm} />
            <Field label="Annual Salary (₦)" k="basic_salary" form={form} setForm={setForm} type="number" />
            <Field label="Hire Date" k="hire_date" form={form} setForm={setForm} type="date" />
            <div className="col-span-2 border-t pt-4 mt-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
            </div>
            <Field label="Bank Name" k="bank_name" form={form} setForm={setForm} />
            <Field label="Account Number" k="account_number" form={form} setForm={setForm} />
            <Field label="Bank Branch" k="bank_branch" form={form} setForm={setForm} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-6 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : 'Add Staff'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title={`Edit — ${editItem.first_name} ${editItem.last_name}`} onClose={() => setEditItem(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" k="first_name" form={editItem} setForm={setEditItem} />
            <Field label="Last Name *" k="last_name" form={editItem} setForm={setEditItem} />
            <Field label="Role *" k="role" form={editItem} setForm={setEditItem} options={ROLES} />
            <Field label="Department" k="department" form={editItem} setForm={setEditItem} options={DEPARTMENTS} />
            <Field label="Phone" k="phone" form={editItem} setForm={setEditItem} />
            <Field label="Email" k="email" form={editItem} setForm={setEditItem} />
            <Field label="Annual Salary (₦)" k="basic_salary" form={editItem} setForm={setEditItem} type="number" />
            <Field label="Hire Date" k="hire_date" form={editItem} setForm={setEditItem} type="date" />
            <Field label="Status" k="status" form={editItem} setForm={setEditItem} options={['active', 'inactive']} />
            <div className="col-span-2 border-t pt-4 mt-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
            </div>
            <Field label="Bank Name" k="bank_name" form={editItem} setForm={setEditItem} />
            <Field label="Account Number" k="account_number" form={editItem} setForm={setEditItem} />
            <Field label="Bank Branch" k="bank_branch" form={editItem} setForm={setEditItem} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditItem(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
            <button onClick={handleEdit} disabled={saving} className="px-6 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
