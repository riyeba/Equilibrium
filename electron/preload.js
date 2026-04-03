const { contextBridge, ipcRenderer } = require('electron');

// Generic helpers that talk to the 3 generic handlers in main.js
const all = (sql, params = []) => ipcRenderer.invoke('sql-all', { sql, params });
const get = (sql, params = []) => ipcRenderer.invoke('sql-get', { sql, params });
const run = (sql, params = []) => ipcRenderer.invoke('sql-run', { sql, params });

contextBridge.exposeInMainWorld('api', {

    // ── AUTH ────────────────────────────────────────────────────────────────────
    login: async ({ username, password }) => {
        const u = await get('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
        return u ? { success: true, user: { id: u.id, username: u.username, role: u.role } } : { success: false };
    },
    changePassword: async ({ userId, newPassword }) => {
        await run('UPDATE users SET password=? WHERE id=?', [newPassword, userId]);
        return { success: true };
    },

    // ── SETTINGS ────────────────────────────────────────────────────────────────
    getSettings: async () => {
        const rows = await all('SELECT key, value FROM settings');
        return Object.fromEntries(rows.map(r => [r.key, r.value]));
    },
    saveSettings: async (updates) => {
        for (const [k, v] of Object.entries(updates)) {
            await run('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)', [k, v]);
        }
        return { success: true };
    },

    // ── STUDENTS ────────────────────────────────────────────────────────────────
    getStudents: () => all('SELECT * FROM students ORDER BY created_at DESC'),
    getStudent: (id) => get('SELECT * FROM students WHERE id=?', [id]),

    createStudent: async (data) => {
        const ctr = await get("SELECT value FROM settings WHERE key='admission_counter'");
        const pfx = await get("SELECT value FROM settings WHERE key='admission_prefix'");
        const num = parseInt(ctr.value) + 1;
        await run("UPDATE settings SET value=? WHERE key='admission_counter'", [num.toString()]);
        const year = new Date().getFullYear();
        const admNo = `${pfx.value}/${year}/${String(num).padStart(3, '0')}`;
        const id = await run(
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
        const f = Object.keys(data).map(k => `${k}=?`).join(',');
        await run(`UPDATE students SET ${f} WHERE id=?`, [...Object.values(data), id]);
        return { success: true };
    },

    deleteStudent: async (id) => {
        await run('UPDATE students SET status=? WHERE id=?', ['inactive', id]);
        return { success: true };
    },

    // ── STAFF ───────────────────────────────────────────────────────────────────
    getStaff: () => all('SELECT * FROM staff ORDER BY created_at DESC'),

    createStaff: async (data) => {
        const count = await get('SELECT COUNT(*) as c FROM staff');
        const staffId = `STF/${String((count?.c || 0) + 1).padStart(4, '0')}`;
        const id = await run(
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
        const f = Object.keys(data).map(k => `${k}=?`).join(',');
        await run(`UPDATE staff SET ${f} WHERE id=?`, [...Object.values(data), id]);
        return { success: true };
    },

    // ── LEGACY PAYMENTS ─────────────────────────────────────────────────────────
    getPayments: () => all(
        `SELECT p.*, s.first_name||' '||s.last_name AS student_name, s.admission_number
     FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC`
    ),

    createPayment: async (data) => {
        const count = await get('SELECT COUNT(*) as c FROM payments');
        const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
        const id = await run(
            `INSERT INTO payments (receipt_number,student_id,amount,payment_type,payment_method,term,academic_year,description,paid_date)
       VALUES(?,?,?,?,?,?,?,?,?)`,
            [rn, data.student_id, data.amount, data.payment_type,
                data.payment_method || 'cash', data.term || '', data.academic_year || '',
                data.description || '', data.paid_date || new Date().toISOString().split('T')[0]]
        );
        return { success: true, id, receipt_number: rn };
    },

    // ── SALES ───────────────────────────────────────────────────────────────────
    getSales: () => all(
        `SELECT sl.*, st.first_name||' '||st.last_name AS staff_name
     FROM sales sl LEFT JOIN staff st ON sl.staff_id=st.id ORDER BY sl.created_at DESC`
    ),

    createSale: async (data) => {
        const count = await get('SELECT COUNT(*) as c FROM sales');
        const sn = `SL/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
        const total = (data.quantity || 1) * (data.unit_price || 0);
        await run(
            `INSERT INTO sales (sale_number,staff_id,item_name,quantity,unit_price,total_price,category,sale_date,notes)
       VALUES(?,?,?,?,?,?,?,?,?)`,
            [sn, data.staff_id || null, data.item_name, data.quantity || 1,
                data.unit_price || 0, total, data.category || '',
                data.sale_date || new Date().toISOString().split('T')[0], data.notes || '']
        );
        return { success: true };
    },

    // ── SUBJECTS ────────────────────────────────────────────────────────────────
    getSubjects: () => all('SELECT * FROM subjects ORDER BY name'),

    createSubject: async (data) => {
        const id = await run(
            'INSERT INTO subjects(name,code,class,max_score) VALUES(?,?,?,?)',
            [data.name, data.code, data.class || '', data.max_score || 100]
        );
        return { success: true, id };
    },

    deleteSubject: async (id) => {
        await run('DELETE FROM subjects WHERE id=?', [id]);
        return { success: true };
    },

    // ── GRADES ──────────────────────────────────────────────────────────────────
    getGradesByStudent: ({ studentId, term, year }) => all(
        `SELECT g.*, sub.name AS subject_name, sub.code AS subject_code
     FROM grades g JOIN subjects sub ON g.subject_id=sub.id
     WHERE g.student_id=? AND g.term=? AND g.academic_year=?`,
        [studentId, term, year]
    ),

    upsertGrade: async (data) => {
        const total = (data.ca_score || 0) + (data.exam_score || 0);
        let grade = 'F', remark = 'Weak';
        if (total >= 71) { grade = 'A'; remark = 'Excellent'; }
        else if (total >= 61) { grade = 'B'; remark = 'Very Good'; }
        else if (total >= 51) { grade = 'C'; remark = 'Good'; }
        else if (total >= 41) { grade = 'D'; remark = 'Fairly Good'; }
        await run(
            `INSERT OR REPLACE INTO grades (student_id,subject_id,term,academic_year,ca_score,exam_score,total_score,grade,remark,teacher_comment)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
            [data.student_id, data.subject_id, data.term, data.academic_year,
            data.ca_score || 0, data.exam_score || 0, total, grade, remark, data.teacher_comment || '']
        );
        return { success: true, grade, remark, total };
    },

    // ── PAYROLL ─────────────────────────────────────────────────────────────────
    getPayroll: () => all(
        `SELECT p.*, s.first_name||' '||s.last_name AS staff_name,
            s.staff_id AS staff_code, s.bank_name, s.account_number, s.phone, s.email
     FROM payroll p JOIN staff s ON p.staff_id=s.id ORDER BY p.year DESC, p.month DESC`
    ),

    generatePayroll: async ({ month, year }) => {
        const allStaff = await all("SELECT * FROM staff WHERE status='active'");
        for (const s of allStaff) {
            const exists = await get(
                'SELECT id FROM payroll WHERE staff_id=? AND month=? AND year=?',
                [s.id, month, year]
            );
            if (!exists) {
                await run(
                    `INSERT INTO payroll (staff_id,month,year,basic_salary,allowances,tax_deduction,penalty_deduction,other_deduction,net_salary,status)
           VALUES(?,?,?,?,0,0,0,0,?,'pending')`,
                    [s.id, month, year, s.basic_salary || 0, s.basic_salary || 0]
                );
            }
        }
        return { success: true, count: allStaff.length };
    },

    updatePayroll: async ({ id, ...data }) => {
        const net = (data.basic_salary || 0) + (data.allowances || 0)
            - (data.tax_deduction || 0) - (data.penalty_deduction || 0) - (data.other_deduction || 0);
        await run(
            'UPDATE payroll SET basic_salary=?,allowances=?,tax_deduction=?,penalty_deduction=?,other_deduction=?,net_salary=?,status=?,notes=? WHERE id=?',
            [data.basic_salary || 0, data.allowances || 0, data.tax_deduction || 0,
            data.penalty_deduction || 0, data.other_deduction || 0,
                net, data.status || 'pending', data.notes || '', id]
        );
        return { success: true, net };
    },

    // ── ATTENDANCE ──────────────────────────────────────────────────────────────
    getStudentAttendanceByDate: (date) => all(
        `SELECT sa.*, s.first_name||' '||s.last_name AS student_name, s.admission_number, s.class
     FROM student_attendance sa JOIN students s ON sa.student_id=s.id WHERE sa.date=?`,
        [date]
    ),

    getStudentsByClass: (cls) => all(
        "SELECT * FROM students WHERE class=? AND status='active' ORDER BY first_name",
        [cls]
    ),

    bulkMarkStudentAttendance: async (records) => {
        for (const r of records) {
            await run(
                'INSERT OR REPLACE INTO student_attendance(student_id,date,status,term,academic_year,notes) VALUES(?,?,?,?,?,?)',
                [r.student_id, r.date, r.status, r.term || '', r.academic_year || '', r.notes || '']
            );
        }
        return { success: true };
    },

    getStaffAttendanceByDate: (date) => all(
        `SELECT sa.*, s.first_name||' '||s.last_name AS staff_name, s.staff_id AS staff_code, s.role
     FROM staff_attendance sa JOIN staff s ON sa.staff_id=s.id WHERE sa.date=?`,
        [date]
    ),

    bulkMarkStaffAttendance: async (records) => {
        for (const r of records) {
            await run(
                'INSERT OR REPLACE INTO staff_attendance(staff_id,date,status,time_in,time_out,notes) VALUES(?,?,?,?,?,?)',
                [r.staff_id, r.date, r.status, r.time_in || '', r.time_out || '', r.notes || '']
            );
        }
        return { success: true };
    },

    // ── INVENTORY ───────────────────────────────────────────────────────────────
    getInventory: () => all('SELECT * FROM inventory ORDER BY item_name'),

    createInventoryItem: async (data) => {
        const id = await run(
            `INSERT INTO inventory (item_name,category,quantity,unit,unit_price,supplier,location,low_stock_threshold,notes)
       VALUES(?,?,?,?,?,?,?,?,?)`,
            [data.item_name, data.category || '', data.quantity || 0, data.unit || 'unit',
            data.unit_price || 0, data.supplier || '', data.location || '',
            data.low_stock_threshold || 5, data.notes || '']
        );
        return { success: true, id };
    },

    updateInventoryItem: async ({ id, ...data }) => {
        const f = Object.keys(data).map(k => `${k}=?`).join(',');
        await run(`UPDATE inventory SET ${f},updated_at=datetime('now') WHERE id=?`, [...Object.values(data), id]);
        return { success: true };
    },

    adjustStock: async ({ id, delta, note }) => {
        const item = await get('SELECT * FROM inventory WHERE id=?', [id]);
        const newQty = Math.max(0, (item?.quantity || 0) + delta);
        await run("UPDATE inventory SET quantity=?,updated_at=datetime('now') WHERE id=?", [newQty, id]);
        await run(
            'INSERT INTO inventory_log(item_id,action,quantity,note) VALUES(?,?,?,?)',
            [id, delta > 0 ? 'add' : 'remove', Math.abs(delta), note || '']
        );
        return { success: true, new_quantity: newQty };
    },

    deleteInventoryItem: async (id) => {
        await run('DELETE FROM inventory WHERE id=?', [id]);
        return { success: true };
    },

    // ── DASHBOARD ───────────────────────────────────────────────────────────────
    getDashboardStats: async () => {
        const today = new Date().toISOString().split('T')[0];
        const [students, staff, todayPay, totalPay, monthSales, lowStock, recent] = await Promise.all([
            get("SELECT COUNT(*) AS c FROM students WHERE status='active'"),
            get("SELECT COUNT(*) AS c FROM staff WHERE status='active'"),
            get('SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE paid_date=?', [today]),
            get('SELECT COALESCE(SUM(amount),0) AS t FROM payments'),
            get("SELECT COALESCE(SUM(total_price),0) AS t FROM sales WHERE strftime('%Y-%m',sale_date)=strftime('%Y-%m','now')"),
            get('SELECT COUNT(*) AS c FROM inventory WHERE quantity <= low_stock_threshold'),
            all(`SELECT p.*, s.first_name||' '||s.last_name AS student_name FROM payments p JOIN students s ON p.student_id=s.id ORDER BY p.created_at DESC LIMIT 5`),
        ]);
        return {
            totalStudents: students?.c || 0,
            totalStaff: staff?.c || 0,
            todayPayments: todayPay?.t || 0,
            totalPayments: totalPay?.t || 0,
            monthSales: monthSales?.t || 0,
            lowStockItems: lowStock?.c || 0,
            recentPayments: recent,
        };
    },

    // ── FEE TYPES ───────────────────────────────────────────────────────────────
    getFees: async () => {
        const fees = await all('SELECT * FROM fee_types ORDER BY created_at DESC');
        for (const fee of fees) {
            const classRows = await all(
                'SELECT class_name, amount FROM fee_class_amounts WHERE fee_type_id=?',
                [fee.id]
            );
            fee.classAmounts = {};
            classRows.forEach(r => { fee.classAmounts[r.class_name] = r.amount; });
        }
        return fees;
    },

    createFee: async (data) => {
        const id = await run(
            `INSERT INTO fee_types (name,amount,due_date,term,academic_year,target_class,description)
       VALUES(?,?,?,?,?,?,?)`,
            [data.name, data.amount, data.due_date || '', data.term || '',
            data.academic_year || '', data.target_class || 'All Classes', data.description || '']
        );
        if (data.classAmounts && typeof data.classAmounts === 'object') {
            for (const [cls, amt] of Object.entries(data.classAmounts)) {
                if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
                    await run(
                        'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
                        [id, cls, parseFloat(amt)]
                    );
                }
            }
        }
        return { success: true, id };
    },

    updateFee: async ({ id, classAmounts, ...data }) => {
        if (Object.keys(data).length) {
            const f = Object.keys(data).map(k => `${k}=?`).join(',');
            await run(`UPDATE fee_types SET ${f} WHERE id=?`, [...Object.values(data), id]);
        }
        if (classAmounts && typeof classAmounts === 'object') {
            await run('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
            for (const [cls, amt] of Object.entries(classAmounts)) {
                if (amt !== '' && amt !== null && !isNaN(parseFloat(amt))) {
                    await run(
                        'INSERT OR REPLACE INTO fee_class_amounts (fee_type_id,class_name,amount) VALUES(?,?,?)',
                        [id, cls, parseFloat(amt)]
                    );
                }
            }
        }
        return { success: true };
    },

    deleteFee: async (id) => {
        await run('DELETE FROM student_payments WHERE fee_type_id=?', [id]);
        await run('DELETE FROM fee_class_amounts WHERE fee_type_id=?', [id]);
        await run('DELETE FROM fee_types WHERE id=?', [id]);
        return { success: true };
    },

    getFeeAmountForStudent: async ({ feeTypeId, studentClass }) => {
        const override = await get(
            'SELECT amount FROM fee_class_amounts WHERE fee_type_id=? AND class_name=?',
            [feeTypeId, studentClass]
        );
        if (override) return { amount: override.amount };
        const fee = await get('SELECT amount FROM fee_types WHERE id=?', [feeTypeId]);
        return { amount: fee?.amount || 0 };
    },

    // ── STUDENT PAYMENTS (per fee) ───────────────────────────────────────────────
    getStudentPaymentsByFee: ({ studentId, feeTypeId }) => all(
        `SELECT sp.* FROM student_payments sp
     WHERE sp.student_id=? AND sp.fee_type_id=?
     ORDER BY sp.payment_date ASC, sp.created_at ASC`,
        [studentId, feeTypeId]
    ),

    createStudentPayment: async (data) => {
        const count = await get('SELECT COUNT(*) as c FROM student_payments');
        const rn = `RCP/${new Date().getFullYear()}/${String((count?.c || 0) + 1).padStart(5, '0')}`;
        const id = await run(
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
        await run('DELETE FROM student_payments WHERE id=?', [id]);
        return { success: true };
    },

    // ── BACKUP / RESTORE ────────────────────────────────────────────────────────
    backupDatabase: () => ipcRenderer.invoke('db:backup'),
    restoreDatabase: () => ipcRenderer.invoke('db:restore'),
});
