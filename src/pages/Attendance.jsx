import React, { useEffect, useState } from 'react';
import { api, useSettings } from '../App';
import { Save, Users, UserCheck } from 'lucide-react';

const CLASSES = ['Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

export default function Attendance() {
    const [tab, setTab] = useState('students');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selClass, setSelClass] = useState('Primary 1');
    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stuAtt, setStuAtt] = useState({});
    const [staAtt, setStaAtt] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { settings } = useSettings();

    useEffect(() => {
        if (tab === 'students') {
            api.getStudentsByClass(selClass).then(list => {
                setStudents(list);
                api.getStudentAttendanceByDate(date).then(att => {
                    const map = {};
                    list.forEach(s => { map[s.id] = 'present'; });
                    att.forEach(a => { map[a.student_id] = a.status; });
                    setStuAtt(map);
                });
            });
        } else {
            api.getStaff().then(list => {
                const active = list.filter(s => s.status === 'active');
                setStaff(active);
                api.getStaffAttendanceByDate(date).then(att => {
                    const map = {};
                    active.forEach(s => { map[s.id] = { status: 'present', time_in: '', time_out: '' }; });
                    att.forEach(a => { map[a.staff_id] = { status: a.status, time_in: a.time_in || '', time_out: a.time_out || '' }; });
                    setStaAtt(map);
                });
            });
        }
    }, [tab, date, selClass]);

    const saveStudents = async () => {
        setSaving(true);
        const records = students.map(s => ({
            student_id: s.id, date, status: stuAtt[s.id] || 'present',
            term: settings.current_term, academic_year: settings.current_year
        }));
        await api.bulkMarkStudentAttendance(records);
        setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    const saveStaff = async () => {
        setSaving(true);
        const records = staff.map(s => ({
            staff_id: s.id, date,
            status: staAtt[s.id]?.status || 'present',
            time_in: staAtt[s.id]?.time_in || '',
            time_out: staAtt[s.id]?.time_out || ''
        }));
        await api.bulkMarkStaffAttendance(records);
        setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    const markAll = (status) => {
        if (tab === 'students') { const m = {}; students.forEach(s => m[s.id] = status); setStuAtt(m); }
        else { const m = {}; staff.forEach(s => m[s.id] = { ...staAtt[s.id], status }); setStaAtt(m); }
    };

    const STATUS_COLORS = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', late: 'bg-yellow-100 text-yellow-700', excused: 'bg-blue-100 text-blue-700' };

    return (
        <div>
            {/* Tab + Date */}
            <div className='flex items-center gap-4 mb-5'>
                {[{ id: 'students', label: 'Student Attendance', icon: Users }, { id: 'staff', label: 'Staff Attendance', icon: UserCheck }].map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-blue-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
                            <Icon size={15} />{t.label}
                        </button>
                    );
                })}
                <input type='date' className='ml-auto border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm'
                    value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {tab === 'students' && (
                <div>
                    <div className='flex items-center gap-3 mb-4'>
                        <select className='border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={selClass} onChange={e => setSelClass(e.target.value)}>
                            {CLASSES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button onClick={() => markAll('present')} className='px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold border border-green-200 hover:bg-green-100'>All Present</button>
                        <button onClick={() => markAll('absent')} className='px-3 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200 hover:bg-red-100'>All Absent</button>
                        <button onClick={saveStudents} disabled={saving}
                            className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-900 hover:bg-blue-700 text-white'} disabled:opacity-60`}>
                            <Save size={14} />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead><tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                                <th className='px-4 py-3 text-left font-semibold'>Student</th>
                                <th className='px-4 py-3 text-left font-semibold'>Admission No</th>
                                <th className='px-4 py-3 text-center font-semibold'>Status</th>
                            </tr></thead>
                            <tbody>
                                {students.length === 0 ? (<tr><td colSpan={3} className='text-center py-12 text-gray-400'>No students in {selClass}</td></tr>)
                                    : students.map((s, i) => (
                                        <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className='px-4 py-3 border-b border-gray-100 font-medium'>{s.first_name} {s.last_name}</td>
                                            <td className='px-4 py-3 border-b border-gray-100 text-gray-400 text-xs'>{s.admission_number}</td>
                                            <td className='px-4 py-3 border-b border-gray-100'>
                                                <div className='flex items-center justify-center gap-2'>
                                                    {['present', 'absent', 'late', 'excused'].map(st => (
                                                        <button key={st} onClick={() => setStuAtt(a => ({ ...a, [s.id]: st }))}
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${stuAtt[s.id] === st ? STATUS_COLORS[st] : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'staff' && (
                <div>
                    <div className='flex items-center gap-3 mb-4'>
                        <button onClick={() => markAll('present')} className='px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold border border-green-200'>All Present</button>
                        <button onClick={() => markAll('absent')} className='px-3 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200'>All Absent</button>
                        <button onClick={saveStaff} disabled={saving}
                            className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${saved ? 'bg-green-500 text-white' : 'bg-blue-900 hover:bg-blue-700 text-white'} disabled:opacity-60`}>
                            <Save size={14} />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead><tr className='bg-gradient-to-r from-blue-900 to-blue-700 text-white'>
                                <th className='px-4 py-3 text-left font-semibold'>Staff</th>
                                <th className='px-4 py-3 text-left font-semibold'>Role</th>
                                <th className='px-3 py-3 text-center font-semibold'>Status</th>
                                <th className='px-3 py-3 text-center font-semibold'>Time In</th>
                                <th className='px-3 py-3 text-center font-semibold'>Time Out</th>
                            </tr></thead>
                            <tbody>
                                {staff.length === 0 ? (<tr><td colSpan={5} className='text-center py-12 text-gray-400'>No active staff found</td></tr>)
                                    : staff.map((s, i) => (
                                        <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className='px-4 py-3 border-b border-gray-100 font-medium'>{s.first_name} {s.last_name}<div className='text-xs text-gray-400'>{s.staff_id}</div></td>
                                            <td className='px-4 py-3 border-b border-gray-100 text-gray-500 text-xs'>{s.role}</td>
                                            <td className='px-3 py-3 border-b border-gray-100'>
                                                <div className='flex items-center justify-center gap-1'>
                                                    {['present', 'absent', 'late', 'excused'].map(st => (
                                                        <button key={st} onClick={() => setStaAtt(a => ({ ...a, [s.id]: { ...a[s.id], status: st } }))}
                                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${staAtt[s.id]?.status === st ? STATUS_COLORS[st] : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className='px-3 py-3 border-b border-gray-100'><input type='time' className='border border-gray-200 rounded-lg px-2 py-1 text-xs' value={staAtt[s.id]?.time_in || ''} onChange={e => setStaAtt(a => ({ ...a, [s.id]: { ...a[s.id], time_in: e.target.value } }))} /></td>
                                            <td className='px-3 py-3 border-b border-gray-100'><input type='time' className='border border-gray-200 rounded-lg px-2 py-1 text-xs' value={staAtt[s.id]?.time_out || ''} onChange={e => setStaAtt(a => ({ ...a, [s.id]: { ...a[s.id], time_out: e.target.value } }))} /></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

