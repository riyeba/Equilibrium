
import React, { useEffect, useState } from 'react';
import { api, useSettings } from '../App';
import { Plus, Search, Printer, X, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import schoolLogo from '../assets/schoollogo.jpeg';

const CLASSES = [
  'Preparatory Zero', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'
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

const Field = ({ label, k, form, setForm, type = 'text', options }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    {options ? (
      <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
        <option value="">Select...</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
    )}
  </div>
);

const emptyForm = {
  first_name: '', middle_name: '', last_name: '', date_of_birth: '', gender: '',
  class: 'Preparatory Zero', section: '', guardian_name: '',
  guardian_phone: '', guardian_email: '', address: '',
  admission_date: new Date().toISOString().split('T')[0]
};

const getLogoBase64 = () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve('');
    img.src = schoolLogo
  });
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClass] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const { settings } = useSettings();

  const load = () => api.getStudents().then(setStudents);
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, classFilter]);

  const filtered = students.filter(s => {
    const ms = `${s.first_name} ${s.last_name} ${s.admission_number} ${s.class}`.toLowerCase().includes(search.toLowerCase());
    const mc = !classFilter || s.class === classFilter;
    return ms && mc;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const active = students.filter(s => s.status === 'active').length;
  const inactive = students.filter(s => s.status === 'inactive').length;

  const handleAdd = async () => {
    if (!form.first_name || !form.last_name) { alert('First name and last name are required'); return; }
    setSaving(true);
    const result = await api.createStudent(form);
    setSaving(false);
    if (result.success) {
      load(); setShowAdd(false); setForm(emptyForm);
      alert(`Student admitted successfully!\nAdmission Number: ${result.admission_number}`);
    }
  };

  const handleEdit = async () => {
    if (!editItem.first_name || !editItem.last_name) { alert('First name and last name are required'); return; }
    setSaving(true);
    await api.updateStudent(editItem);
    setSaving(false); setEditItem(null); load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They will be marked inactive.`)) return;
    await api.deleteStudent(id); load();
  };

  const printAdmissionLetter = async (student) => {
    const logoBase64 = await getLogoBase64();
    const logoHtml = logoBase64
      ? `<div style="width:60px;height:60px;border-radius:55%;border:2px solid #92C0D8;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:white;"><img src="${logoBase64}" style="width:80%;height:80%;border-radius:55%;object-fit:contain;" /></div>`
      : `<div style="width:60px;height:60px;border-radius:50%;border:2px solid #92C0D8;display:flex;align-items:center;justify-content:center;color:#1A3C6E;font-weight:900;font-size:14px;background:white;">TEA</div>`;

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Admission Letter - ${student.first_name} ${student.last_name}</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: white; }

        .page {
          width: 210mm;
          max-height: 297mm;
          height: 297mm;
          padding: 16mm 18mm 10mm 18mm;
          position: relative;
          background: white;
          overflow: hidden;
        }

        /* ── Header ── */
        .header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          padding-top: 14px;
          padding-bottom: 8px;
        }
        .rc { font-size: 10px; color: #cc0000; font-weight: bold; margin-bottom: 2px; text-align: right; }
        .school-name {
          font-size: 20px; font-weight: 900; color: #1A3C6E;
          line-height: 1.1; text-transform: uppercase; letter-spacing: -0.3px;
        }

        /* ── Title ── */
        .title {
          text-align: center;
          font-size: 16px;
          font-weight: 550;
          margin-bottom: 15px;
          
        }

        /* ── Body ── */
        .dear { font-size: 14px; font-weight: 550; margin-bottom: 15px; margin-top: 25px;}
        p { font-size: 14px; line-height: 1.75; margin-bottom: 8px; text-align: justify; margin-top: 15px }
        b { font-weight: 700; }

        /* ── Signature ── */
        .signature { margin-top: -20px; }
        .sig-warm { font-size: 12px; font-weight: 700; }
        .sig-name { font-size: 13px; font-weight: 700; }
        .sig-title { font-size: 12px; font-style: italic; }

        /* ── Footer ── */
        .footer { margin-top: 12px; padding-top: 8px; }
        .footer-row { display: flex; align-items: flex-start; gap: 8px; font-size: 9.5px; color: #333; margin-bottom: 5px; line-height: 1.4; }
        .ficon { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ficon-pin { background: #c0392b; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ficon-phone { background: #27ae60; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ficon-email { background: #d35400; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    </head><body>
    <div class="page">

      <!-- TOP-LEFT corners -->
      <svg style="position: absolute; top: 0; left: 0; pointer-events: none;" width="180" height="200" viewBox="0 0 180 230" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,0 L 0,230 L 120,115 L 96,103.5 Z" fill="#92c5d8" />
        <path d="M 0,0 L 180,0 L 90,100 Z" fill="#1A3C6E" />
      </svg>

      <!-- BOTTOM-RIGHT corners -->
      <svg style="position: absolute; bottom: 50; right: 0; pointer-events: none;" width="180" height="200" viewBox="0 0 180 230" xmlns="http://www.w3.org/2000/svg">
        <path d="M 180,230 L 180,0 L 60,115 L 84,126.5 Z" fill="#1A3C6E" />
        <path d="M 180,230 L 0,230 L 90,130 Z" fill="#92C0D8" />
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
      <div class="title">OFFER OF PROVISIONAL ADMISSION TO THE EQUILIBRIUM ACADEMY</div>

      <!-- Dear -->
      <p class="dear">Dear ${student.last_name?.toUpperCase()} ${student.first_name}${student.middle_name && student.middle_name.trim() ? ' ' + student.middle_name.trim() : ''},</p>

      <p class="onbehalf">On behalf of The Equilibrium Academy (TEA), it is with immense pleasure that I extend my heartfelt
      congratulations to you on your successful admission into our prestigious institution. Your enrolment in
      <b>${student.class || '[Class]'}</b> marks the commencement of a promising academic journey,
      and we are delighted to welcome you as part of our ${settings.current_year || new Date().getFullYear()} academic session.
      Your admission number is <b>${student.admission_number}</b>.</p>

      <p class="Attea">At TEA, we are committed to harmonising Western and Islamic education, cultivating a nurturing
      environment where curiosity, critical thinking, and compassion flourish. Our serene campus is
      thoughtfully designed to inspire young minds and foster holistic development.</p>

      <p class="motto"><b>Our motto</b>, <em>"Uncompromising academic content and discipline,"</em> reflects our
      unwavering dedication to delivering exceptional education while instilling values that will serve as
      guiding principles throughout your academic pursuits and beyond.</p>

      <p class="vision"><b>Our Vision</b> We aspire to educate students to the highest level of academic excellence,
      enabling them to realise and expand their full potential. Our goal is to prepare you to become
      productive, creative, ethical, and compassionate members of both Nigerian society and the global community.</p>

      <p margin-bottom:15px; margin-bottom:15px;><b>Our Mission</b> We are devoted to providing an outstanding academic foundation,
      complemented by instilling a "can-do" spirit that empowers individuals to achieve enviable heights
      and excel in their academic endeavours on a global stage.</p>

      

      <p margin-bottom:15px; margin-bottom:15px;><b>Our Values</b> <br/> At TEA, integrity is paramount. We maintain a zero-tolerance policy towards academic malpractice,
      ensuring that honesty and uprightness underpin all aspects of our educational framework.</p>

      <p>We are thrilled to welcome you into our vibrant and diverse school community. Here, you will find
      dedicated educators and a supportive team, committed to nurturing your unique talents and guiding
      you towards excellence.</p>

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
        <!-- Closing text -->
        <p style="margin: 0; font-size: 14px; line-height: 1.75;">
          Once again, congratulations on this well-deserved achievement. We are confident that your
          educational journey at The Equilibrium Academy will be both transformative and enriching.
        </p>
      </div>

      <!-- Signature -->
      <div class="signature">
        <div class="sig-warm">Warm regards,</div>
        <div class="sig-name">${settings.chairman_name || 'Olarinre I.O.'}</div>
        <div class="sig-title">Chairman, TEA Management Board</div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-row">
          <div class="ficon ficon-pin">&#9679;</div>
          <span>${settings.school_address || '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State, Nigeria'}</span>
        </div>
        <div class="footer-row">
          <div class="ficon ficon-phone">&#9990;</div>
          <span>${settings.school_phone || '09043523420, 07063749964, 09029918157, 08075938594'}</span>
        </div>
        <div class="footer-row">
          <div class="ficon ficon-email">&#9993;</div>
          <span>${settings.school_email || 'theequilibriumacademy@gmail.com'}</span>
        </div>
      </div>

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
          <div className="text-2xl font-extrabold text-blue-700">{students.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Total Students</div>
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
            <input className="flex-1 text-sm outline-none" placeholder="Search by name, admission no or class..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
            )}
          </div>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={classFilter} onChange={e => setClass(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            className="ml-auto flex items-center gap-2 bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={14} /> Admit Student
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-300">
            <Users size={40} className="mb-3" />
            <p className="text-gray-500 font-medium">{search || classFilter ? 'No students match your search' : 'No students found'}</p>
            <p className="text-gray-400 text-sm mt-1">{!search && !classFilter && 'Click "Admit Student" to add the first student'}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                  <th className="px-4 py-3 text-left font-semibold">Adm. No</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Class</th>
                  <th className="px-4 py-3 text-left font-semibold">Guardian</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <code className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{s.admission_number}</code>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
                      {s.first_name} {s.middle_name ? s.middle_name + ' ' : ''}{s.last_name}
                      <div className="text-xs text-gray-400 font-normal">{s.gender}{s.date_of_birth ? ` · DOB: ${s.date_of_birth}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{s.class}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600 text-xs">{s.guardian_name || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-500 text-xs">{s.guardian_phone || '—'}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => printAdmissionLetter(s)}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                          <Printer size={11} /> Letter
                        </button>
                        <button onClick={() => setEditItem({ ...s })}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={13} />
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
                Showing <span className="font-semibold text-gray-700">{((page - 1) * PER_PAGE) + 1}</span> – <span className="font-semibold text-gray-700">{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> students
                {(search || classFilter) && <span className="ml-1 text-blue-600">(filtered)</span>}
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
        <Modal title="Admit New Student" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" k="first_name" form={form} setForm={setForm} />
            <Field label="Middle Name" k="middle_name" form={form} setForm={setForm} />
            <Field label="Surname *" k="last_name" form={form} setForm={setForm} />
            <Field label="Date of Birth" k="date_of_birth" form={form} setForm={setForm} type="date" />
            <Field label="Gender" k="gender" form={form} setForm={setForm} options={['Male', 'Female']} />
            <Field label="Class *" k="class" form={form} setForm={setForm} options={CLASSES} />
            <Field label="Section (optional)" k="section" form={form} setForm={setForm} />
            <Field label="Admission Date" k="admission_date" form={form} setForm={setForm} type="date" />
            <div />
            <div className="col-span-2 border-t pt-4 mt-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Guardian Information</p>
            </div>
            <Field label="Guardian Name" k="guardian_name" form={form} setForm={setForm} />
            <Field label="Guardian Phone" k="guardian_phone" form={form} setForm={setForm} />
            <Field label="Guardian Email" k="guardian_email" form={form} setForm={setForm} />
            <div />
            <div className="col-span-2"><Field label="Home Address" k="address" form={form} setForm={setForm} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-6 py-2.5 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
              {saving ? 'Admitting...' : 'Admit Student'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title={`Edit — ${editItem.first_name} ${editItem.last_name}`} onClose={() => setEditItem(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" k="first_name" form={editItem} setForm={setEditItem} />
            <Field label="Middle Name" k="middle_name" form={editItem} setForm={setEditItem} />
            <Field label="Surname *" k="last_name" form={editItem} setForm={setEditItem} />
            <Field label="Date of Birth" k="date_of_birth" form={editItem} setForm={setEditItem} type="date" />
            <Field label="Gender" k="gender" form={editItem} setForm={setEditItem} options={['Male', 'Female']} />
            <Field label="Class" k="class" form={editItem} setForm={setEditItem} options={CLASSES} />
            <Field label="Section" k="section" form={editItem} setForm={setEditItem} />
            <Field label="Guardian Name" k="guardian_name" form={editItem} setForm={setEditItem} />
            <Field label="Guardian Phone" k="guardian_phone" form={editItem} setForm={setEditItem} />
            <Field label="Guardian Email" k="guardian_email" form={editItem} setForm={setEditItem} />
            <Field label="Status" k="status" form={editItem} setForm={setEditItem} options={['active', 'inactive']} />
            <div className="col-span-2"><Field label="Home Address" k="address" form={editItem} setForm={setEditItem} /></div>
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

