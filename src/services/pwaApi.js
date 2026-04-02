import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

// ─── DB singleton ───────────────────────────────────────────────
let db = null;
let initPromise = null;
const DB_FILENAME = 'tea_school_final.db'; // New name to ensure a fresh start

async function requestPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[DB] Persistence status: ${isPersisted}`);
  }
}

// ─── Init Database ───────────────────────────────────────────────
export const initDatabase = async () => {
  if (typeof window !== 'undefined' && window.api) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await requestPersistence();
    const sqlite3 = await sqlite3InitModule();

    if (sqlite3.opfs) {
      db = new sqlite3.oo1.OpfsDb(DB_FILENAME);
    } else {
      db = new sqlite3.oo1.DB(DB_FILENAME, 'ct');
    }

    db.exec('PRAGMA foreign_keys = ON;');

    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'admin', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, admission_number TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, middle_name TEXT, last_name TEXT NOT NULL, date_of_birth TEXT, gender TEXT, class TEXT, section TEXT, guardian_name TEXT, guardian_phone TEXT, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, role TEXT NOT NULL, department TEXT, phone TEXT, email TEXT, bank_name TEXT, account_number TEXT, bank_branch TEXT, basic_salary REAL DEFAULT 0, hire_date TEXT DEFAULT (date('now')), status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS fee_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount REAL NOT NULL, term TEXT, academic_year TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS student_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, fee_type_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT DEFAULT 'cash', payment_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, item_name TEXT NOT NULL, category TEXT, quantity INTEGER DEFAULT 0, unit_price REAL DEFAULT 0, low_stock_threshold INTEGER DEFAULT 5, created_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_number TEXT UNIQUE NOT NULL, item_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, total_price REAL NOT NULL, sale_date TEXT DEFAULT (date('now')));
    `);

    const settings = [
      ['admission_counter', '1000'],
      ['admission_prefix', 'TEA'],
      ['school_name', 'The Equilibrium Academy'],
      ['current_year', '2024/2025']
    ];
    settings.forEach(([k, v]) => {
      db.exec({ sql: 'INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)', bind: [k, v] });
    });

    db.exec("INSERT OR IGNORE INTO users (username,password,role) VALUES('admin','admin123','admin')");
    console.log('✅ TEA PWA Database Fully Initialized');
  })();
  return initPromise;
};

// ─── Query Helpers ───────────────────────────────────────────────
const sqlAll = async (sql, params = []) => {
  await initDatabase();
  const rows = [];
  db.exec({ sql, bind: params, rowMode: 'object', callback: r => rows.push({ ...r }) });
  return rows;
};

const sqlGet = async (sql, params = []) => {
  const rows = await sqlAll(sql, params);
  return (rows && rows.length > 0) ? rows[0] : null;
};

const sqlRun = async (sql, params = []) => {
  await initDatabase();
  db.exec({ sql, bind: params });
  let lastId = null;
  db.exec({ sql: 'SELECT last_insert_rowid() as id', rowMode: 'object', callback: r => { lastId = r.id; } });
  return lastId;
};

// ─── pwaApi (THE COMPLETE BRIDGE) ────────────────────────────────
export const pwaApi = {
  // AUTH
  login: async (d) => await sqlGet("SELECT * FROM users WHERE username=? AND password=?", [d.username.toLowerCase().trim(), d.password]),
  changePassword: (d) => sqlRun("UPDATE users SET password=? WHERE id=?", [d.newPassword, d.userId]),

  // DASHBOARD
  getDashboardStats: async () => {
    const students = await sqlGet("SELECT COUNT(*) as c FROM students WHERE status='active'");
    const staff = await sqlGet("SELECT COUNT(*) as c FROM staff WHERE status='active'");
    const totalPayments = await sqlGet("SELECT SUM(amount_paid) as s FROM student_payments");
    const todayPayments = await sqlGet("SELECT SUM(amount_paid) as s FROM student_payments WHERE payment_date = date('now')");
    const lowStock = await sqlGet("SELECT COUNT(*) as c FROM inventory WHERE quantity <= low_stock_threshold");
    const recent = await sqlAll(`
        SELECT p.*, (s.first_name || ' ' || s.last_name) as student_name 
        FROM student_payments p 
        JOIN students s ON p.student_id = s.id 
        ORDER BY p.payment_date DESC LIMIT 5
    `);
    return {
      totalStudents: students?.c || 0,
      totalStaff: staff?.c || 0,
      totalPayments: totalPayments?.s || 0,
      todayPayments: todayPayments?.s || 0,
      lowStockItems: lowStock?.c || 0,
      recentPayments: recent || []
    };
  },

  // SETTINGS
  getSettings: async () => {
    const rows = await sqlAll('SELECT * FROM settings');
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  },
  saveSettings: async (settingsObj) => {
    for (const [key, value] of Object.entries(settingsObj)) {
      await sqlRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
    return { success: true };
  },

  // STUDENTS
  getStudents: () => sqlAll('SELECT * FROM students ORDER BY id DESC'),
  createStudent: async (s) => {
    const settings = await pwaApi.getSettings();
    const prefix = settings.admission_prefix || 'TEA';
    const counter = parseInt(settings.admission_counter) || 1000;
    const nextCounter = counter + 1;
    const admissionNumber = `${prefix}/${new Date().getFullYear()}/${nextCounter}`;
    const id = await sqlRun(`INSERT INTO students (admission_number, first_name, last_name, class, status) VALUES (?,?,?,?,?)`,
      [admissionNumber, s.first_name, s.last_name, s.class, 'active']);
    await sqlRun("UPDATE settings SET value = ? WHERE key = 'admission_counter'", [nextCounter.toString()]);
    return { success: true, id, admission_number: admissionNumber };
  },
  updateStudent: (s) => sqlRun(`UPDATE students SET first_name=?, last_name=?, class=?, status=? WHERE id=?`, [s.first_name, s.last_name, s.class, s.status, s.id]),
  deleteStudent: (id) => sqlRun("UPDATE students SET status = 'inactive' WHERE id = ?", [id]),

  // STAFF
  getStaff: () => sqlAll("SELECT * FROM staff ORDER BY id DESC"),
  createStaff: async (s) => {
    const countRow = await sqlGet('SELECT COUNT(*) as c FROM staff');
    const staffId = `STF/${((countRow?.c || 0) + 1).toString().padStart(3, '0')}`;
    const id = await sqlRun(`INSERT INTO staff (staff_id, first_name, last_name, role, status) VALUES (?,?,?,?,?)`, [staffId, s.first_name, s.last_name, s.role, 'active']);
    return { success: true, id, staff_id: staffId };
  },
  updateStaff: (s) => sqlRun(`UPDATE staff SET first_name=?, last_name=?, role=?, status=? WHERE id=?`, [s.first_name, s.last_name, s.role, s.status, s.id]),
  deleteStaff: (id) => sqlRun("DELETE FROM staff WHERE id = ?", [id]),

  // PAYMENTS & FEES
  getFees: () => sqlAll("SELECT * FROM fee_types ORDER BY id DESC"),
  getPayments: () => sqlAll(`
    SELECT p.*, s.first_name, s.last_name, f.name as fee_name 
    FROM student_payments p 
    JOIN students s ON p.student_id = s.id 
    JOIN fee_types f ON p.fee_type_id = f.id 
    ORDER BY p.id DESC
  `),
  createPayment: async (p) => {
    const id = await sqlRun(`INSERT INTO student_payments (receipt_number, student_id, fee_type_id, amount_paid, payment_method, notes) VALUES (?,?,?,?,?,?)`,
      [p.receipt_number, p.student_id, p.fee_id, p.amount_paid, p.method, p.notes || '']);
    return { success: true, id };
  },
  deletePayment: (id) => sqlRun("DELETE FROM student_payments WHERE id = ?", [id]),

  // INVENTORY
  getInventory: () => sqlAll('SELECT * FROM inventory ORDER BY item_name ASC'),
  adjustStock: (d) => sqlRun('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [d.amount, d.id])
};
