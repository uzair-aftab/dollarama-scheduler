/**
 * Dollarama Shift Scheduler - Frontend App
 * Loads schedule JSON and renders interactive views
 */

// Configuration
const CONFIG = {
    scheduleFile: 'schedule_output.json',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dayAbbrev: { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' }
};

// State
let scheduleData = null;
let currentView = 'grid';

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initViewToggle();
    loadSchedule();
});

// =============================================================================
// THEME HANDLING
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
// VIEW TOGGLE
// =============================================================================

function initViewToggle() {
    const buttons = document.querySelectorAll('.view-toggle .btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view === currentView) return;

            // Update button states
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle views
            document.getElementById('schedule-grid').classList.toggle('hidden', view !== 'grid');
            document.getElementById('schedule-list').classList.toggle('hidden', view !== 'list');

            currentView = view;
        });
    });
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadSchedule() {
    try {
        const response = await fetch(CONFIG.scheduleFile);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        scheduleData = await response.json();
        renderAll();

    } catch (error) {
        console.error('Failed to load schedule:', error);
        showError(`Could not load schedule. Make sure to run the Jupyter notebook first to generate schedule_output.json`);
    }
}

function showError(message) {
    document.getElementById('schedule-grid').innerHTML = `<p class="error">⚠️ ${message}</p>`;
    document.getElementById('hours-summary').innerHTML = '';
}

// =============================================================================
// RENDERING
// =============================================================================

function renderAll() {
    if (!scheduleData) return;

    renderStats();
    renderScheduleGrid();
    renderScheduleList();
    renderHoursSummary();
}

// Stats Bar
function renderStats() {
    const { stats, generated } = scheduleData;

    document.getElementById('stat-employees').textContent = stats.employees_scheduled;
    document.getElementById('stat-shifts').textContent = stats.total_shifts;
    document.getElementById('stat-hours').textContent = stats.total_hours;

    // Format date
    const date = new Date(generated);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('stat-generated').textContent = formatted;
}

// Schedule Grid View
function renderScheduleGrid() {
    const container = document.getElementById('schedule-grid');

    // Group schedule by employee
    const byEmployee = {};
    scheduleData.schedule.forEach(shift => {
        if (!byEmployee[shift.employee]) {
            byEmployee[shift.employee] = { name: shift.employee, role: shift.role, shifts: {} };
        }
        byEmployee[shift.employee].shifts[shift.day] = shift;
    });

    const employees = Object.values(byEmployee).sort((a, b) => {
        const roleOrder = { ATL: 0, FullTime: 1, PartTime: 2 };
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
    });

    // Build HTML
    let html = '';

    // Header row
    html += '<div class="grid-header employee-col">Employee</div>';
    CONFIG.days.forEach(day => {
        html += `<div class="grid-header">${CONFIG.dayAbbrev[day]}</div>`;
    });

    // Employee rows
    employees.forEach(emp => {
        html += `<div class="grid-cell employee-cell">${emp.name}</div>`;

        CONFIG.days.forEach(day => {
            const shift = emp.shifts[day];
            if (shift) {
                const roleClass = shift.role.toLowerCase();
                html += `<div class="grid-cell">
                    <span class="shift-badge ${roleClass}">${shift.shift}</span>
                </div>`;
            } else {
                html += `<div class="grid-cell"><span class="shift-empty">—</span></div>`;
            }
        });
    });

    container.innerHTML = html;
    container.classList.add('loaded');
}

// Schedule List View
function renderScheduleList() {
    const container = document.getElementById('schedule-list');

    // Group by day
    const byDay = {};
    CONFIG.days.forEach(day => byDay[day] = []);

    scheduleData.schedule.forEach(shift => {
        byDay[shift.day].push(shift);
    });

    // Sort shifts by start time
    Object.values(byDay).forEach(shifts => {
        shifts.sort((a, b) => a.start - b.start);
    });

    let html = '';

    CONFIG.days.forEach(day => {
        const shifts = byDay[day];

        html += `<div class="day-section">
            <div class="day-header">
                <span>${day}</span>
                <span class="shift-count">${shifts.length} shifts</span>
            </div>
            <div class="day-shifts">`;

        shifts.forEach(shift => {
            const roleClass = shift.role.toLowerCase();
            html += `<div class="shift-item">
                <div class="shift-info">
                    <span class="shift-time">${shift.shift}</span>
                    <span class="employee-name">${shift.employee}</span>
                </div>
                <span class="role-badge ${roleClass}">${shift.role}</span>
            </div>`;
        });

        html += '</div></div>';
    });

    container.innerHTML = html;
}

// Hours Summary
function renderHoursSummary() {
    const container = document.getElementById('hours-summary');

    // Sort employees by role
    const employees = [...scheduleData.employees].sort((a, b) => {
        const roleOrder = { ATL: 0, FullTime: 1, PartTime: 2 };
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
    });

    let html = '';

    employees.forEach(emp => {
        const percentage = Math.min(100, (emp.scheduled_hours / emp.max_hours) * 100);
        const diff = emp.scheduled_hours - emp.target_hours;
        let diffClass = 'neutral';
        let diffText = '±0';

        if (diff > 0) {
            diffClass = 'positive';
            diffText = `+${diff}`;
        } else if (diff < 0) {
            diffClass = 'negative';
            diffText = `${diff}`;
        }

        const roleClass = emp.role.toLowerCase();

        html += `<div class="employee-card">
            <div class="employee-header">
                <span class="employee-name">${emp.name}</span>
                <span class="role-badge ${roleClass}">${emp.role}</span>
            </div>
            <div class="hours-bar">
                <div class="hours-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="hours-info">
                <span><span class="hours-scheduled">${emp.scheduled_hours}h</span> / ${emp.max_hours}h max</span>
                <span class="hours-diff ${diffClass}">${diffText} vs target</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}
