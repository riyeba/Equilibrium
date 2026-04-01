


const { contextBridge, ipcRenderer } = require('electron');
const inv = (ch, d) => ipcRenderer.invoke(ch, d);

contextBridge.exposeInMainWorld('api', {
    login: (d) => inv('auth:login', d),
    changePassword: (d) => inv('auth:changePassword', d),
    getSettings: () => inv('settings:get'),
    saveSettings: (d) => inv('settings:set', d),
    getStudents: () => inv('students:getAll'),
    getStudent: (id) => inv('students:getById', id),
    createStudent: (d) => inv('students:create', d),
    updateStudent: (d) => inv('students:update', d),
    deleteStudent: (id) => inv('students:delete', id),
    getStaff: () => inv('staff:getAll'),
    createStaff: (d) => inv('staff:create', d),
    updateStaff: (d) => inv('staff:update', d),
    getPayments: () => inv('payments:getAll'),
    createPayment: (d) => inv('payments:create', d),
    getSales: () => inv('sales:getAll'),
    createSale: (d) => inv('sales:create', d),
    getSubjects: () => inv('subjects:getAll'),
    createSubject: (d) => inv('subjects:create', d),
    deleteSubject: (id) => inv('subjects:delete', id),
    getGradesByStudent: (d) => inv('grades:getByStudent', d),
    upsertGrade: (d) => inv('grades:upsert', d),
    getPayroll: () => inv('payroll:getAll'),
    generatePayroll: (d) => inv('payroll:generate', d),
    updatePayroll: (d) => inv('payroll:update', d),
    getStudentAttendanceByDate: (d) => inv('attendance:students:getByDate', d),
    getStudentsByClass: (c) => inv('attendance:students:byClass', c),
    bulkMarkStudentAttendance: (d) => inv('attendance:students:bulkMark', d),
    getStaffAttendanceByDate: (d) => inv('attendance:staff:getByDate', d),
    bulkMarkStaffAttendance: (d) => inv('attendance:staff:bulkMark', d),
    getInventory: () => inv('inventory:getAll'),
    createInventoryItem: (d) => inv('inventory:create', d),
    updateInventoryItem: (d) => inv('inventory:update', d),
    adjustStock: (d) => inv('inventory:adjustStock', d),
    deleteInventoryItem: (id) => inv('inventory:delete', id),
    getDashboardStats: () => inv('stats:dashboard'),
    // Fee Types
    getFees: () => inv('fees:getAll'),
    createFee: (d) => inv('fees:create', d),
    updateFee: (d) => inv('fees:update', d),
    deleteFee: (id) => inv('fees:delete', id),
    getFeeAmountForStudent: (d) => inv('fees:getAmountForStudent', d),
    // Student Payments (per fee)
    getStudentPaymentsByFee: (d) => inv('stuPayments:getByFee2', d),
    createStudentPayment: (d) => inv('stuPayments:create', d),
    deleteStudentPayment: (id) => inv('stuPayments:delete', id),
    // Backup / Restore
    backupDatabase: () => inv('db:backup'),
    restoreDatabase: () => inv('db:restore'),
});


