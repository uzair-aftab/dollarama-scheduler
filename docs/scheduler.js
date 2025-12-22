/**
 * JavaScript Scheduling Engine for Dollarama Shift Scheduler v4.2
 * Implements constraint-based scheduling with optimization
 * Features: Min rest hours, max consecutive days, role matching
 */

const Scheduler = {
    DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

    /**
     * Main scheduling function
     * @param {Array} employees - List of employees
     * @param {Array} shiftTemplates - List of shift templates
     * @param {Object} settings - Scheduling settings (minRestHours, maxConsecutiveDays)
     * @returns {Object} Schedule result with assignments and stats
     */
    generateSchedule(employees, shiftTemplates, settings = {}) {
        const startTime = performance.now();

        // Get settings with defaults
        const minRestHours = settings.minRestHours ?? 10;
        const maxConsecutiveDays = settings.maxConsecutiveDays ?? 5;

        // Generate all shifts for the week
        const shifts = this.generateWeeklyShifts(shiftTemplates);

        // Build feasibility matrix
        const { feasible, shiftCandidates, employeeShifts } = this.buildFeasibilityMatrix(employees, shifts);

        // Check for unfillable shifts
        const unfillable = shifts.filter((_, idx) => shiftCandidates[idx].length === 0);
        if (unfillable.length > 0) {
            return {
                success: false,
                error: 'UNFILLABLE_SHIFTS',
                unfillable: unfillable,
                message: `Cannot fill ${unfillable.length} shift(s) - no eligible employees available`
            };
        }

        // Run the scheduling algorithm with constraints
        const assignments = this.solve(
            employees, shifts, feasible, shiftCandidates, employeeShifts,
            { minRestHours, maxConsecutiveDays }
        );

        if (!assignments) {
            return {
                success: false,
                error: 'NO_SOLUTION',
                message: 'Could not find a valid schedule that satisfies all constraints'
            };
        }

        // Build the result
        const schedule = this.buildScheduleResult(employees, shifts, assignments);
        const elapsed = performance.now() - startTime;

        return {
            success: true,
            generated: new Date().toISOString(),
            solveTime: Math.round(elapsed),
            constraints: {
                minRestHours,
                maxConsecutiveDays
            },
            stats: {
                totalShifts: schedule.length,
                totalHours: schedule.reduce((sum, s) => sum + s.hours, 0),
                employeesScheduled: new Set(schedule.map(s => s.employee)).size
            },
            schedule: schedule,
            employees: this.buildEmployeeSummary(employees, schedule)
        };
    },

    /**
     * Generate all shifts for the week from templates
     */
    generateWeeklyShifts(templates) {
        const shifts = [];
        let id = 0;

        for (let dayIdx = 0; dayIdx < this.DAYS.length; dayIdx++) {
            const day = this.DAYS[dayIdx];
            for (const template of templates) {
                shifts.push({
                    id: id++,
                    templateId: template.id,
                    name: template.name,
                    day: day,
                    dayIndex: dayIdx,
                    start: template.start,
                    end: template.end,
                    hours: template.end - template.start,
                    role: template.role
                });
            }
        }

        return shifts;
    },

    /**
     * Build feasibility matrix - which employees can work which shifts
     */
    buildFeasibilityMatrix(employees, shifts) {
        const feasible = {}; // (empId, shiftId) => true
        const shiftCandidates = {}; // shiftId => [empIds]
        const employeeShifts = {}; // empId => [shiftIds]

        for (const shift of shifts) {
            shiftCandidates[shift.id] = [];
        }

        for (const emp of employees) {
            employeeShifts[emp.id] = [];

            for (const shift of shifts) {
                // Check role match
                if (emp.role !== shift.role) continue;

                // Check availability
                const avail = emp.availability[shift.day];
                if (!avail) continue;

                // Check time window
                if (shift.start < avail[0] || shift.end > avail[1]) continue;

                // This assignment is feasible
                feasible[`${emp.id}-${shift.id}`] = true;
                shiftCandidates[shift.id].push(emp.id);
                employeeShifts[emp.id].push(shift.id);
            }
        }

        return { feasible, shiftCandidates, employeeShifts };
    },

    /**
     * Main solving algorithm using greedy assignment with backtracking
     */
    solve(employees, shifts, feasible, shiftCandidates, employeeShifts, constraints) {
        const assignments = {}; // shiftId => empId
        const employeeHours = {}; // empId => hours assigned
        const employeeDays = {}; // empId => Set of day indices assigned
        const employeeShiftsByDay = {}; // empId => { dayIndex: shiftId }

        // Initialize tracking
        for (const emp of employees) {
            employeeHours[emp.id] = 0;
            employeeDays[emp.id] = new Set();
            employeeShiftsByDay[emp.id] = {};
        }

        // Build shift map for quick lookup
        const shiftMap = Object.fromEntries(shifts.map(s => [s.id, s]));

        // Sort shifts by difficulty (fewest candidates first)
        const shiftOrder = [...shifts].sort((a, b) =>
            shiftCandidates[a.id].length - shiftCandidates[b.id].length
        );

        // Try to assign each shift
        const success = this.assignShifts(
            shiftOrder, 0, assignments, employeeHours, employeeDays,
            employeeShiftsByDay, employees, shifts, shiftMap, shiftCandidates, constraints
        );

        return success ? assignments : null;
    },

    /**
     * Recursive assignment with backtracking
     */
    assignShifts(shiftOrder, idx, assignments, employeeHours, employeeDays,
        employeeShiftsByDay, employees, shifts, shiftMap, shiftCandidates, constraints) {
        // Base case: all shifts assigned
        if (idx >= shiftOrder.length) return true;

        const shift = shiftOrder[idx];
        const candidates = shiftCandidates[shift.id];

        // Sort candidates by priority (fewer hours assigned first, targeting those under target)
        const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
        const sortedCandidates = [...candidates].sort((a, b) => {
            const empA = empMap[a];
            const empB = empMap[b];
            const gapA = empA.targetHours - employeeHours[a];
            const gapB = empB.targetHours - employeeHours[b];
            return gapB - gapA; // Prioritize those further from target
        });

        for (const empId of sortedCandidates) {
            const emp = empMap[empId];

            // Check constraints
            // 1. Max one shift per day
            if (employeeDays[empId].has(shift.dayIndex)) continue;

            // 2. Max weekly hours
            if (employeeHours[empId] + shift.hours > emp.maxHours) continue;

            // 3. Min rest hours (check previous day's shift)
            if (!this.checkMinRestHours(empId, shift, employeeShiftsByDay, shiftMap, constraints.minRestHours)) {
                continue;
            }

            // 4. Max consecutive days
            if (!this.checkMaxConsecutiveDays(empId, shift.dayIndex, employeeDays, constraints.maxConsecutiveDays)) {
                continue;
            }

            // Make assignment
            assignments[shift.id] = empId;
            employeeHours[empId] += shift.hours;
            employeeDays[empId].add(shift.dayIndex);
            employeeShiftsByDay[empId][shift.dayIndex] = shift.id;

            // Recurse
            if (this.assignShifts(shiftOrder, idx + 1, assignments, employeeHours, employeeDays,
                employeeShiftsByDay, employees, shifts, shiftMap, shiftCandidates, constraints)) {
                return true;
            }

            // Backtrack
            delete assignments[shift.id];
            employeeHours[empId] -= shift.hours;
            employeeDays[empId].delete(shift.dayIndex);
            delete employeeShiftsByDay[empId][shift.dayIndex];
        }

        return false;
    },

    /**
     * Check if assigning this shift would violate min rest hours constraint
     * Returns true if assignment is allowed
     */
    checkMinRestHours(empId, shift, employeeShiftsByDay, shiftMap, minRestHours) {
        // Check previous day
        const prevDayIdx = shift.dayIndex - 1;
        if (prevDayIdx >= 0 && employeeShiftsByDay[empId][prevDayIdx] !== undefined) {
            const prevShift = shiftMap[employeeShiftsByDay[empId][prevDayIdx]];
            // Calculate rest time: hours from previous shift end to next shift start
            // Assuming 24-hour window per day + shift start of current day
            const restHours = (24 - prevShift.end) + shift.start;
            if (restHours < minRestHours) {
                return false;
            }
        }

        // Check if this shift would affect next day (for future-proofing)
        const nextDayIdx = shift.dayIndex + 1;
        if (nextDayIdx < 7 && employeeShiftsByDay[empId][nextDayIdx] !== undefined) {
            const nextShift = shiftMap[employeeShiftsByDay[empId][nextDayIdx]];
            const restHours = (24 - shift.end) + nextShift.start;
            if (restHours < minRestHours) {
                return false;
            }
        }

        return true;
    },

    /**
     * Check if assigning this day would violate max consecutive days constraint
     * Returns true if assignment is allowed
     */
    checkMaxConsecutiveDays(empId, dayIndex, employeeDays, maxConsecutiveDays) {
        const days = employeeDays[empId];

        // Simulate adding this day
        const simulatedDays = new Set(days);
        simulatedDays.add(dayIndex);

        // Count longest consecutive streak
        let maxStreak = 0;
        let currentStreak = 0;

        for (let i = 0; i < 7; i++) {
            if (simulatedDays.has(i)) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return maxStreak <= maxConsecutiveDays;
    },

    /**
     * Build the final schedule result
     */
    buildScheduleResult(employees, shifts, assignments) {
        const empMap = Object.fromEntries(employees.map(e => [e.id, e]));
        const schedule = [];

        for (const shift of shifts) {
            const empId = assignments[shift.id];
            if (empId !== undefined) {
                const emp = empMap[empId];
                schedule.push({
                    employee: emp.name,
                    employeeId: emp.id,
                    role: emp.role,
                    day: shift.day,
                    dayIndex: shift.dayIndex,
                    shiftName: shift.name,
                    start: shift.start,
                    end: shift.end,
                    shift: `${String(shift.start).padStart(2, '0')}:00-${String(shift.end).padStart(2, '0')}:00`,
                    hours: shift.hours
                });
            }
        }

        return schedule;
    },

    /**
     * Build employee hours summary
     */
    buildEmployeeSummary(employees, schedule) {
        const hoursByEmp = {};
        const daysByEmp = {};

        for (const s of schedule) {
            hoursByEmp[s.employeeId] = (hoursByEmp[s.employeeId] || 0) + s.hours;
            if (!daysByEmp[s.employeeId]) daysByEmp[s.employeeId] = new Set();
            daysByEmp[s.employeeId].add(s.day);
        }

        return employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            scheduledHours: hoursByEmp[emp.id] || 0,
            scheduledDays: daysByEmp[emp.id] ? daysByEmp[emp.id].size : 0,
            targetHours: emp.targetHours,
            maxHours: emp.maxHours
        }));
    }
};
