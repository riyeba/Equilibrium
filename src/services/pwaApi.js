import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

// ─── DB singleton ───────────────────────────────────────────────
let db = null;
let initPromise = null;
const DB_FILENAME = 'tea_school.db';

async function requestPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[DB] Persistence status: ${isPersisted}`);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
export const initDatabase = async () => {
  if (typeof window !== 'undefined' && window.api) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await requestPersistence();
    const sqlite3 = await sqlite3InitModule();
    db = new sqlite3.oo1.OpfsDb(DB_FILENAME);

    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(`
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
      CREATE TABLE IF NOT EXISTS student_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, fee_type_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT DEFAULT 'cash', payment_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    `);

    // Migration & Defaults
    try { db.exec(`ALTER TABLE students ADD COLUMN middle_name TEXT`); } catch (e) { }
    db.exec("INSERT OR IGNORE INTO users (username,password,role) VALUES('admin','admin123','admin')");

    const settings = [
      ['school_name', 'The Equilibrium Academy (TEA)'],
      ['school_address', '1, Alagbaa Village, Akinyele Area, Ibadan, Oyo State'],
      ['school_phone', '09043523420, 07063749964'],
      ['school_email', 'theequilibriumacademy@gmail.com'],
      ['current_term', 'First Term'],
      ['current_year', '2024/2025'],
      ['admission_prefix', 'TEA'],
      ['admission_counter', '1000'],
      ['chairman_name', 'Olarinre I.O.'],
    ];
    settings.forEach(([k, v]) => db.exec({ sql: 'INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', bind: [k, v] }));

    console.log('TEA OPFS database ready');
  })();
  return initPromise;
};

// ── Core query helpers ───────────────────────────────────────────────────────
const sqlAll = async (sql, params = []) => {
  await initDatabase();
  const rows = [];
  db.exec({ sql, bind: params, rowMode: 'object', callback: r => rows.push({ ...r }) });
  return rows;
};

const sqlGet = async (sql, params = []) => {
  const rows = await sqlAll(sql, params);
  return rows[0] || null;
};

const sqlRun = async (sql, params = []) => {
  await initDatabase();
  db.exec({ sql, bind: params });
  let lastId = null;
  db.exec({ sql: 'SELECT last_insert_rowid() as id', rowMode: 'object', callback: r => { lastId = r.id; } });
  return lastId;
};

// ── pwaApi ───────────────────────────────────────────────────────────────────
export const pwaApi = {
  // AUTH
  login: async ({ username, password }) => await sqlGet('SELECT * FROM users WHERE username=? AND password=?', [username, password]),
  changePassword: async ({ userId, newPassword }) => { await sqlRun('UPDATE users SET password=? WHERE id=?', [newPassword, userId]); return { success: true }; },

  // DASHBOARD
  getDashboardStats: async () => {
    const students = await sqlGet('SELECT COUNT(*) as c FROM students WHERE status="active"');
    const staff = await sqlGet('SELECT COUNT(*) as c FROM staff WHERE status="active"');
    const totalPayments = await sqlGet('SELECT SUM(amount) as s FROM payments');
    const recentSales = await sqlGet('SELECT SUM(total_price) as s FROM sales WHERE sale_date >= date("now", "-30 days")');
    return {
      studentCount: students?.c || 0,
      staffCount: staff?.c || 0,
      totalPayments: (totalPayments?.s || 0),
      monthlySales: (recentSales?.s || 0)
    };
  },

  // SETTINGS
  getSettings: async () => {
    const rows = await sqlAll('SELECT * FROM settings');
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  },
  updateSetting: async ({ key, value }) => { await sqlRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]); return { success: true }; },

  // STUDENTS
  getStudents: async () => await sqlAll('SELECT * FROM students ORDER BY first_name ASC'),
  addStudent: async (s) => {
    const sql = `INSERT INTO students (admission_number, first_name, middle_name, last_name, date_of_birth, gender, class, section, guardian_name, guardian_phone, guardian_email, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const id = await sqlRun(sql, [s.admission_number, s.first_name, s.middle_name, s.last_name, s.date_of_birth, s.gender, s.class, s.section, s.guardian_name, s.guardian_phone, s.guardian_email, s.address, 'active']);
    return { id, ...s };
  },
  updateStudent: async (s) => {
    const sql = `UPDATE students SET first_name=?, middle_name=?, last_name=?, date_of_birth=?, gender=?, class=?, section=?, guardian_name=?, guardian_phone=?, guardian_email=?, address=?, status=? WHERE id=?`;
    await sqlRun(sql, [s.first_name, s.middle_name, s.last_name, s.date_of_birth, s.gender, s.class, s.section, s.guardian_name, s.guardian_phone, s.guardian_email, s.address, s.status, s.id]);
    return { success: true };
  },

  // STAFF
  getStaff: async () => await sqlAll('SELECT * FROM staff ORDER BY first_name ASC'),
  addStaff: async (st) => {
    const sql = `INSERT INTO staff (staff_id, first_name, last_name, role, department, phone, email, basic_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const id = await sqlRun(sql, [st.staff_id, st.first_name, st.last_name, st.role, st.department, st.phone, st.email, st.basic_salary]);
    return { id, ...st };
  },

  // PAYMENTS & SALES
  getPayments: async () => await sqlAll('SELECT p.*, s.first_name, s.last_name FROM payments p JOIN students s ON p.student_id = s.id'),
  addPayment: async (p) => {
    const sql = `INSERT INTO payments (receipt_number, student_id, amount, payment_type, payment_method, term, academic_year, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const id = await sqlRun(sql, [p.receipt_number, p.student_id, p.amount, p.payment_type, p.payment_method, p.term, p.academic_year, p.description]);
    return { id, ...p };
  },
  getSales: async () => await sqlAll('SELECT * FROM sales ORDER BY sale_date DESC'),
  addSale: async (s) => {
    const sql = `INSERT INTO sales (sale_number, staff_id, item_name, quantity, unit_price, total_price, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const id = await sqlRun(sql, [s.sale_number, s.staff_id, s.item_name, s.quantity, s.unit_price, s.total_price, s.category, s.notes]);
    return { id, ...s };
  },

  // ACADEMICS (SUBJECTS & GRADES)
  getSubjects: async () => await sqlAll('SELECT * FROM subjects'),
  addSubject: async (sub) => { await sqlRun('INSERT INTO subjects (name, code, class, max_score) VALUES (?, ?, ?, ?)', [sub.name, sub.code, sub.class, sub.max_score]); return { success: true }; },
  getGrades: async (studentId) => await sqlAll('SELECT g.*, s.name as subject_name FROM grades g JOIN subjects s ON g.subject_id = s.id WHERE g.student_id = ?', [studentId]),
  saveGrade: async (g) => {
    const sql = `INSERT OR REPLACE INTO grades (student_id, subject_id, term, academic_year, ca_score, exam_score, total_score, grade, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await sqlRun(sql, [g.student_id, g.subject_id, g.term, g.academic_year, g.ca_score, g.exam_score, g.total_score, g.grade, g.remark]);
    return { success: true };
  },

  // ATTENDANCE
  getAttendance: async (date) => await sqlAll('SELECT * FROM student_attendance WHERE date = ?', [date]),
  markAttendance: async (att) => {
    const sql = `INSERT OR REPLACE INTO student_attendance (student_id, date, status, term, academic_year, notes) VALUES (?, ?, ?, ?, ?, ?)`;
    await sqlRun(sql, [att.student_id, att.date, att.status, att.term, att.academic_year, att.notes]);
    return { success: true };
  },

  // INVENTORY
  getInventory: async () => await sqlAll('SELECT * FROM inventory'),
  updateInventory: async (item) => {
    const sql = `UPDATE inventory SET item_name=?, category=?, quantity=?, unit=?, unit_price=?, low_stock_threshold=?, notes=?, updated_at=datetime('now') WHERE id=?`;
    await sqlRun(sql, [item.item_name, item.category, item.quantity, item.unit, item.unit_price, item.low_stock_threshold, item.notes, item.id]);
    return { success: true };
  },

  // BACKUP
  downloadDatabase: async () => {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(DB_FILENAME);
      const file = await fileHandle.getFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TEA_Backup_${new Date().toISOString().split('T')[0]}.db`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }
};
