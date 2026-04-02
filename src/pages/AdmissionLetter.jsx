import React, { useState, useEffect, useRef } from 'react';
import { api, useSettings } from '../App';
import { Printer, X } from 'lucide-react';
import schoolLogo from '../assets/schoollogo.jpeg';


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
        img.src = schoolLogo;
    });
};

export default function AdmissionLetter() {
    const { settings } = useSettings();
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState(null);
    const [preview, setPreview] = useState(false);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');

    // useEffect(() => {
    //     api.getStudents().then(s => setStudents(s.filter(st => st.status === 'active')));
    // }, []);

    useEffect(() => {
        api.getStudents().then(s => {
            // 1. Check if 's' is actually an array (prevents crash if DB is slow)
            const data = Array.isArray(s) ? s : [];

            // 2. Filter only after we are sure we have data
            setStudents(data.filter(st => st.status === 'active'));
        }).catch(err => {
            console.error("Failed to load students on mobile:", err);
            setStudents([]); // Fallback to empty list instead of crashing
        });
    }, []);


    const CLASSES = [
        'Preparatory Zero', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
        'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
        'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'
    ];

    const filtered = students.filter(s => {
        const matchSearch = `${s.first_name} ${s.middle_name || ''} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search.toLowerCase());
        const matchClass = !classFilter || s.class === classFilter;
        return matchSearch && matchClass;
    });

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
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Admission Letter Generator</h1>

            {/* Search & Select Student */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Search & Select Student</label>
                <div className="flex gap-2 mb-3">
                    <input
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by name or admission number..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}>
                        <option value="">All Classes</option>
                        {CLASSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
                    {filtered.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">No students found</div>
                    ) : filtered.map(s => (
                        <div key={s.id}
                            onClick={() => { setSelected(s); setPreview(true); setSearch(''); }}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${selected?.id === s.id ? 'bg-blue-50' : ''}`}>
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">
                                    {s.first_name} {s.middle_name ? s.middle_name + ' ' : ''}{s.last_name}
                                </div>
                                <div className="text-xs text-gray-400">{s.admission_number} · {s.class}</div>
                            </div>
                            <div className="text-xs text-blue-600 font-semibold">Select →</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Student + Print */}
            {preview && selected && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                        <div>
                            <div className="font-bold text-gray-800">
                                {selected.first_name} {selected.middle_name ? selected.middle_name + ' ' : ''}{selected.last_name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {selected.admission_number} · {selected.class}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setPreview(false); setSelected(null); }}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                <X size={14} /> Close
                            </button>
                            <button onClick={() => printAdmissionLetter(selected)}
                                className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                                <Printer size={14} /> Print Letter
                            </button>
                        </div>
                    </div>

                    {/* Student details summary */}
                    <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Admission No</span>
                            <div className="font-semibold text-blue-700">{selected.admission_number}</div>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Class</span>
                            <div className="font-semibold">{selected.class}</div>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Gender</span>
                            <div>{selected.gender || '—'}</div>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Date of Birth</span>
                            <div>{selected.date_of_birth || '—'}</div>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Guardian</span>
                            <div>{selected.guardian_name || '—'}</div>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase">Guardian Phone</span>
                            <div>{selected.guardian_phone || '—'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
