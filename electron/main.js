const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const Database = require('better-sqlite3');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs', 'tea-sms.log');
log.info('TEA SMS starting...');

let mainWindow;
let db;
let dbPath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Equilibrium Management System',
    show: false,
  });
  mainWindow.once('ready-to-show', () => { mainWindow.show(); log.info('Window shown'); });
  if (isDev) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

async function setupDatabase() {
  dbPath = path.join(app.getPath('userData'), 'tea_school.db');
  db = new Database(dbPath);
  log.info('Database connected at', dbPath);
  db.pragma('foreign_keys = ON');

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
    CREATE TABLE IF NOT EXISTS fee_class_amounts (id INTEGER PRIMARY KEY AUTOINCREMENT, fee_type_id INTEGER NOT NULL, class_name TEXT NOT NULL, amount REAL NOT NULL, UNIQUE(fee_type_id, class_name));
    CREATE TABLE IF NOT EXISTS student_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_number TEXT UNIQUE NOT NULL, student_id INTEGER NOT NULL, fee_type_id INTEGER NOT NULL, amount_paid REAL NOT NULL, payment_method TEXT DEFAULT 'cash', payment_date TEXT DEFAULT (date('now')), notes TEXT, created_at TEXT DEFAULT (datetime('now')));
  `);

  try { db.exec(`ALTER TABLE students ADD COLUMN middle_name TEXT`); } catch (e) { }

  const admin = db.prepare('SELECT id FROM users WHERE username=?').get('admin');
  if (!admin) {
    db.prepare("INSERT INTO users (username,password,role) VALUES(?,?,?)").run('admin', 'admin123', 'admin');
  }

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

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)');
  for (const [k, v] of settings) { insertSetting.run(k, v); }
}

function setupIpcHandlers() {
  ipcMain.handle('sql-all', (event, { sql, params = [] }) => {
    try { return db.prepare(sql).all(...params); }
    catch (e) { log.error('sql-all error:', e.message); return []; }
  });

  ipcMain.handle('sql-get', (event, { sql, params = [] }) => {
    try { return db.prepare(sql).get(...params); }
    catch (e) { log.error('sql-get error:', e.message); return null; }
  });

  ipcMain.handle('sql-run', (event, { sql, params = [] }) => {
    try {
      const result = db.prepare(sql).run(...params);
      return result.lastInsertRowid;
    } catch (e) { log.error('sql-run error:', e.message); throw e; }
  });

  ipcMain.handle('db:backup', async () => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: `tea_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      });
      if (filePath) {
        fs.copyFileSync(dbPath, filePath);
        return { success: true };
      }
    } catch (e) { log.error('Backup failed:', e.message); }
    return { success: false };
  });
}

// APP STARTUP
app.whenReady().then(async () => {
  await setupDatabase();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
