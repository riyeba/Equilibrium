const { contextBridge, ipcRenderer } = require('electron');

// Helper functions to talk to the generic handlers in main.js
const run = (sql, params = []) => ipcRenderer.invoke('sql-run', { sql, params });
const get = (sql, params = []) => ipcRenderer.invoke('sql-get', { sql, params });
const all = (sql, params = []) => ipcRenderer.invoke('sql-all', { sql, params });

contextBridge.exposeInMainWorld('api', {
    // AUTH
    login: (d) => get("SELECT * FROM users WHERE username=? AND password=?", [d.username, d.password]),
    changePassword: (d) => run("UPDATE users SET password=? WHERE id=?", [d.newPassword, d.userId]),

    // SETTINGS
    getSettings: async () => {
        const rows = await all('SELECT * FROM settings');
        return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    },
    saveSettings: async (settingsObject) => {
        for (const [key, value] of Object.entries(settingsObject)) {
            await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }
        return { success: true };
    },

    // DASHBOARD
    getDashboardStats: async () => {
        // FIXED: Using single quotes for string literals 'active' and 'now'
        const students = await get("SELECT COUNT(*) as c FROM students WHERE status='active'");
        const staff = await get("SELECT COUNT(*) as c FROM staff WHERE status='active'");
        const totalPayments = await get("SELECT SUM(amount) as s FROM payments");
        const todayPayments = await get("SELECT SUM(amount) as s FROM payments WHERE paid_date = date('now')");
        const sales = await get("SELECT SUM(total_price) as s FROM sales");
        const lowStock = await get("SELECT COUNT(*) as c FROM inventory WHERE quantity <= low_stock_threshold");
        const recent = await all(`
            SELECT p.*, (s.first_name || ' ' || s.last_name) as student_name 
            FROM payments p 
            JOIN students s ON p.student_id = s.id 
            ORDER BY p.paid_date DESC LIMIT 5
        `);

        return {
            totalStudents: students?.c || 0,
            totalStaff: staff?.c || 0,
            totalPayments: totalPayments?.s || 0,
            todayPayments: todayPayments?.s || 0,
            monthSales: sales?.s || 0,
            lowStockItems: lowStock?.c || 0,
            recentPayments: recent || []
        };
    },

    // STUDENTS
    getStudents: () => all('SELECT * FROM students ORDER BY id DESC'),
    getStudent: (id) => get('SELECT * FROM students WHERE id = ?', [id]),

    createStudent: async (s) => {
        try {
            const settingsRows = await all('SELECT * FROM settings');
            const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});




            // FIXED: Safer parsing of prefix and counter to prevent NULL errors
            const prefix = settings.admission_prefix || 'TEA';
            const currentCounter = parseInt(settings.admission_counter) || 1000;
            const nextCounter = currentCounter + 1;

            const fullYear = settings.current_year || new Date().getFullYear().toString();
            const cleanYear = fullYear.split('/')[0].trim();

            // 4. Combine: TEA / 2024 / 1011
            const admissionNumber = `${prefix}/${cleanYear}/${nextCounter}`;

            const sql = `INSERT INTO students (
              admission_number, first_name, middle_name, last_name, date_of_birth, 
              gender, class, section, guardian_name, guardian_phone, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                admissionNumber,
                s.first_name || '',
                s.middle_name || '',
                s.last_name || '',
                s.date_of_birth || '',
                s.gender || '',
                s.class || '',
                s.section || '',
                s.guardian_name || '',
                s.guardian_phone || '',
                'active'
            ];

            const id = await ipcRenderer.invoke('sql-run', { sql, params });

            // Update counter in settings for next student
            await run("UPDATE settings SET value = ? WHERE key = 'admission_counter'", [nextCounter.toString()]);

            return { success: true, id, admission_number: admissionNumber };
        } catch (err) {
            console.error("Create student error:", err);
            return { success: false, error: err.message };
        }
    },

    updateStudent: (s) => run(
        `UPDATE students SET first_name=?, middle_name=?, last_name=?, class=?, section=?, status=? WHERE id=?`,
        [s.first_name, s.middle_name, s.last_name, s.class, s.section, s.status, s.id]
    ),
    deleteStudent: (id) => run("UPDATE students SET status = 'inactive' WHERE id = ?", [id]),

    // STAFF
    // ✅ Updated STAFF section for preload.js
    getStaff: () => all("SELECT * FROM staff ORDER BY id DESC"), // Newest staff at top

    createStaff: async (s) => {
        try {
            // 1. Generate a unique Staff ID (e.g., STF/001)
            const countRow = await get('SELECT COUNT(*) as c FROM staff');
            const nextId = (countRow?.c || 0) + 1;
            const staffId = `STF/${nextId.toString().padStart(3, '0')}`;

            const sql = `INSERT INTO staff (
                staff_id, first_name, last_name, role, department, 
                phone, email, bank_name, account_number, bank_branch, 
                basic_salary, hire_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                staffId, s.first_name, s.last_name, s.role, s.department,
                s.phone, s.email, s.bank_name, s.account_number, s.bank_branch,
                s.basic_salary || 0, s.hire_date, 'active'
            ];

            const id = await ipcRenderer.invoke('sql-run', { sql, params });

            // Return exactly what Staff.jsx is looking for
            return { success: true, id, staff_id: staffId };
        } catch (err) {
            console.error("Create staff error:", err);
            return { success: false, error: err.message };
        }
    },

    updateStaff: async (s) => {
        const sql = `UPDATE staff SET 
            first_name=?, last_name=?, role=?, department=?, phone=?, 
            email=?, bank_name=?, account_number=?, bank_branch=?, 
            basic_salary=?, status=? WHERE id=?`;

        const params = [
            s.first_name, s.last_name, s.role, s.department, s.phone,
            s.email, s.bank_name, s.account_number, s.bank_branch,
            s.basic_salary, s.status, s.id
        ];

        await ipcRenderer.invoke('sql-run', { sql, params });
        return { success: true };
    },

    // PAYMENTS
    getPayments: () => all("SELECT p.*, s.first_name, s.last_name FROM payments p JOIN students s ON p.student_id = s.id"),
    createPayment: (p) => run(
        `INSERT INTO payments (receipt_number, student_id, amount, payment_type, term, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [p.receipt_number, p.student_id, p.amount, p.payment_type, p.term, p.academic_year]
    ),

    // INVENTORY
    getInventory: () => all('SELECT * FROM inventory'),
    adjustStock: (d) => run('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [d.amount, d.id]),

    // BACKUP & RESTORE
    backupDatabase: () => ipcRenderer.invoke('db:backup'),
    restoreDatabase: () => ipcRenderer.invoke('db:restore')
});
