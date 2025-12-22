/**
 * JavaScript Scheduling Engine for Dollarama Shift Scheduler
 * Implements constraint-based scheduling with optimization
 */

const Scheduler = {
    DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

    /**
     * Main scheduling function
     * @param {Array} employees - List of employees
     * @param {Array} shiftTemplates - List of shift templates
     * @returns {Object} Schedule result with assignments and stats
     */
    generateSchedule(employees, shiftTemplates) {
        const startTime = performance.now();

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

        // Run the scheduling algorithm
        const assignments = this.solve(employees, shifts, feasible, shiftCandidates, employeeShifts);

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

        for (const day of this.DAYS) {
            for (const template of templates) {
                shifts.push({
                    id: id++,
                    templateId: template.id,
                    name: template.name,
                    day: day,
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
    solve(employees, shifts, feasible, shiftCandidates, employeeShifts) {
        const assignments = {}; // shiftId => empId
        const employeeHours = {}; // empId => hours assigned
        const employeeDays = {}; // empId => Set of days assigned

        // Initialize tracking
        for (const emp of employees) {
            employeeHours[emp.id] = 0;
            employeeDays[emp.id] = new Set();
        }

        // Sort shifts by difficulty (fewest candidates first)
        const shiftOrder = [...shifts].sort((a, b) =>
            shiftCandidates[a.id].length - shiftCandidates[b.id].length
        );

        // Try to assign each shift
        const success = this.assignShifts(
            shiftOrder, 0, assignments, employeeHours, employeeDays,
            employees, shifts, shiftCandidates
        );

        return success ? assignments : null;
    },

    /**
     * Recursive assignment with backtracking
     */
    assignShifts(shiftOrder, idx, assignments, employeeHours, employeeDays, employees, shifts, shiftCandidates) {
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
            if (employeeDays[empId].has(shift.day)) continue;

            // 2. Max weekly hours
            if (employeeHours[empId] + shift.hours > emp.maxHours) continue;

            // Make assignment
            assignments[shift.id] = empId;
            employeeHours[empId] += shift.hours;
            employeeDays[empId].add(shift.day);

            // Recurse
            if (this.assignShifts(shiftOrder, idx + 1, assignments, employeeHours, employeeDays, employees, shifts, shiftCandidates)) {
                return true;
            }

            // Backtrack
            delete assignments[shift.id];
            employeeHours[empId] -= shift.hours;
            employeeDays[empId].delete(shift.day);
        }

        return false;
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
        for (const s of schedule) {
            hoursByEmp[s.employeeId] = (hoursByEmp[s.employeeId] || 0) + s.hours;
        }

        return employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            scheduledHours: hoursByEmp[emp.id] || 0,
            targetHours: emp.targetHours,
            maxHours: emp.maxHours
        }));
    }
};
