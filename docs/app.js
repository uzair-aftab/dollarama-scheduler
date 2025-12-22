/**
 * Dollarama Shift Scheduler - Main Application v4.2
 * Full interactive scheduling with role management and constraints
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dayAbbrev: { Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'Th', Friday: 'F', Saturday: 'Sa', Sunday: 'Su' }
};

// =============================================================================
// STATE
// =============================================================================

let currentTab = 'schedule';
let currentSchedule = null;
let editingEmployeeId = null;
let editingShiftId = null;
let editingRoleId = null;
let availabilityState = {};
let confirmCallback = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize intro splash screen
    initIntroScreen();

    initTheme();
    initTabs();
    initDropdown();
    initModals();
    initEmployeeForm();
    initShiftForm();
    initRoleForm();
    initSettingsForm();
    initViewToggle();
    initImportExport();

    // Load initial data
    renderEmployeeList();
    renderShiftList();
    renderRoleList();
    loadSettings();
    updateStats();

    // Try to load last schedule
    const lastSchedule = Storage.getLastSchedule();
    if (lastSchedule) {
        currentSchedule = lastSchedule;
        renderSchedule();
    }

    // Run scheduler button
    document.getElementById('run-scheduler-btn').addEventListener('click', runScheduler);

    // Populate dynamic role options
    updateRoleDropdowns();
});

// =============================================================================
// INTRO SPLASH SCREEN
// =============================================================================

function initIntroScreen() {
    const intro = document.getElementById('intro-overlay');
    if (!intro) return;

    // Skip intro if user has visited before in this session
    if (sessionStorage.getItem('intro_seen')) {
        intro.classList.add('hidden');
        return;
    }

    // Create mouse glow element
    const mouseGlow = document.createElement('div');
    mouseGlow.className = 'intro-mouse-glow';
    intro.appendChild(mouseGlow);

    // Track mouse position with smooth movement
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let trailCounter = 0;

    // Update glow position smoothly
    function updateGlow() {
        // Smooth interpolation
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        mouseGlow.style.left = currentX + 'px';
        mouseGlow.style.top = currentY + 'px';

        if (!intro.classList.contains('hidden')) {
            requestAnimationFrame(updateGlow);
        }
    }
    updateGlow();

    // Mouse move handler
    intro.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseGlow.classList.add('active');

        // Create trail particles periodically
        trailCounter++;
        if (trailCounter % 3 === 0) {
            createTrailParticle(e.clientX, e.clientY, intro);
        }
    });

    intro.addEventListener('mouseleave', () => {
        mouseGlow.classList.remove('active');
    });

    // Dismiss on click with burst effect
    intro.addEventListener('click', (e) => {
        // Create burst of particles on click
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                createBurstParticle(e.clientX, e.clientY, intro, i);
            }, i * 30);
        }

        intro.classList.add('hiding');
        sessionStorage.setItem('intro_seen', 'true');

        // Remove from DOM after animation
        setTimeout(() => {
            intro.classList.add('hidden');
        }, 800);
    });
}

// Create a trail particle that fades out
function createTrailParticle(x, y, container) {
    const particle = document.createElement('div');
    particle.className = 'intro-trail-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    container.appendChild(particle);

    // Remove after animation
    setTimeout(() => particle.remove(), 600);
}

// Create burst particles on click
function createBurstParticle(x, y, container, index) {
    const particle = document.createElement('div');
    particle.className = 'intro-trail-particle';

    // Calculate direction
    const angle = (index / 12) * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    const endX = x + Math.cos(angle) * distance;
    const endY = y + Math.sin(angle) * distance;

    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.transition = 'all 0.5s ease-out';
    particle.style.opacity = '1';
    particle.style.animation = 'none';

    container.appendChild(particle);

    // Trigger burst animation
    requestAnimationFrame(() => {
        particle.style.left = endX + 'px';
        particle.style.top = endY + 'px';
        particle.style.opacity = '0';
        particle.style.transform = 'translate(-50%, -50%) scale(2)';
    });

    setTimeout(() => particle.remove(), 500);
}

// =============================================================================
// THEME
// =============================================================================

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// =============================================================================
// TABS
// =============================================================================

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === currentTab) return;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');

            currentTab = tab;
        });
    });
}

// =============================================================================
// DROPDOWN MENU
// =============================================================================

function initDropdown() {
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('dropdown-menu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        menu.classList.remove('show');
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        showConfirm('Reset all data to defaults? This cannot be undone.', () => {
            Storage.resetToDefaults();
            currentSchedule = null;
            renderEmployeeList();
            renderShiftList();
            renderRoleList();
            loadSettings();
            updateStats();
            updateRoleDropdowns();
            document.getElementById('schedule-grid').innerHTML = '<div class="empty-state"><p>🚀 Click <strong>Run Scheduler</strong> to generate a schedule</p></div>';
            document.getElementById('hours-summary').innerHTML = '<div class="empty-state"><p>Run the scheduler to see hours summary</p></div>';
            showToast('Data reset to defaults', 'success');
        });
    });
}

// =============================================================================
// MODALS
// =============================================================================

function initModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeAllModals());
    });

    // Cancel buttons
    document.getElementById('cancel-employee-btn').addEventListener('click', () => closeModal('employee-modal'));
    document.getElementById('cancel-shift-btn').addEventListener('click', () => closeModal('shift-modal'));
    document.getElementById('cancel-role-btn').addEventListener('click', () => closeModal('role-modal'));
    document.getElementById('confirm-cancel').addEventListener('click', () => closeModal('confirm-modal'));

    // Click outside to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Add buttons
    document.getElementById('add-employee-btn').addEventListener('click', () => openEmployeeModal());
    document.getElementById('add-shift-btn').addEventListener('click', () => openShiftModal());
    document.getElementById('add-role-btn').addEventListener('click', () => openRoleModal());
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
}

function showConfirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    openModal('confirm-modal');

    document.getElementById('confirm-ok').onclick = () => {
        closeModal('confirm-modal');
        if (confirmCallback) confirmCallback();
    };
}

// =============================================================================
// ROLE MANAGEMENT
// =============================================================================

function initRoleForm() {
    document.getElementById('save-role-btn').addEventListener('click', saveRole);
}

function openRoleModal(role = null) {
    editingRoleId = role ? role.id : null;
    document.getElementById('role-modal-title').textContent = role ? 'Edit Role' : 'Add Role';

    document.getElementById('role-id').value = role?.id || '';
    document.getElementById('role-name').value = role?.name || '';
    document.getElementById('role-label').value = role?.label || '';
    document.getElementById('role-color').value = role?.color || '#003F24';

    openModal('role-modal');
}

function saveRole() {
    const name = document.getElementById('role-name').value.trim();
    const label = document.getElementById('role-label').value.trim();
    const color = document.getElementById('role-color').value;

    if (!name || !label) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const role = { name, label, color };

    if (editingRoleId) {
        Storage.updateRole(editingRoleId, role);
        showToast('Role updated', 'success');
    } else {
        Storage.addRole(role);
        showToast('Role added', 'success');
    }

    closeModal('role-modal');
    renderRoleList();
    updateRoleDropdowns();
}

function deleteRole(id) {
    showConfirm('Delete this role? Roles in use cannot be deleted.', () => {
        const result = Storage.deleteRole(id);
        if (result === true) {
            renderRoleList();
            updateRoleDropdowns();
            showToast('Role deleted', 'success');
        } else if (result.error) {
            showToast(result.error, 'error');
        }
    });
}

function renderRoleList() {
    const roles = Storage.getRoles();
    const container = document.getElementById('role-list');

    if (roles.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No roles defined. Click "Add Role" to create one.</p></div>';
        return;
    }

    container.innerHTML = roles.map(role => `
        <div class="list-item">
            <div class="list-item-header">
                <span class="list-item-title" style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 20px; height: 20px; border-radius: 4px; background: ${role.color};"></span>
                    ${role.label}
                </span>
                <span style="font-size: 0.875rem; color: var(--text-muted);">${role.name}</span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-sm" onclick="openRoleModal(Storage.getRoles().find(r => r.id === ${role.id}))">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateRoleDropdowns() {
    const roles = Storage.getRoles();
    const empRoleSelect = document.getElementById('emp-role');
    const shiftRoleSelect = document.getElementById('shift-role');

    const options = roles.map(r => `<option value="${r.name}">${r.label}</option>`).join('');

    if (empRoleSelect) empRoleSelect.innerHTML = options;
    if (shiftRoleSelect) shiftRoleSelect.innerHTML = options;
}

// =============================================================================
// SETTINGS MANAGEMENT
// =============================================================================

function initSettingsForm() {
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
}

function loadSettings() {
    const settings = Storage.getSettings();
    document.getElementById('setting-min-rest').value = settings.minRestHours || 10;
    document.getElementById('setting-max-consecutive').value = settings.maxConsecutiveDays || 5;
}

function saveSettings() {
    const minRestHours = parseInt(document.getElementById('setting-min-rest').value);
    const maxConsecutiveDays = parseInt(document.getElementById('setting-max-consecutive').value);

    Storage.updateSettings({ minRestHours, maxConsecutiveDays });
    showToast('Settings saved', 'success');
}

// =============================================================================
// EMPLOYEE MANAGEMENT
// =============================================================================

function initEmployeeForm() {
    // Initialize availability grid
    buildAvailabilityGrid();

    // Save button
    document.getElementById('save-employee-btn').addEventListener('click', saveEmployee);
}

function buildAvailabilityGrid() {
    const grid = document.getElementById('availability-grid');
    let html = '<div class="avail-header"></div>';

    // Hour headers
    for (let h = 0; h < 24; h++) {
        html += `<div class="avail-header">${h}</div>`;
    }

    // Day rows
    for (const day of CONFIG.days) {
        html += `<div class="avail-day">${CONFIG.dayAbbrev[day]}</div>`;
        for (let h = 0; h < 24; h++) {
            html += `<div class="avail-cell" data-day="${day}" data-hour="${h}"></div>`;
        }
    }

    grid.innerHTML = html;

    // Add click handlers for availability cells
    let isSelecting = false;
    let selectValue = true;
    let selectDay = null;

    grid.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('avail-cell')) {
            isSelecting = true;
            selectDay = e.target.dataset.day;
            selectValue = !e.target.classList.contains('selected');
            toggleCell(e.target, selectValue);
        }
    });

    grid.addEventListener('mouseover', (e) => {
        if (isSelecting && e.target.classList.contains('avail-cell') && e.target.dataset.day === selectDay) {
            toggleCell(e.target, selectValue);
        }
    });

    document.addEventListener('mouseup', () => {
        isSelecting = false;
        selectDay = null;
    });
}

function toggleCell(cell, value) {
    const day = cell.dataset.day;
    const hour = parseInt(cell.dataset.hour);

    if (value) {
        cell.classList.add('selected');
        if (!availabilityState[day]) availabilityState[day] = new Set();
        availabilityState[day].add(hour);
    } else {
        cell.classList.remove('selected');
        if (availabilityState[day]) availabilityState[day].delete(hour);
    }
}

function openEmployeeModal(employee = null) {
    editingEmployeeId = employee ? employee.id : null;
    document.getElementById('employee-modal-title').textContent = employee ? 'Edit Employee' : 'Add Employee';

    // Reset form
    document.getElementById('emp-id').value = employee?.id || '';
    document.getElementById('emp-name').value = employee?.name || '';
    document.getElementById('emp-role').value = employee?.role || 'PartTime';
    document.getElementById('emp-target').value = employee?.targetHours || 20;
    document.getElementById('emp-max').value = employee?.maxHours || 24;

    // Reset availability grid
    availabilityState = {};
    document.querySelectorAll('.avail-cell').forEach(cell => cell.classList.remove('selected'));

    // Load availability if editing
    if (employee?.availability) {
        for (const day of CONFIG.days) {
            const range = employee.availability[day];
            if (range) {
                availabilityState[day] = new Set();
                for (let h = range[0]; h < range[1]; h++) {
                    availabilityState[day].add(h);
                    const cell = document.querySelector(`.avail-cell[data-day="${day}"][data-hour="${h}"]`);
                    if (cell) cell.classList.add('selected');
                }
            }
        }
    }

    openModal('employee-modal');
}

function saveEmployee() {
    const name = document.getElementById('emp-name').value.trim();
    const role = document.getElementById('emp-role').value;
    const targetHours = parseInt(document.getElementById('emp-target').value);
    const maxHours = parseInt(document.getElementById('emp-max').value);

    if (!name) {
        showToast('Please enter a name', 'error');
        return;
    }

    // Convert availability state to ranges
    const availability = {};
    for (const day of CONFIG.days) {
        if (availabilityState[day] && availabilityState[day].size > 0) {
            const hours = Array.from(availabilityState[day]).sort((a, b) => a - b);
            availability[day] = [Math.min(...hours), Math.max(...hours) + 1];
        } else {
            availability[day] = null;
        }
    }

    const employee = { name, role, targetHours, maxHours, availability };

    if (editingEmployeeId) {
        Storage.updateEmployee(editingEmployeeId, employee);
        showToast('Employee updated', 'success');
    } else {
        Storage.addEmployee(employee);
        showToast('Employee added', 'success');
    }

    closeModal('employee-modal');
    renderEmployeeList();
    updateStats();
}

function deleteEmployee(id) {
    showConfirm('Delete this employee?', () => {
        Storage.deleteEmployee(id);
        renderEmployeeList();
        updateStats();
        showToast('Employee deleted', 'success');
    });
}

function renderEmployeeList() {
    const employees = Storage.getEmployees();
    const roles = Storage.getRoles();
    const container = document.getElementById('employee-list');

    if (employees.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No employees yet. Click "Add Employee" to get started.</p></div>';
        return;
    }

    container.innerHTML = employees.map(emp => {
        const role = roles.find(r => r.name === emp.role);
        const roleColor = role?.color || '#666';

        const availDays = CONFIG.days.map(d => {
            const avail = emp.availability[d];
            return `<div class="day-dot ${avail ? 'available' : ''}" title="${d}">${CONFIG.dayAbbrev[d]}</div>`;
        }).join('');

        return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${emp.name}</span>
                    <span class="role-badge" style="background: ${roleColor}; color: white;">${emp.role}</span>
                </div>
                <div class="list-item-meta">
                    <span class="meta-item">🎯 ${emp.targetHours}h target</span>
                    <span class="meta-item">📊 ${emp.maxHours}h max</span>
                </div>
                <div class="availability-preview">${availDays}</div>
                <div class="list-item-actions">
                    <button class="btn btn-sm" onclick="openEmployeeModal(Storage.getEmployees().find(e => e.id === ${emp.id}))">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// =============================================================================
// SHIFT MANAGEMENT
// =============================================================================

function initShiftForm() {
    // Populate time dropdowns
    const startSelect = document.getElementById('shift-start');
    const endSelect = document.getElementById('shift-end');

    for (let h = 0; h < 24; h++) {
        const timeStr = `${String(h).padStart(2, '0')}:00`;
        startSelect.innerHTML += `<option value="${h}">${timeStr}</option>`;
        endSelect.innerHTML += `<option value="${h}">${timeStr}</option>`;
    }

    startSelect.value = 6;
    endSelect.value = 14;

    // Update duration preview
    const updateDuration = () => {
        const start = parseInt(startSelect.value);
        const end = parseInt(endSelect.value);
        const duration = end - start;
        document.getElementById('shift-duration').textContent = duration > 0 ? `${duration} hours` : 'Invalid';
    };

    startSelect.addEventListener('change', updateDuration);
    endSelect.addEventListener('change', updateDuration);

    // Save button
    document.getElementById('save-shift-btn').addEventListener('click', saveShift);
}

function openShiftModal(shift = null) {
    editingShiftId = shift ? shift.id : null;
    document.getElementById('shift-modal-title').textContent = shift ? 'Edit Shift' : 'Add Shift';

    document.getElementById('shift-id').value = shift?.id || '';
    document.getElementById('shift-name').value = shift?.name || '';
    document.getElementById('shift-start').value = shift?.start || 6;
    document.getElementById('shift-end').value = shift?.end || 14;
    document.getElementById('shift-role').value = shift?.role || 'FullTime';

    // Update duration
    const start = shift?.start || 6;
    const end = shift?.end || 14;
    document.getElementById('shift-duration').textContent = `${end - start} hours`;

    openModal('shift-modal');
}

function saveShift() {
    const name = document.getElementById('shift-name').value.trim();
    const start = parseInt(document.getElementById('shift-start').value);
    const end = parseInt(document.getElementById('shift-end').value);
    const role = document.getElementById('shift-role').value;

    if (!name) {
        showToast('Please enter a shift name', 'error');
        return;
    }

    if (end <= start) {
        showToast('End time must be after start time', 'error');
        return;
    }

    const shift = { name, start, end, role };

    if (editingShiftId) {
        Storage.updateShift(editingShiftId, shift);
        showToast('Shift updated', 'success');
    } else {
        Storage.addShift(shift);
        showToast('Shift added', 'success');
    }

    closeModal('shift-modal');
    renderShiftList();
    updateStats();
}

function deleteShift(id) {
    showConfirm('Delete this shift template?', () => {
        Storage.deleteShift(id);
        renderShiftList();
        updateStats();
        showToast('Shift deleted', 'success');
    });
}

function renderShiftList() {
    const shifts = Storage.getShifts();
    const roles = Storage.getRoles();
    const container = document.getElementById('shift-list');

    if (shifts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No shift templates. Click "Add Shift" to create one.</p></div>';
        return;
    }

    container.innerHTML = shifts.map(shift => {
        const role = roles.find(r => r.name === shift.role);
        const roleColor = role?.color || '#666';

        return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${shift.name}</span>
                    <span class="role-badge" style="background: ${roleColor}; color: white;">${shift.role}</span>
                </div>
                <div class="list-item-meta">
                    <span class="meta-item">⏰ ${String(shift.start).padStart(2, '0')}:00 - ${String(shift.end).padStart(2, '0')}:00</span>
                    <span class="meta-item">📊 ${shift.end - shift.start} hours</span>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-sm" onclick="openShiftModal(Storage.getShifts().find(s => s.id === ${shift.id}))">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteShift(${shift.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// =============================================================================
// SCHEDULER
// =============================================================================

function runScheduler() {
    const employees = Storage.getEmployees();
    const shifts = Storage.getShifts();
    const settings = Storage.getSettings();

    if (employees.length === 0) {
        showToast('Add some employees first', 'error');
        return;
    }

    if (shifts.length === 0) {
        showToast('Add some shift templates first', 'error');
        return;
    }

    // Run the scheduler with settings
    const result = Scheduler.generateSchedule(employees, shifts, settings);

    if (result.success) {
        currentSchedule = result;
        Storage.saveSchedule(result);
        renderSchedule();
        updateStats();
        showToast(`Schedule generated in ${result.solveTime}ms (rest: ${settings.minRestHours}h, max days: ${settings.maxConsecutiveDays})`, 'success');
    } else {
        showToast(result.message, 'error');

        if (result.unfillable) {
            console.log('Unfillable shifts:', result.unfillable);
        }
    }
}

// =============================================================================
// SCHEDULE RENDERING
// =============================================================================

function initViewToggle() {
    const buttons = document.querySelectorAll('.view-toggle .btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.getElementById('schedule-grid').classList.toggle('hidden', view !== 'grid');
            document.getElementById('schedule-list').classList.toggle('hidden', view !== 'list');
        });
    });
}

function renderSchedule() {
    if (!currentSchedule || !currentSchedule.schedule) return;

    renderScheduleGrid();
    renderScheduleList();
    renderHoursSummary();
}

function renderScheduleGrid() {
    const container = document.getElementById('schedule-grid');
    const schedule = currentSchedule.schedule;
    const roles = Storage.getRoles();

    // Group by employee
    const byEmployee = {};
    schedule.forEach(s => {
        if (!byEmployee[s.employee]) {
            byEmployee[s.employee] = { name: s.employee, role: s.role, shifts: {} };
        }
        byEmployee[s.employee].shifts[s.day] = s;
    });

    const employees = Object.values(byEmployee).sort((a, b) => {
        const roleOrder = Storage.getRoles().map(r => r.name);
        return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
    });

    let html = '<div class="grid-header employee-col">Employee</div>';
    CONFIG.days.forEach(d => {
        html += `<div class="grid-header">${CONFIG.dayAbbrev[d]}</div>`;
    });

    employees.forEach(emp => {
        const role = roles.find(r => r.name === emp.role);
        const roleColor = role?.color || '#666';

        html += `<div class="grid-cell employee-cell">${emp.name}</div>`;
        CONFIG.days.forEach(day => {
            const s = emp.shifts[day];
            if (s) {
                html += `<div class="grid-cell"><span class="shift-badge" style="background: ${roleColor}; color: white; border: 1px solid ${roleColor};">${s.shift}</span></div>`;
            } else {
                html += `<div class="grid-cell"><span class="shift-empty">—</span></div>`;
            }
        });
    });

    container.innerHTML = html;
    container.classList.add('loaded');
}

function renderScheduleList() {
    const container = document.getElementById('schedule-list');
    const schedule = currentSchedule.schedule;
    const roles = Storage.getRoles();

    const byDay = {};
    CONFIG.days.forEach(d => byDay[d] = []);
    schedule.forEach(s => byDay[s.day].push(s));
    Object.values(byDay).forEach(arr => arr.sort((a, b) => a.start - b.start));

    let html = '';
    CONFIG.days.forEach(day => {
        const shifts = byDay[day];
        html += `
            <div class="day-section">
                <div class="day-header"><span>${day}</span><span>${shifts.length} shifts</span></div>
                <div class="day-shifts">
                    ${shifts.map(s => {
            const role = roles.find(r => r.name === s.role);
            const roleColor = role?.color || '#666';
            return `
                            <div class="shift-item">
                                <div class="shift-info">
                                    <span class="shift-time">${s.shift}</span>
                                    <span>${s.employee}</span>
                                </div>
                                <span class="role-badge" style="background: ${roleColor}; color: white;">${s.role}</span>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderHoursSummary() {
    const container = document.getElementById('hours-summary');
    const employees = currentSchedule.employees;
    const roles = Storage.getRoles();

    const sorted = [...employees].sort((a, b) => {
        const roleOrder = roles.map(r => r.name);
        return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
    });

    container.innerHTML = sorted.map(emp => {
        const pct = Math.min(100, (emp.scheduledHours / emp.maxHours) * 100);
        const diff = emp.scheduledHours - emp.targetHours;
        let diffClass = 'neutral', diffText = '±0';
        if (diff > 0) { diffClass = 'positive'; diffText = `+${diff}`; }
        else if (diff < 0) { diffClass = 'negative'; diffText = `${diff}`; }

        const role = roles.find(r => r.name === emp.role);
        const roleColor = role?.color || '#666';

        return `
            <div class="employee-card">
                <div class="employee-header">
                    <span class="employee-name">${emp.name}</span>
                    <span class="role-badge" style="background: ${roleColor}; color: white;">${emp.role}</span>
                </div>
                <div class="hours-bar"><div class="hours-fill" style="width:${pct}%"></div></div>
                <div class="hours-info">
                    <span><span class="hours-scheduled">${emp.scheduledHours}h</span> / ${emp.maxHours}h max</span>
                    <span class="hours-diff ${diffClass}">${diffText} vs target</span>
                </div>
            </div>
        `;
    }).join('');
}

// =============================================================================
// STATS
// =============================================================================

function updateStats() {
    const employees = Storage.getEmployees();
    const shifts = Storage.getShifts();

    document.getElementById('stat-employees').textContent = employees.length;
    document.getElementById('stat-shifts').textContent = shifts.length * 7;

    if (currentSchedule) {
        document.getElementById('stat-hours').textContent = currentSchedule.stats.totalHours;
        document.getElementById('stat-status').textContent = '✅';
    } else {
        document.getElementById('stat-hours').textContent = '--';
        document.getElementById('stat-status').textContent = '⏳';
    }
}

// =============================================================================
// IMPORT/EXPORT
// =============================================================================

function initImportExport() {
    document.getElementById('export-btn').addEventListener('click', () => {
        const data = Storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported', 'success');
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                Storage.importAll(data);
                renderEmployeeList();
                renderShiftList();
                renderRoleList();
                loadSettings();
                updateStats();
                updateRoleDropdowns();
                showToast('Data imported successfully', 'success');
            } catch (err) {
                showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
