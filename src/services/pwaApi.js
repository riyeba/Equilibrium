import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db = null;
let initPromise = null;

export const initDatabase = async () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        const sqlite3 = await sqlite3InitModule();
        const pool = await sqlite3.installOpfsSAHPool();
        db = new pool.OpfsSAHPoolDb('tea_school.db');

        db.exec(`
      PRAGMA foreign_keys = ON;
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

        db.exec("INSERT OR IGNORE INTO users (username,password,role) VALUES('admin','admin123','admin')");
        const defaultSettings = [
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
        defaultSettings.forEach(([k, v]) => db.exec({ sql: 'INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', bind: [k, v] }));
    })();
    return initPromise;
};

// ASYNC helper: This makes sure the DB is ready before every query
const all = async (sql, params = []) => {
    await initDatabase();
    const rows = [];
    db.exec({ sql, bind: params, rowMode: 'object', callback: (r) => rows.push(r) });
    return rows;
};

export const pwaApi = {
    login: async (d) => {
        const r = await all("SELECT * FROM users WHERE username=? AND password=?", [d.username, d.password]);
        return r.length ? { success: true, user: r[0] } : { success: false };
    },
    getSettings: async () => {
        const r = await all("SELECT * FROM settings");
        return r.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
    },
    saveSettings: async (d) => {
        await initDatabase();
        Object.entries(d).forEach(([k, v]) => db.exec({ sql: "INSERT OR REPLACE INTO settings(key, value) VALUES(?,?)", bind: [k, v] }));
        return { success: true };
    },
    getStudents: async () => await all("SELECT * FROM students ORDER BY id DESC"),
    createStudent: async (d) => {
        await initDatabase();
        db.exec({
            sql: "INSERT INTO students (admission_number, first_name, middle_name, last_name, class, section, status) VALUES (?,?,?,?,?,?,'active')",
            bind: [d.admission_number, d.first_name, d.middle_name, d.last_name, d.class, d.section]
        });
        return { success: true };
    },
    updateStudent: async (d) => {
        await initDatabase();
        db.exec({
            sql: "UPDATE students SET first_name=?, middle_name=?, last_name=?, class=?, section=? WHERE id=?",
            bind: [d.first_name, d.middle_name, d.last_name, d.class, d.section, d.id]
        });
        return { success: true };
    },
    getStaff: async () => await all("SELECT * FROM staff ORDER BY id DESC"),
    createStaff: async (d) => {
        await initDatabase();
        db.exec({
            sql: "INSERT INTO staff (staff_id, first_name, last_name, role, status) VALUES (?,?,?,?,'active')",
            bind: [d.staff_id, d.first_name, d.last_name, d.role]
        });
        return { success: true };
    },
    getPayments: async () => await all("SELECT * FROM student_payments ORDER BY id DESC"),
    getDashboardStats: async () => {
        const s = await all("SELECT COUNT(*) as c FROM students");
        const st = await all("SELECT COUNT(*) as c FROM staff");
        return {
            totalStudents: s[0]?.c || 0,
            totalStaff: st[0]?.c || 0,
            todayPayments: 0,
            totalPayments: 0,
            monthSales: 0,
            lowStockItems: 0,
            recentPayments: []
        };
    },
    // Placeholders to keep UI from crashing
    getSales: async () => [],
    getSubjects: async () => [],
    getInventory: async () => [],
    getFees: async () => [],
    getPayroll: async () => [],
    getStudentAttendanceByDate: async () => [],
    getStaffAttendanceByDate: async () => [],
    backupDatabase: async () => ({ success: true }),
};
