/**
 * Storage Layer for Dollarama Shift Scheduler v4.2
 * Handles localStorage persistence, roles, scheduling constraints, and data operations
 */

const Storage = {
    KEYS: {
        EMPLOYEES: 'scheduler_employees',
        SHIFTS: 'scheduler_shifts',
        SCHEDULE: 'scheduler_last_schedule',
        ROLES: 'scheduler_roles',
        SETTINGS: 'scheduler_settings'
    },

    // Default roles
    DEFAULT_ROLES: [
        { id: 1, name: 'ATL', label: 'Manager', color: '#7c3aed', canManage: true },
        { id: 2, name: 'FullTime', label: 'Full Time', color: '#003F24', canManage: false },
        { id: 3, name: 'PartTime', label: 'Part Time', color: '#0891b2', canManage: false }
    ],

    // Default scheduling settings
    DEFAULT_SETTINGS: {
        minRestHours: 10,       // Minimum hours between shifts
        maxConsecutiveDays: 5,  // Max days in a row an employee can work
        weekStartsOn: 'Monday'
    },

    // Default shift template
    DEFAULT_SHIFTS: [
        { id: 1, name: 'Opener-ATL', start: 6, end: 14, role: 'ATL' },
        { id: 2, name: 'Morning-FT', start: 6, end: 14, role: 'FullTime' },
        { id: 3, name: 'Day-FT', start: 10, end: 18, role: 'FullTime' },
        { id: 4, name: 'Afternoon-PT', start: 13, end: 18, role: 'PartTime' },
        { id: 5, name: 'Closer-ATL', start: 14, end: 21, role: 'ATL' },
        { id: 6, name: 'Closer-PT', start: 17, end: 21, role: 'PartTime' }
    ],

    // Default employees
    DEFAULT_EMPLOYEES: [
        {
            id: 1,
            name: 'Sarah Chen',
            role: 'ATL',
            maxHours: 44,
            targetHours: 40,
            availability: {
                Monday: [6, 22], Tuesday: [6, 22], Wednesday: [6, 22],
                Thursday: [6, 22], Friday: [6, 22], Saturday: [6, 22], Sunday: [6, 22]
            }
        },
        {
            id: 2,
            name: 'Marcus Johnson',
            role: 'ATL',
            maxHours: 44,
            targetHours: 40,
            availability: {
                Monday: [6, 22], Tuesday: [6, 22], Wednesday: [6, 22],
                Thursday: [6, 22], Friday: [6, 22], Saturday: [6, 22], Sunday: [6, 22]
            }
        },
        {
            id: 3,
            name: 'Rachel Green',
            role: 'ATL',
            maxHours: 40,
            targetHours: 35,
            availability: {
                Monday: [6, 22], Tuesday: [6, 22], Wednesday: [6, 22],
                Thursday: [6, 22], Friday: [6, 22], Saturday: [6, 22], Sunday: [6, 22]
            }
        },
        {
            id: 4,
            name: 'Emily Rodriguez',
            role: 'FullTime',
            maxHours: 40,
            targetHours: 38,
            availability: {
                Monday: [6, 18], Tuesday: [6, 18], Wednesday: [6, 18],
                Thursday: [6, 18], Friday: [6, 18], Saturday: null, Sunday: null
            }
        },
        {
            id: 5,
            name: 'David Kim',
            role: 'FullTime',
            maxHours: 40,
            targetHours: 38,
            availability: {
                Monday: [6, 21], Tuesday: [6, 21], Wednesday: [6, 21],
                Thursday: [6, 21], Friday: [6, 21], Saturday: [6, 21], Sunday: [6, 21]
            }
        },
        {
            id: 6,
            name: 'Lisa Park',
            role: 'FullTime',
            maxHours: 40,
            targetHours: 36,
            availability: {
                Monday: null, Tuesday: null, Wednesday: [6, 18],
                Thursday: [6, 18], Friday: [6, 18], Saturday: [6, 18], Sunday: [6, 18]
            }
        },
        {
            id: 7,
            name: 'Michael Torres',
            role: 'FullTime',
            maxHours: 40,
            targetHours: 38,
            availability: {
                Monday: [6, 18], Tuesday: [6, 18], Wednesday: null,
                Thursday: null, Friday: [6, 18], Saturday: [6, 18], Sunday: [6, 18]
            }
        },
        {
            id: 8,
            name: 'Uzair Aftab',
            role: 'PartTime',
            maxHours: 24,
            targetHours: 20,
            availability: {
                Monday: null, Tuesday: null, Wednesday: [10, 21],
                Thursday: [10, 21], Friday: [10, 21], Saturday: [8, 21], Sunday: [8, 21]
            }
        },
        {
            id: 9,
            name: 'Aisha Patel',
            role: 'PartTime',
            maxHours: 24,
            targetHours: 22,
            availability: {
                Monday: [11, 21], Tuesday: [11, 21], Wednesday: [11, 21],
                Thursday: [11, 21], Friday: [11, 21], Saturday: [8, 21], Sunday: null
            }
        },
        {
            id: 10,
            name: 'James Wilson',
            role: 'PartTime',
            maxHours: 20,
            targetHours: 16,
            availability: {
                Monday: null, Tuesday: null, Wednesday: null,
                Thursday: null, Friday: [8, 18], Saturday: [8, 18], Sunday: [8, 18]
            }
        },
        {
            id: 11,
            name: 'Priya Sharma',
            role: 'PartTime',
            maxHours: 20,
            targetHours: 18,
            availability: {
                Monday: null, Tuesday: null, Wednesday: null,
                Thursday: [12, 21], Friday: [12, 21], Saturday: [10, 21], Sunday: [10, 21]
            }
        },
        {
            id: 12,
            name: 'Kevin Martinez',
            role: 'PartTime',
            maxHours: 24,
            targetHours: 20,
            availability: {
                Monday: [8, 21], Tuesday: [8, 21], Wednesday: [8, 21],
                Thursday: null, Friday: null, Saturday: null, Sunday: null
            }
        }
    ],

    // Initialize storage with defaults if empty
    init() {
        if (!localStorage.getItem(this.KEYS.EMPLOYEES)) {
            this.saveEmployees(this.DEFAULT_EMPLOYEES);
        }
        if (!localStorage.getItem(this.KEYS.SHIFTS)) {
            this.saveShifts(this.DEFAULT_SHIFTS);
        }
        if (!localStorage.getItem(this.KEYS.ROLES)) {
            this.saveRoles(this.DEFAULT_ROLES);
        }
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            this.saveSettings(this.DEFAULT_SETTINGS);
        }
    },

    // =========================================================================
    // ROLES CRUD
    // =========================================================================
    getRoles() {
        const data = localStorage.getItem(this.KEYS.ROLES);
        return data ? JSON.parse(data) : this.DEFAULT_ROLES;
    },

    saveRoles(roles) {
        localStorage.setItem(this.KEYS.ROLES, JSON.stringify(roles));
    },

    addRole(role) {
        const roles = this.getRoles();
        role.id = Math.max(0, ...roles.map(r => r.id)) + 1;
        roles.push(role);
        this.saveRoles(roles);
        return role;
    },

    updateRole(id, updates) {
        const roles = this.getRoles();
        const idx = roles.findIndex(r => r.id === id);
        if (idx !== -1) {
            const oldName = roles[idx].name;
            roles[idx] = { ...roles[idx], ...updates };
            this.saveRoles(roles);

            // Update employees and shifts if role name changed
            if (updates.name && updates.name !== oldName) {
                this._updateRoleReferences(oldName, updates.name);
            }
        }
        return roles[idx];
    },

    deleteRole(id) {
        const roles = this.getRoles();
        const roleToDelete = roles.find(r => r.id === id);
        if (!roleToDelete) return false;

        // Check if role is in use
        const employees = this.getEmployees();
        const shifts = this.getShifts();
        const inUse = employees.some(e => e.role === roleToDelete.name) ||
            shifts.some(s => s.role === roleToDelete.name);

        if (inUse) {
            return { error: 'Role is in use by employees or shifts' };
        }

        this.saveRoles(roles.filter(r => r.id !== id));
        return true;
    },

    _updateRoleReferences(oldName, newName) {
        // Update employees
        const employees = this.getEmployees();
        employees.forEach(e => {
            if (e.role === oldName) e.role = newName;
        });
        this.saveEmployees(employees);

        // Update shifts
        const shifts = this.getShifts();
        shifts.forEach(s => {
            if (s.role === oldName) s.role = newName;
        });
        this.saveShifts(shifts);
    },

    getRoleByName(name) {
        return this.getRoles().find(r => r.name === name);
    },

    // =========================================================================
    // SETTINGS
    // =========================================================================
    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : this.DEFAULT_SETTINGS;
    },

    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        Object.assign(settings, updates);
        this.saveSettings(settings);
        return settings;
    },

    // =========================================================================
    // EMPLOYEE CRUD
    // =========================================================================
    getEmployees() {
        const data = localStorage.getItem(this.KEYS.EMPLOYEES);
        return data ? JSON.parse(data) : this.DEFAULT_EMPLOYEES;
    },

    saveEmployees(employees) {
        localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify(employees));
    },

    addEmployee(employee) {
        const employees = this.getEmployees();
        employee.id = Math.max(0, ...employees.map(e => e.id)) + 1;
        employees.push(employee);
        this.saveEmployees(employees);
        return employee;
    },

    updateEmployee(id, updates) {
        const employees = this.getEmployees();
        const idx = employees.findIndex(e => e.id === id);
        if (idx !== -1) {
            employees[idx] = { ...employees[idx], ...updates };
            this.saveEmployees(employees);
        }
        return employees[idx];
    },

    deleteEmployee(id) {
        const employees = this.getEmployees().filter(e => e.id !== id);
        this.saveEmployees(employees);
    },

    // =========================================================================
    // SHIFT CRUD
    // =========================================================================
    getShifts() {
        const data = localStorage.getItem(this.KEYS.SHIFTS);
        return data ? JSON.parse(data) : this.DEFAULT_SHIFTS;
    },

    saveShifts(shifts) {
        localStorage.setItem(this.KEYS.SHIFTS, JSON.stringify(shifts));
    },

    addShift(shift) {
        const shifts = this.getShifts();
        shift.id = Math.max(0, ...shifts.map(s => s.id)) + 1;
        shifts.push(shift);
        this.saveShifts(shifts);
        return shift;
    },

    updateShift(id, updates) {
        const shifts = this.getShifts();
        const idx = shifts.findIndex(s => s.id === id);
        if (idx !== -1) {
            shifts[idx] = { ...shifts[idx], ...updates };
            this.saveShifts(shifts);
        }
        return shifts[idx];
    },

    deleteShift(id) {
        const shifts = this.getShifts().filter(s => s.id !== id);
        this.saveShifts(shifts);
    },

    // =========================================================================
    // SCHEDULE
    // =========================================================================
    getLastSchedule() {
        const data = localStorage.getItem(this.KEYS.SCHEDULE);
        return data ? JSON.parse(data) : null;
    },

    saveSchedule(schedule) {
        localStorage.setItem(this.KEYS.SCHEDULE, JSON.stringify(schedule));
    },

    // =========================================================================
    // IMPORT/EXPORT
    // =========================================================================
    exportAll() {
        return {
            version: '4.0',
            exported: new Date().toISOString(),
            employees: this.getEmployees(),
            shifts: this.getShifts(),
            roles: this.getRoles(),
            settings: this.getSettings(),
            schedule: this.getLastSchedule()
        };
    },

    importAll(data) {
        if (data.employees) this.saveEmployees(data.employees);
        if (data.shifts) this.saveShifts(data.shifts);
        if (data.roles) this.saveRoles(data.roles);
        if (data.settings) this.saveSettings(data.settings);
        if (data.schedule) this.saveSchedule(data.schedule);
    },

    // =========================================================================
    // RESET
    // =========================================================================
    resetToDefaults() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        this.init();
    }
};

// Initialize on load
Storage.init();
