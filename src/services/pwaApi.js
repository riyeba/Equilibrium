// import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

// // ─── DB singleton ───────────────────────────────────────────────
// let db = null;
// let initPromise = null;

// export const initDatabase = async () => {
//     if (initPromise) return initPromise;
//     initPromise = (async () => {
//         const sqlite3 = await sqlite3InitModule();
//         db = new sqlite3.oo1.OpfsDb('tea_school.db');

//         db.exec(`
//       PRAGMA foreign_keys = ON;
//       CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'admin', created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
//       CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, admission_number TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, date_of_birth TEXT, gender TEXT, class TEXT, section TEXT, guardian_name TEXT, guardian_phone TEXT, guardian_email TEXT, address TEXT, admission_date TEXT DEFAULT (date('now')), status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, role TEXT NOT NULL, department TEXT, phone TEXT, email TEXT, bank_name TEXT, account_number TEXT, bank_branch TEXT, basic_salary REAL DEFAULT 0, hire_date TEXT DEFAULT (date('now')), status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, amount REAL NOT NULL, payment_type TEXT NOT NULL, payment_method TEXT DEFAULT 'cash', term TEXT, academic_year TEXT, description TEXT, paid_date TEXT DEFAULT (date('now')), created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_number TEXT UNIQUE NOT NULL, staff_id INTEGER, item_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, unit_price REAL NOT NULL, total_price REAL NOT NULL, category TEXT, sale_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, class TEXT, max_score REAL DEFAULT 100, created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, term TEXT NOT NULL, academic_year TEXT NOT NULL, ca_score REAL DEFAULT 0, exam_score REAL DEFAULT 0, total_score REAL DEFAULT 0, grade TEXT, remark TEXT, teacher_comment TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id, subject_id, term, academic_year));
//       CREATE TABLE IF NOT EXISTS payroll (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, month TEXT NOT NULL, year TEXT NOT NULL, basic_salary REAL DEFAULT 0, allowances REAL DEFAULT 0, tax_deduction REAL DEFAULT 0, penalty_deduction REAL DEFAULT 0, other_deduction REAL DEFAULT 0, net_salary REAL DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT, created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS student_attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, term TEXT, academic_year TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id, date));
//       CREATE TABLE IF NOT EXISTS staff_attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, time_in TEXT, time_out TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(staff_id, date));
//       CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT NOT NULL, category TEXT, quantity INTEGER DEFAULT 0, unit TEXT DEFAULT 'unit', unit_price REAL DEFAULT 0, supplier TEXT, location TEXT, low_stock_threshold INTEGER DEFAULT 5, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS inventory_log (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, action TEXT NOT NULL, quantity INTEGER, note TEXT, created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS fee_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount REAL NOT NULL, due_date TEXT, term TEXT, academic_year TEXT, target_class TEXT DEFAULT 'All Classes', description TEXT, created_at TEXT DEFAULT (datetime('now')));
//       CREATE TABLE IF NOT EXISTS fee_class_amounts (id INTEGER PRIMARY KEY AUTOINCREMENT, fee_type_id INTEGER NOT NULL, class_name TEXT NOT NULL, amount REAL NOT NULL, UNIQUE(fee_type_id, class_name));
//       CREATE TABLE IF NOT EXISTS student_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, fee_type_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT DEFAULT 'cash', payment_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
//     `);

//         // Seed default admin and settings
//         db.exec("INSERT OR IGNORE INTO users (username,password,role) VALUES('admin','admin123','admin')");
//         [
//             ['school_name', 'The Equilibrium Academy (TEA)'],
//             ['school_address', '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State'],
//             ['school_phone', '09043523420, 07063749964'],
//             ['school_email', 'theequilibriumacademy@gmail.com'],
//             ['current_term', 'First Term'],
//             ['current_year', '2024/2025'],
//             ['admission_prefix', 'TEA'],
//             ['admission_counter', '1000'],
//             ['chairman_name', 'Olarinre I.O.'],
//         ].forEach(([k, v]) =>
//             db.exec({ sql: 'INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', bind: [k, v] })
//         );
//     })();
//     return initPromise;
// };

// // ─── Core helpers ───────────────────────────────────────────────
// const all = async (sql, params = []) => {
//     await initDatabase();
//     const rows = [];
//     db.exec({ sql, bind: params, rowMode: 'object', callback: r => rows.push({ ...r }) });
//     return rows;
// };

// const get = async (sql, params = []) => {
//     const rows = await all(sql, params);
//     return rows[0] || null;
// };

// // run() returns the last inserted row id
// const run = async (sql, params = []) => {
//     await initDatabase();
//     db.exec({ sql, bind: params });
//     const r = db.exec({ sql: 'SELECT last_insert_rowid() as id', rowMode: 'object' });
//     return r[0]?.id || null;
// };

// // ═══════════════════════════════════════════════════════════════
// //  pwaApi — identical surface to preload.js / window.api
// // ═══════════════════════════════════════════════════════════════
// export const pwaApi = {

//     // ── AUTH ──────────────────────────────────────────────────────
//     login: async ({ username, password }) => {
//         const u = await get('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
//         return u ? { success: true, user: { id: u.id, username: u.username, role: u.role } } : { success: false };
//     },

//     changePassword: async ({ userId, newPassword }) => {
//         await run('UPDATE users SET password=? WHERE id=?', [newPassword, userId]);
//         return { success: true };
//     },

//     // ── SETTINGS ──────────────────────────────────────────────────
//     getSettings: async () => {
//         const rows = await all('SELECT key, value FROM settings');
//         return Object.fromEntries(rows.map(r => [r.key, r.value]));
//     },

//     saveSettings: async (updates) => {
//         await initDatabase();
//         for (const [k, v] of Object.entries(updates)) {
//             await run('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)', [k, v]);
//         }
//         return { success: true };
//     },

//     // ── STUDENTS ──────────────────────────────────────────────────
//     getStudents: async () => await all('SELECT * FROM students ORDER BY created_at DESC'),

//     getStudent: async (id) => await get('SELECT * FROM students WHERE id=?', [id]),

//     createStudent: async (data) => {
//         const ctr = await get("SELECT value FROM settings WHERE key='admission_counter'");
//         const pfx = await get("SELECT value FROM settings WHERE key='admission_prefix'");
//         const num = parseInt(ctr.value) + 1;
//         await run("UPDATE settings SET value=? WHERE key='admission_counter'", [num.toString()]);
//         const year = new Date().getFullYear();
//         const admNo = `${pfx.value}/${year}/${String(num).padStart(3, '0')}`;
//         const id = await run(
//             `INSERT INTO students (admission_number,first_name,middle_name,last_name,date_of_birth,gender,class,section,guardian_name,guardian_phone,guardian_email,address,admission_date,status)
//        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//             [admNo, data.first_name, data.middle_name || null, data.last_name,
//                 data.date_of_birth || '', data.gender || '', data.class || '', data.section || '',
//                 data.guardian_name || '', data.guardian_phone || '', data.guardian_email || '',
//                 data.address || '', data.admission_date || new Date().toISOString().split('T')[0], 'active']
//         );
//         return { success: true, id, admission_number: admNo };
//     },

//     updateStudent: async ({ id, ...data }) => {
//         const fields = Object.keys(data).map(k => `${k}=?`).join(',');
//         await run(`UPDATE students SET ${fields} WHERE id=?`, [...Object.values(data), id]);
//         return { success: true };
//     },

//     deleteStudent: async (id) => {
//         await run('UPDATE students SET status=? WHERE id=?', ['inactive', id]);
//         return { success: true };
//     },

//     // ── STAFF ─────────────────────────────────────────────────────
//     getStaff: async () => await all('SELECT * FROM staff ORDER BY created_at DESC'),

//     createStaff: async (data) => {
//         const count = await get('SELECT COUNT(*) as c FROM staff');
//         const staffId = `STF/${String((count?.c || 0) + 1).padStart(4, '0')}`;
//         const id = await run(
//             `INSERT INTO staff (staff_id,first_name,last_name,role,department,phone,email,bank_name,account_number,bank_branch,basic_salary,hire_date,status)
//        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//             [staffId, data.first_name, data.last_name, data.role,
//                 data.department || '', data.phone || '', data.email || '',
//                 data.bank_name || '', data.account_number || '', data.bank_branch || '',
//                 data.basic_salary || 0, data.hire_date || new Date().toISOString().split('T')[0], 'active']
//         );
//         return { success: true, id, staff_id: staffId };
//     },

//     updateStaff: async ({ id, ...data }) => {
//         const fields = Object.keys(data).map(k => `${k}=?`).join(',');
//         await run(`UPDATE staff SET ${fields} WHERE id=?`, [...Object.values(data), id]);
//         return { success: true };
//     },

//     // ── LEGACY PAYMENTS ───────────────────────────────────────────
//     getPayments: async () => await all(
//         `SELECT p.*, s.first_name||' '||s.last_name AS student_name, s.admission_number
//      FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC`
//     ),

//     createPayment: async (data) => {
//         const count = await get('SELECT COUNT(*) as c FROM payments');
//         const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
//         const id = await run(
//             `INSERT INTO payments (receipt_number,student_id,amount,payment_type,payment_method,term,academic_year,description,paid_date)
//        VALUES(?,?,?,?,?,?,?,?,?)`,
//             [rn, data.student_id, data.amount, data.payment_type,
//                 data.payment_method || 'cash', data.term || '', data.academic_year || '',
//                 data.description || '', data.paid_date || new Date().toISOString().split('T')[0]]
//         );
//         return { success: true, id, receipt_number: rn };
//     },

//     // ── SALES ─────────────────────────────────────────────────────
//     getSales: async () => await all(
//         `SELECT sl.*, st.first_name||' '||st.last_name AS staff_name
//      FROM sales sl LEFT JOIN staff st ON sl.staff_id=st.id ORDER BY sl.created_at DESC`
//     ),

//     createSale: async (data) => {
//         const count = await get('SELECT COUNT(*) as c FROM sales');
//         const sn = `SL/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
//         const total = (data.quantity || 1) * (data.unit_price || 0);
//         await run(
//             `INSERT INTO sales (sale_number,staff_id,item_name,quantity,unit_price,total_price,category,sale_date,notes)
//        VALUES(?,?,?,?,?,?,?,?,?)`,
//             [sn, data.staff_id || null, data.item_name, data.quantity || 1,
//                 data.unit_price || 0, total, data.category || '',
//                 data.sale_date || new Date().toISOString().split('T')[0], data.notes || '']
//         );
//         return { success: true };
//     },

//     // ── SUBJECTS ──────────────────────────────────────────────────
//     getSubjects: async () => await all('SELECT * FROM subjects ORDER BY name'),

//     createSubject: async (data) => {
//         const id = await run(
//             'INSERT INTO subjects(name,code,class,max_score) VALUES(?,?,?,?)',
//             [data.name, data.code, data.class || '', data.max_score || 100]
//         );
//         return { success: true, id };
//     },

//     deleteSubject: async (id) => {
//         await run('DELETE FROM subjects WHERE id=?', [id]);
//         return { success: true };
//     },

//     // ── GRADES ────────────────────────────────────────────────────
//     getGradesByStudent: async ({ studentId, term, year }) => await all(
//         `SELECT g.*, sub.name AS subject_name, sub.code AS subject_code
//      FROM grades g JOIN subjects sub ON g.subject_id=sub.id
//      WHERE g.student_id=? AND g.term=? AND g.academic_year=?`,
//         [studentId, term, year]
//     ),

//     upsertGrade: async (data) => {
//         const total = (data.ca_score || 0) + (data.exam_score || 0);
//         let grade = 'F', remark = 'Weak';
//         if (total >= 71) { grade = 'A'; remark = 'Excellent'; }
//         else if (total >= 61) { grade = 'B'; remark = 'Very Good'; }
//         else if (total >= 51) { grade = 'C'; remark = 'Good'; }
//         else if (total >= 41) { grade = 'D'; remark = 'Fairly Good'; }
//         await run(
//             `INSERT OR REPLACE INTO grades
//        (student_id,subject_id,term,academic_year,ca_score,exam_score,total_score,grade,remark,teacher_comment)
//        VALUES(?,?,?,?,?,?,?,?,?,?)`,
//             [data.student_id, data.subject_id, data.term, data.academic_year,
//             data.ca_score || 0, data.exam_score || 0, total, grade, remark, data.teacher_comment || '']
//         );
//         return { success: true, grade, remark, total };
//     },

//     // ── PAYROLL ───────────────────────────────────────────────────
//     getPayroll: async () => await all(
//         `SELECT p.*, s.first_name||' '||s.last_name AS staff_name,
//             s.staff_id AS staff_code, s.bank_name, s.account_number, s.phone, s.email
//      FROM payroll p JOIN staff s ON p.staff_id=s.id ORDER BY p.year DESC, p.month DESC`
//     ),

//     generatePayroll: async ({ month, year }) => {
//         const allStaff = await all("SELECT * FROM staff WHERE status='active'");
//         for (const s of allStaff) {
//             const exists = await get(
//                 'SELECT id FROM payroll WHERE staff_id=? AND month=? AND year=?',
//                 [s.id, month, year]
//             );
//             if (!exists) {
//                 await run(
//                     `INSERT INTO payroll (staff_id,month,year,basic_salary,allowances,tax_deduction,penalty_deduction,other_deduction,net_salary,status)
//            VALUES(?,?,?,?,0,0,0,0,?,'pending')`,
//                     [s.id, month, year, s.basic_salary || 0, s.basic_salary || 0]
//                 );
//             }
//         }
//         return { success: true, count: allStaff.length };
//     },

//     updatePayroll: async ({ id, ...data }) => {
//         const net = (data.basic_salary || 0) + (data.allowances || 0)
//             - (data.tax_deduction || 0) - (data.penalty_deduction || 0) - (data.other_deduction || 0);
//         await run(
//             'UPDATE payroll SET basic_salary=?,allowances=?,tax_deduction=?,penalty_deduction=?,other_deduction=?,net_salary=?,status=?,notes=? WHERE id=?',
//             [data.basic_salary || 0, data.allowances || 0, data.tax_deduction || 0,
//             data.penalty_deduction || 0, data.other_deduction || 0,
//                 net, data.status || 'pending', data.notes || '', id]
//         );
//         return { success: true, net };
//     },

//     // ── ATTENDANCE ────────────────────────────────────────────────
//     getStudentAttendanceByDate: async (date) => await all(
//         `SELECT sa.*, s.first_name||' '||s.last_name AS student_name, s.admission_number, s.class
//      FROM student_attendance sa JOIN students s ON sa.student_id=s.id WHERE sa.date=?`,
//         [date]
//     ),

//     getStudentsByClass: async (cls) => await all(
//         "SELECT * FROM students WHERE class=? AND status='active' ORDER BY first_name",
//         [cls]
//     ),

//     bulkMarkStudentAttendance: async (records) => {
//         for (const r of records) {
//             await run(
//                 'INSERT OR REPLACE INTO student_attendance(student_id,date,status,term,academic_year,notes) VALUES(?,?,?,?,?,?)',
//                 [r.student_id, r.date, r.status, r.term || '', r.academic_year || '', r.notes || '']
//             );
//         }
//         return { success: true };
//     },

//     getStaffAttendanceByDate: async (date) => await all(
//         `SELECT sa.*, s.first_name||' '||s.last_name AS staff_name, s.staff_id AS staff_code, s.role
//      FROM staff_attendance sa JOIN staff s ON sa.staff_id=s.id WHERE sa.date=?`,
//         [date]
//     ),

//     bulkMarkStaffAttendance: async (records) => {
//         for (const r of records) {
//             await run(
//                 'INSERT OR REPLACE INTO staff_attendance(staff_id,date,status,time_in,time_out,notes) VALUES(?,?,?,?,?,?)',
//                 [r.staff_id, r.date, r.status, r.time_in || '', r.time_out || '', r.notes || '']
//             );
//         }
//         return { success: true };
//     },

//     // ── INVENTORY ─────────────────────────────────────────────────
//     getInventory: async () => await all('SELECT * FROM inventory ORDER BY item_name'),

//     createInventoryItem: async (data) => {
//         const id = await run(
//             `INSERT INTO inventory (item_name,category,quantity,unit,unit_price,supplier,location,low_stock_threshold,notes)
//        VALUES(?,?,?,?,?,?,?,?,?)`,
//             [data.item_name, data.category || '', data.quantity || 0, data.unit || 'unit',
//             data.unit_price || 0, data.supplier || '', data.location || '',
//             data.low_stock_threshold || 5, data.notes || '']
//         );
//         return { success: true, id };
//     },

//     updateInventoryItem: async ({ id, ...data }) => {
//         const fields = Object.keys(data).map(k => `${k}=?`).join(',');
//         await run(`UPDATE inventory SET ${fields},updated_at=datetime('now') WHERE id=?`, [...Object.values(data), id]);
//         return { success: true };
//     },

//     adjustStock: async ({ id, delta, note }) => {
//         const item = await get('SELECT * FROM inventory WHERE id=?', [id]);
//         const newQty = Math.max(0, (item?.quantity || 0) + delta);
//         await run("UPDATE inventory SET quantity=?,updated_at=datetime('now') WHERE id=?", [newQty, id]);
//         await run(
//             'INSERT INTO inventory_log(item_id,action,quantity,note) VALUES(?,?,?,?)',
//             [id, delta > 0 ? 'add' : 'remove', Math.abs(delta), note || '']
//         );
//         return { success: true, new_quantity: newQty };
//     },

//     deleteInventoryItem: async (id) => {
//         await run('DELETE FROM inventory WHERE id=?', [id]);
//         return { success: true };
//     },

//     // ── DASHBOARD STATS ───────────────────────────────────────────
//     getDashboardStats: async () => {
//         const today = new Date().toISOString().split('T')[0];
//         const [students, staff, todayPay, totalPay, monthSales, lowStock, recent] = await Promise.all([
//             get("SELECT COUNT(*) AS c FROM students WHERE status='active'"),
//             get("SELECT COUNT(*) AS c FROM staff WHERE status='active'"),
//             get('SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE paid_date=?', [today]),
//             get('SELECT COALESCE(SUM(amount),0) AS t FROM payments'),
//             get("SELECT COALESCE(SUM(total_price),0) AS t FROM sales WHERE strftime('%Y-%m',sale_date)=strftime('%Y-%m','now')"),
//             get('SELECT COUNT(*) AS c FROM inventory WHERE quantity <= low_stock_threshold'),
//             all(`SELECT p.*, s.first_name||' '||s.last_name AS student_name
//            FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC LIMIT 5`),
//         ]);
//         return {
//             totalStudents: students?.c || 0,
//             totalStaff: staff?.c || 0,
//             todayPayments: todayPay?.t || 0,
//             totalPayments: totalPay?.t || 0,
//             monthSales: monthSales?.t || 0,
//             lowStockItems: lowStock?.c || 0,
//             recentPayments: recent,
//         };
//     },

//     // ── FEE TYPES ─────────────────────────────────────────────────
//     getFees: async () => {
//         const fees = await all('SELECT * FROM fee_types ORDER BY created_at DESC');
//         // Attach per-class amounts map to each fee
//         for (const fee of fees) {
//             const classRows = await all(
//                 'SELECT class_name, amount FROM fee_class_amounts WHERE fee_type_id=?',
//                 [fee.id]
//             );
//             fee.classAmounts = {};
//             classRows.forEach(r => { fee.classAmounts[r.class_name] = r.amount; });
//         }
//         return fees;
//     },

//     createFee: async (data) => {
//         const id = await run(
//             `INSERT INTO fee_types (name,amount,due_date,term,academic_year,target_class,description)
//        VALUES(?,?,?,?,?,?,?)`,
//             [data.name, data.amount, data.due_date || '', data.term || '',
//             data.academic_year || '', data.target_class || 'All Classes', data.description || '']
//         );
//         if (data.classAmounts && typeof data.classAmounts === 'object') {
//             for (const [cls, amt] of Object.entries(data.classAmounts)) {
//                 if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
//                     await run(
//                         'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
//                         [id, cls, parseFloat(amt)]
//                     );
//                 }
//             }
//         }
//         return { success: true, id };
//     },

//     updateFee: async ({ id, classAmounts, ...data }) => {
//         if (Object.keys(data).length) {
//             const fields = Object.keys(data).map(k => `${k}=?`).join(',');
//             await run(`UPDATE fee_types SET ${fields} WHERE id=?`, [...Object.values(data), id]);
//         }
//         if (classAmounts && typeof classAmounts === 'object') {
//             await run('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
//             for (const [cls, amt] of Object.entries(classAmounts)) {
//                 if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
//                     await run(
//                         'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
//                         [id, cls, parseFloat(amt)]
//                     );
//                 }
//             }
//         }
//         return { success: true };
//     },

//     deleteFee: async (id) => {
//         await run('DELETE FROM student_payments WHERE fee_type_id=?', [id]);
//         await run('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
//         await run('DELETE FROM fee_types WHERE id=?', [id]);
//         return { success: true };
//     },

//     getFeeAmountForStudent: async ({ feeTypeId, studentClass }) => {
//         const override = await get(
//             'SELECT amount FROM fee_class_amounts WHERE fee_type_id=? AND class_name=?',
//             [feeTypeId, studentClass]
//         );
//         if (override) return { amount: override.amount };
//         const fee = await get('SELECT amount FROM fee_types WHERE id=?', [feeTypeId]);
//         return { amount: fee?.amount || 0 };
//     },

//     // ── STUDENT PAYMENTS (per fee) ────────────────────────────────
//     getStudentPaymentsByFee: async ({ studentId, feeTypeId }) => await all(
//         `SELECT sp.* FROM student_payments sp
//      WHERE sp.student_id=? AND sp.fee_type_id=?
//      ORDER BY sp.payment_date ASC, sp.created_at ASC`,
//         [studentId, feeTypeId]
//     ),

//     createStudentPayment: async (data) => {
//         const count = await get('SELECT COUNT(*) as c FROM student_payments');
//         const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
//         const id = await run(
//             `INSERT INTO student_payments (receipt_number,student_id,fee_type_id,amount_paid,payment_method,payment_date,notes)
//        VALUES(?,?,?,?,?,?,?)`,
//             [rn, data.student_id, data.fee_type_id, data.amount_paid,
//                 data.payment_method || 'cash',
//                 data.payment_date || new Date().toISOString().split('T')[0],
//                 data.notes || '']
//         );
//         return { success: true, id, receipt_number: rn };
//     },

//     deleteStudentPayment: async (id) => {
//         await run('DELETE FROM student_payments WHERE id=?', [id]);
//         return { success: true };
//     },

//     // ── BACKUP / RESTORE ──────────────────────────────────────────
//     // On PWA, backup exports the DB as a downloadable file
//     backupDatabase: async () => {
//         try {
//             await initDatabase();
//             // Export DB bytes via sqlite-wasm export
//             const byteArray = db.export();
//             const blob = new Blob([byteArray], { type: 'application/octet-stream' });
//             const url = URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `TEA_backup_${Date.now()}.db`;
//             a.click();
//             URL.revokeObjectURL(url);
//             return { success: true };
//         } catch (e) {
//             return { success: false, error: e.message };
//         }
//     },

//     // Restore: user picks a .db file, it replaces the current DB
//     restoreDatabase: async () => {
//         return new Promise((resolve) => {
//             const input = document.createElement('input');
//             input.type = 'file';
//             input.accept = '.db';
//             input.onchange = async (e) => {
//                 const file = e.target.files[0];
//                 if (!file) { resolve({ success: false }); return; }
//                 try {
//                     const buffer = await file.arrayBuffer();
//                     const sqlite3 = await sqlite3InitModule();
//                     const restoredDb = new sqlite3.oo1.OpfsDb('tea_school.db');
//                     // Overwrite current DB with restored bytes
//                     db = new sqlite3.oo1.DB({ filename: ':memory:' }); // temp close
//                     // Write bytes to OPFS file directly
//                     const root = await navigator.storage.getDirectory();
//                     const fileHandle = await root.getFileHandle('tea_school.db', { create: true });
//                     const writable = await fileHandle.createWritable();
//                     await writable.write(buffer);
//                     await writable.close();
//                     // Re-open
//                     db = new sqlite3.oo1.OpfsDb('tea_school.db');
//                     initPromise = Promise.resolve();
//                     resolve({ success: true });
//                 } catch (err) {
//                     resolve({ success: false, error: err.message });
//                 }
//             };
//             input.click();
//         });
//     },
// };

// ─────────────────────────────────────────────────────────────────────────────
//  pwaApi.js  —  SQLite in the browser using sql.js (main-thread safe)
//  Data is persisted to localStorage as a base64 string.
//  This works on ALL mobile browsers (iOS Safari, Android Chrome) without
//  requiring OPFS, SharedArrayBuffer, or Web Workers.
// ─────────────────────────────────────────────────────────────────────────────

import initSqlJs from 'sql.js';
// Make sure sql.js wasm is in your public folder:
//   npm install sql.js
//   copy node_modules/sql.js/dist/sql-wasm.wasm  →  public/sql-wasm.wasm

const DB_KEY = 'tea_school_db';

let db = null;
let initPromise = null;

// ── Save DB to localStorage ──────────────────────────────────────────────────
const saveDb = () => {
  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_KEY, base64);
  } catch (e) {
    console.error('saveDb error:', e);
  }
};

// ── Load DB from localStorage ────────────────────────────────────────────────
const loadDbBytes = () => {
  try {
    const base64 = localStorage.getItem(DB_KEY);
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error('loadDbBytes error:', e);
    return null;
  }
};

// ── Init ─────────────────────────────────────────────────────────────────────
export const initDatabase = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => '/sql-wasm.wasm',
    });

    const saved = loadDbBytes();
    db = saved ? new SQL.Database(saved) : new SQL.Database();

    db.run('PRAGMA foreign_keys = ON;');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'admin', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, admission_number TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, date_of_birth TEXT, gender TEXT, class TEXT, section TEXT, guardian_name TEXT, guardian_phone TEXT, guardian_email TEXT, address TEXT, admission_date TEXT DEFAULT (date('now')), status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, role TEXT NOT NULL, department TEXT, phone TEXT, email TEXT, bank_name TEXT, account_number TEXT, bank_branch TEXT, basic_salary REAL DEFAULT 0, hire_date TEXT DEFAULT (date('now')), status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, amount REAL NOT NULL, payment_type TEXT NOT NULL, payment_method TEXT DEFAULT 'cash', term TEXT, academic_year TEXT, description TEXT, paid_date TEXT DEFAULT (date('now')), created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_number TEXT UNIQUE NOT NULL, staff_id INTEGER, item_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, unit_price REAL NOT NULL, total_price REAL NOT NULL, category TEXT, sale_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, class TEXT, max_score REAL DEFAULT 100, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, subject_id INTEGER NOT NULL, term TEXT NOT NULL, academic_year TEXT NOT NULL, ca_score REAL DEFAULT 0, exam_score REAL DEFAULT 0, total_score REAL DEFAULT 0, grade TEXT, remark TEXT, teacher_comment TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id, subject_id, term, academic_year));
      CREATE TABLE IF NOT EXISTS payroll (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, month TEXT NOT NULL, year TEXT NOT NULL, basic_salary REAL DEFAULT 0, allowances REAL DEFAULT 0, tax_deduction REAL DEFAULT 0, penalty_deduction REAL DEFAULT 0, other_deduction REAL DEFAULT 0, net_salary REAL DEFAULT 0, status TEXT DEFAULT 'pending', notes TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS student_attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, term TEXT, academic_year TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id, date));
      CREATE TABLE IF NOT EXISTS staff_attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, time_in TEXT, time_out TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')), UNIQUE(staff_id, date));
      CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT NOT NULL, category TEXT, quantity INTEGER DEFAULT 0, unit TEXT DEFAULT 'unit', unit_price REAL DEFAULT 0, supplier TEXT, location TEXT, low_stock_threshold INTEGER DEFAULT 5, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS inventory_log (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, action TEXT NOT NULL, quantity INTEGER, note TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS fee_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount REAL NOT NULL, due_date TEXT, term TEXT, academic_year TEXT, target_class TEXT DEFAULT 'All Classes', description TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS fee_class_amounts (id INTEGER PRIMARY KEY AUTOINCREMENT, fee_type_id INTEGER NOT NULL, class_name TEXT NOT NULL, amount REAL NOT NULL, UNIQUE(fee_type_id, class_name));
      CREATE TABLE IF NOT EXISTS student_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, fee_type_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT DEFAULT 'cash', payment_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    `);

    // Seed defaults only on fresh DB
    db.run("INSERT OR IGNORE INTO users (username,password,role) VALUES('admin','admin123','admin')");
    [
      ['school_name',       'The Equilibrium Academy (TEA)'],
      ['school_address',    '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State'],
      ['school_phone',      '09043523420, 07063749964'],
      ['school_email',      'theequilibriumacademy@gmail.com'],
      ['current_term',      'First Term'],
      ['current_year',      '2024/2025'],
      ['admission_prefix',  'TEA'],
      ['admission_counter', '1000'],
      ['chairman_name',     'Olarinre I.O.'],
    ].forEach(([k, v]) =>
      db.run('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', [k, v])
    );

    saveDb();
    console.log('TEA database ready');
  })();
  return initPromise;
};

// ── Core query helpers ───────────────────────────────────────────────────────
const sqlAll = (sql, params = []) => {
  try {
    const result = db.exec(sql, params);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
  } catch (e) {
    console.error('sqlAll error:', e.message, sql);
    return [];
  }
};

const sqlGet = (sql, params = []) => sqlAll(sql, params)[0] || null;

const sqlRun = (sql, params = []) => {
  db.run(sql, params);
  saveDb();
  const r = db.exec('SELECT last_insert_rowid() as id');
  return r[0]?.values[0]?.[0] || null;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  pwaApi — exact same surface as window.api (preload.js)
// ═══════════════════════════════════════════════════════════════════════════════
export const pwaApi = {

  // ── AUTH ────────────────────────────────────────────────────────────────────
  login: async ({ username, password }) => {
    await initDatabase();
    const u = sqlGet('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
    return u ? { success: true, user: { id: u.id, username: u.username, role: u.role } } : { success: false };
  },

  changePassword: async ({ userId, newPassword }) => {
    await initDatabase();
    sqlRun('UPDATE users SET password=? WHERE id=?', [newPassword, userId]);
    return { success: true };
  },

  // ── SETTINGS ────────────────────────────────────────────────────────────────
  getSettings: async () => {
    await initDatabase();
    const rows = sqlAll('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },

  saveSettings: async (updates) => {
    await initDatabase();
    Object.entries(updates).forEach(([k, v]) =>
      sqlRun('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)', [k, v])
    );
    return { success: true };
  },

  // ── STUDENTS ────────────────────────────────────────────────────────────────
  getStudents: async () => {
    await initDatabase();
    return sqlAll('SELECT * FROM students ORDER BY created_at DESC');
  },

  getStudent: async (id) => {
    await initDatabase();
    return sqlGet('SELECT * FROM students WHERE id=?', [id]);
  },

  createStudent: async (data) => {
    await initDatabase();
    const ctr = sqlGet("SELECT value FROM settings WHERE key='admission_counter'");
    const pfx = sqlGet("SELECT value FROM settings WHERE key='admission_prefix'");
    const num = parseInt(ctr.value) + 1;
    sqlRun("UPDATE settings SET value=? WHERE key='admission_counter'", [num.toString()]);
    const year = new Date().getFullYear();
    const admNo = `${pfx.value}/${year}/${String(num).padStart(3, '0')}`;
    const id = sqlRun(
      `INSERT INTO students (admission_number,first_name,middle_name,last_name,date_of_birth,gender,class,section,guardian_name,guardian_phone,guardian_email,address,admission_date,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [admNo, data.first_name, data.middle_name || null, data.last_name,
       data.date_of_birth || '', data.gender || '', data.class || '', data.section || '',
       data.guardian_name || '', data.guardian_phone || '', data.guardian_email || '',
       data.address || '', data.admission_date || new Date().toISOString().split('T')[0], 'active']
    );
    return { success: true, id, admission_number: admNo };
  },

  updateStudent: async ({ id, ...data }) => {
    await initDatabase();
    const f = Object.keys(data).map(k => `${k}=?`).join(',');
    sqlRun(`UPDATE students SET ${f} WHERE id=?`, [...Object.values(data), id]);
    return { success: true };
  },

  deleteStudent: async (id) => {
    await initDatabase();
    sqlRun('UPDATE students SET status=? WHERE id=?', ['inactive', id]);
    return { success: true };
  },

  // ── STAFF ───────────────────────────────────────────────────────────────────
  getStaff: async () => {
    await initDatabase();
    return sqlAll('SELECT * FROM staff ORDER BY created_at DESC');
  },

  createStaff: async (data) => {
    await initDatabase();
    const count = sqlGet('SELECT COUNT(*) as c FROM staff');
    const staffId = `STF/${String((count?.c || 0) + 1).padStart(4, '0')}`;
    const id = sqlRun(
      `INSERT INTO staff (staff_id,first_name,last_name,role,department,phone,email,bank_name,account_number,bank_branch,basic_salary,hire_date,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [staffId, data.first_name, data.last_name, data.role,
       data.department || '', data.phone || '', data.email || '',
       data.bank_name || '', data.account_number || '', data.bank_branch || '',
       data.basic_salary || 0, data.hire_date || new Date().toISOString().split('T')[0], 'active']
    );
    return { success: true, id, staff_id: staffId };
  },

  updateStaff: async ({ id, ...data }) => {
    await initDatabase();
    const f = Object.keys(data).map(k => `${k}=?`).join(',');
    sqlRun(`UPDATE staff SET ${f} WHERE id=?`, [...Object.values(data), id]);
    return { success: true };
  },

  // ── LEGACY PAYMENTS ─────────────────────────────────────────────────────────
  getPayments: async () => {
    await initDatabase();
    return sqlAll(
      `SELECT p.*, s.first_name||' '||s.last_name AS student_name, s.admission_number
       FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC`
    );
  },

  createPayment: async (data) => {
    await initDatabase();
    const count = sqlGet('SELECT COUNT(*) as c FROM payments');
    const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
    const id = sqlRun(
      `INSERT INTO payments (receipt_number,student_id,amount,payment_type,payment_method,term,academic_year,description,paid_date)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [rn, data.student_id, data.amount, data.payment_type,
       data.payment_method || 'cash', data.term || '', data.academic_year || '',
       data.description || '', data.paid_date || new Date().toISOString().split('T')[0]]
    );
    return { success: true, id, receipt_number: rn };
  },

  // ── SALES ───────────────────────────────────────────────────────────────────
  getSales: async () => {
    await initDatabase();
    return sqlAll(
      `SELECT sl.*, st.first_name||' '||st.last_name AS staff_name
       FROM sales sl LEFT JOIN staff st ON sl.staff_id=st.id ORDER BY sl.created_at DESC`
    );
  },

  createSale: async (data) => {
    await initDatabase();
    const count = sqlGet('SELECT COUNT(*) as c FROM sales');
    const sn = `SL/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
    const total = (data.quantity || 1) * (data.unit_price || 0);
    sqlRun(
      `INSERT INTO sales (sale_number,staff_id,item_name,quantity,unit_price,total_price,category,sale_date,notes)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [sn, data.staff_id || null, data.item_name, data.quantity || 1,
       data.unit_price || 0, total, data.category || '',
       data.sale_date || new Date().toISOString().split('T')[0], data.notes || '']
    );
    return { success: true };
  },

  // ── SUBJECTS ────────────────────────────────────────────────────────────────
  getSubjects: async () => {
    await initDatabase();
    return sqlAll('SELECT * FROM subjects ORDER BY name');
  },

  createSubject: async (data) => {
    await initDatabase();
    const id = sqlRun(
      'INSERT INTO subjects(name,code,class,max_score) VALUES(?,?,?,?)',
      [data.name, data.code, data.class || '', data.max_score || 100]
    );
    return { success: true, id };
  },

  deleteSubject: async (id) => {
    await initDatabase();
    sqlRun('DELETE FROM subjects WHERE id=?', [id]);
    return { success: true };
  },

  // ── GRADES ──────────────────────────────────────────────────────────────────
  getGradesByStudent: async ({ studentId, term, year }) => {
    await initDatabase();
    return sqlAll(
      `SELECT g.*, sub.name AS subject_name, sub.code AS subject_code
       FROM grades g JOIN subjects sub ON g.subject_id=sub.id
       WHERE g.student_id=? AND g.term=? AND g.academic_year=?`,
      [studentId, term, year]
    );
  },

  upsertGrade: async (data) => {
    await initDatabase();
    const total = (data.ca_score || 0) + (data.exam_score || 0);
    let grade = 'F', remark = 'Weak';
    if (total >= 71)      { grade = 'A'; remark = 'Excellent'; }
    else if (total >= 61) { grade = 'B'; remark = 'Very Good'; }
    else if (total >= 51) { grade = 'C'; remark = 'Good'; }
    else if (total >= 41) { grade = 'D'; remark = 'Fairly Good'; }
    sqlRun(
      `INSERT OR REPLACE INTO grades
       (student_id,subject_id,term,academic_year,ca_score,exam_score,total_score,grade,remark,teacher_comment)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [data.student_id, data.subject_id, data.term, data.academic_year,
       data.ca_score || 0, data.exam_score || 0, total, grade, remark, data.teacher_comment || '']
    );
    return { success: true, grade, remark, total };
  },

  // ── PAYROLL ─────────────────────────────────────────────────────────────────
  getPayroll: async () => {
    await initDatabase();
    return sqlAll(
      `SELECT p.*, s.first_name||' '||s.last_name AS staff_name,
              s.staff_id AS staff_code, s.bank_name, s.account_number, s.phone, s.email
       FROM payroll p JOIN staff s ON p.staff_id=s.id ORDER BY p.year DESC, p.month DESC`
    );
  },

  generatePayroll: async ({ month, year }) => {
    await initDatabase();
    const allStaff = sqlAll("SELECT * FROM staff WHERE status='active'");
    allStaff.forEach(s => {
      const exists = sqlGet(
        'SELECT id FROM payroll WHERE staff_id=? AND month=? AND year=?',
        [s.id, month, year]
      );
      if (!exists) {
        sqlRun(
          `INSERT INTO payroll (staff_id,month,year,basic_salary,allowances,tax_deduction,penalty_deduction,other_deduction,net_salary,status)
           VALUES(?,?,?,?,0,0,0,0,?,'pending')`,
          [s.id, month, year, s.basic_salary || 0, s.basic_salary || 0]
        );
      }
    });
    return { success: true, count: allStaff.length };
  },

  updatePayroll: async ({ id, ...data }) => {
    await initDatabase();
    const net = (data.basic_salary || 0) + (data.allowances || 0)
      - (data.tax_deduction || 0) - (data.penalty_deduction || 0) - (data.other_deduction || 0);
    sqlRun(
      'UPDATE payroll SET basic_salary=?,allowances=?,tax_deduction=?,penalty_deduction=?,other_deduction=?,net_salary=?,status=?,notes=? WHERE id=?',
      [data.basic_salary || 0, data.allowances || 0, data.tax_deduction || 0,
       data.penalty_deduction || 0, data.other_deduction || 0,
       net, data.status || 'pending', data.notes || '', id]
    );
    return { success: true, net };
  },

  // ── ATTENDANCE ──────────────────────────────────────────────────────────────
  getStudentAttendanceByDate: async (date) => {
    await initDatabase();
    return sqlAll(
      `SELECT sa.*, s.first_name||' '||s.last_name AS student_name, s.admission_number, s.class
       FROM student_attendance sa JOIN students s ON sa.student_id=s.id WHERE sa.date=?`,
      [date]
    );
  },

  getStudentsByClass: async (cls) => {
    await initDatabase();
    return sqlAll(
      "SELECT * FROM students WHERE class=? AND status='active' ORDER BY first_name",
      [cls]
    );
  },

  bulkMarkStudentAttendance: async (records) => {
    await initDatabase();
    records.forEach(r =>
      sqlRun(
        'INSERT OR REPLACE INTO student_attendance(student_id,date,status,term,academic_year,notes) VALUES(?,?,?,?,?,?)',
        [r.student_id, r.date, r.status, r.term || '', r.academic_year || '', r.notes || '']
      )
    );
    return { success: true };
  },

  getStaffAttendanceByDate: async (date) => {
    await initDatabase();
    return sqlAll(
      `SELECT sa.*, s.first_name||' '||s.last_name AS staff_name, s.staff_id AS staff_code, s.role
       FROM staff_attendance sa JOIN staff s ON sa.staff_id=s.id WHERE sa.date=?`,
      [date]
    );
  },

  bulkMarkStaffAttendance: async (records) => {
    await initDatabase();
    records.forEach(r =>
      sqlRun(
        'INSERT OR REPLACE INTO staff_attendance(staff_id,date,status,time_in,time_out,notes) VALUES(?,?,?,?,?,?)',
        [r.staff_id, r.date, r.status, r.time_in || '', r.time_out || '', r.notes || '']
      )
    );
    return { success: true };
  },

  // ── INVENTORY ───────────────────────────────────────────────────────────────
  getInventory: async () => {
    await initDatabase();
    return sqlAll('SELECT * FROM inventory ORDER BY item_name');
  },

  createInventoryItem: async (data) => {
    await initDatabase();
    const id = sqlRun(
      `INSERT INTO inventory (item_name,category,quantity,unit,unit_price,supplier,location,low_stock_threshold,notes)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [data.item_name, data.category || '', data.quantity || 0, data.unit || 'unit',
       data.unit_price || 0, data.supplier || '', data.location || '',
       data.low_stock_threshold || 5, data.notes || '']
    );
    return { success: true, id };
  },

  updateInventoryItem: async ({ id, ...data }) => {
    await initDatabase();
    const f = Object.keys(data).map(k => `${k}=?`).join(',');
    sqlRun(`UPDATE inventory SET ${f},updated_at=datetime('now') WHERE id=?`, [...Object.values(data), id]);
    return { success: true };
  },

  adjustStock: async ({ id, delta, note }) => {
    await initDatabase();
    const item = sqlGet('SELECT * FROM inventory WHERE id=?', [id]);
    const newQty = Math.max(0, (item?.quantity || 0) + delta);
    sqlRun("UPDATE inventory SET quantity=?,updated_at=datetime('now') WHERE id=?", [newQty, id]);
    sqlRun(
      'INSERT INTO inventory_log(item_id,action,quantity,note) VALUES(?,?,?,?)',
      [id, delta > 0 ? 'add' : 'remove', Math.abs(delta), note || '']
    );
    return { success: true, new_quantity: newQty };
  },

  deleteInventoryItem: async (id) => {
    await initDatabase();
    sqlRun('DELETE FROM inventory WHERE id=?', [id]);
    return { success: true };
  },

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  getDashboardStats: async () => {
    await initDatabase();
    const today = new Date().toISOString().split('T')[0];
    return {
      totalStudents:  sqlGet("SELECT COUNT(*) AS c FROM students WHERE status='active'")?.c || 0,
      totalStaff:     sqlGet("SELECT COUNT(*) AS c FROM staff WHERE status='active'")?.c || 0,
      todayPayments:  sqlGet('SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE paid_date=?', [today])?.t || 0,
      totalPayments:  sqlGet('SELECT COALESCE(SUM(amount),0) AS t FROM payments')?.t || 0,
      monthSales:     sqlGet("SELECT COALESCE(SUM(total_price),0) AS t FROM sales WHERE strftime('%Y-%m',sale_date)=strftime('%Y-%m','now')")?.t || 0,
      lowStockItems:  sqlGet('SELECT COUNT(*) AS c FROM inventory WHERE quantity <= low_stock_threshold')?.c || 0,
      recentPayments: sqlAll(`SELECT p.*, s.first_name||' '||s.last_name AS student_name FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC LIMIT 5`),
    };
  },

  // ── FEE TYPES ───────────────────────────────────────────────────────────────
  getFees: async () => {
    await initDatabase();
    const fees = sqlAll('SELECT * FROM fee_types ORDER BY created_at DESC');
    return fees.map(fee => {
      const classRows = sqlAll(
        'SELECT class_name, amount FROM fee_class_amounts WHERE fee_type_id=?',
        [fee.id]
      );
      const classAmounts = {};
      classRows.forEach(r => { classAmounts[r.class_name] = r.amount; });
      return { ...fee, classAmounts };
    });
  },

  createFee: async (data) => {
    await initDatabase();
    const id = sqlRun(
      `INSERT INTO fee_types (name,amount,due_date,term,academic_year,target_class,description)
       VALUES(?,?,?,?,?,?,?)`,
      [data.name, data.amount, data.due_date || '', data.term || '',
       data.academic_year || '', data.target_class || 'All Classes', data.description || '']
    );
    if (data.classAmounts && typeof data.classAmounts === 'object') {
      Object.entries(data.classAmounts).forEach(([cls, amt]) => {
        if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
          sqlRun(
            'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
            [id, cls, parseFloat(amt)]
          );
        }
      });
    }
    return { success: true, id };
  },

  updateFee: async ({ id, classAmounts, ...data }) => {
    await initDatabase();
    if (Object.keys(data).length) {
      const f = Object.keys(data).map(k => `${k}=?`).join(',');
      sqlRun(`UPDATE fee_types SET ${f} WHERE id=?`, [...Object.values(data), id]);
    }
    if (classAmounts && typeof classAmounts === 'object') {
      sqlRun('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
      Object.entries(classAmounts).forEach(([cls, amt]) => {
        if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
          sqlRun(
            'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
            [id, cls, parseFloat(amt)]
          );
        }
      });
    }
    return { success: true };
  },

  deleteFee: async (id) => {
    await initDatabase();
    sqlRun('DELETE FROM student_payments WHERE fee_type_id=?', [id]);
    sqlRun('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
    sqlRun('DELETE FROM fee_types WHERE id=?', [id]);
    return { success: true };
  },

  getFeeAmountForStudent: async ({ feeTypeId, studentClass }) => {
    await initDatabase();
    const override = sqlGet(
      'SELECT amount FROM fee_class_amounts WHERE fee_type_id=? AND class_name=?',
      [feeTypeId, studentClass]
    );
    if (override) return { amount: override.amount };
    const fee = sqlGet('SELECT amount FROM fee_types WHERE id=?', [feeTypeId]);
    return { amount: fee?.amount || 0 };
  },

  // ── STUDENT PAYMENTS (per fee) ───────────────────────────────────────────────
  getStudentPaymentsByFee: async ({ studentId, feeTypeId }) => {
    await initDatabase();
    return sqlAll(
      `SELECT sp.* FROM student_payments sp
       WHERE sp.student_id=? AND sp.fee_type_id=?
       ORDER BY sp.payment_date ASC, sp.created_at ASC`,
      [studentId, feeTypeId]
    );
  },

  createStudentPayment: async (data) => {
    await initDatabase();
    const count = sqlGet('SELECT COUNT(*) as c FROM student_payments');
    const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
    const id = sqlRun(
      `INSERT INTO student_payments (receipt_number,student_id,fee_type_id,amount_paid,payment_method,payment_date,notes)
       VALUES(?,?,?,?,?,?,?)`,
      [rn, data.student_id, data.fee_type_id, data.amount_paid,
       data.payment_method || 'cash',
       data.payment_date || new Date().toISOString().split('T')[0],
       data.notes || '']
    );
    return { success: true, id, receipt_number: rn };
  },

  deleteStudentPayment: async (id) => {
    await initDatabase();
    sqlRun('DELETE FROM student_payments WHERE id=?', [id]);
    return { success: true };
  },

  // ── BACKUP / RESTORE ────────────────────────────────────────────────────────
  backupDatabase: async () => {
    try {
      await initDatabase();
      const data = db.export();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TEA_backup_${Date.now()}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  restoreDatabase: async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) { resolve({ success: false }); return; }
        try {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          // Save the raw bytes to localStorage directly
          const base64 = btoa(String.fromCharCode(...bytes));
          localStorage.setItem(DB_KEY, base64);
          // Reload the DB from localStorage
          const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
          db = new SQL.Database(bytes);
          initPromise = Promise.resolve();
          resolve({ success: true });
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  },
};

