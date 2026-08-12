import { db, ctx, randInt, chance, pick } from "./helpers";
import { Prisma } from "@prisma/client";

export async function seedPayroll() {
  const employees = await db.employee.findMany({
    where: { schoolId: ctx.school.id },
    select: { id: true, salary: true, firstName: true, lastName: true },
  });
  let count = 0;
  for (const emp of employees) {
    for (let month = 1; month <= 7; month++) {
      const basic = (emp.salary ?? new Prisma.Decimal(0)).toNumber();
      const allowance = Math.round(basic * 0.1);
      const deduction = Math.round(basic * 0.05) + 50000;
      const net = basic + allowance - deduction;
      const start = new Date(ctx.year, month - 1, 1);
      const end = new Date(ctx.year, month - 1, 28);
      await db.payroll.create({
        data: {
          schoolId: ctx.school.id,
          employeeId: emp.id,
          periodStart: start,
          periodEnd: end,
          basicSalary: basic,
          allowances: { housing: allowance },
          deductions: { tax: Math.round(basic * 0.05), nssf: 50000 },
          netSalary: net,
          status: month <= 5 ? "PAID" : chance(0.5) ? "PAID" : "DRAFT",
          paidDate: month <= 5 ? new Date(ctx.year, month - 1, 28) : null,
        },
      });
      count++;
    }
  }
  console.log(`✓ ${count} payroll records`);
}

export async function seedLeave() {
  const employees = await db.employee.findMany({ where: { schoolId: ctx.school.id }, select: { id: true, firstName: true } });
  let count = 0;
  for (let i = 0; i < 12 && i < employees.length; i++) {
    const emp = employees[i];
    const type = pick(["ANNUAL", "SICK", "ANNUAL", "EMERGENCY"] as const);
    const start = new Date(ctx.year, randInt(1, 7), randInt(1, 26));
    const end = new Date(start);
    end.setDate(end.getDate() + randInt(1, 7));
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    await db.leave.create({
      data: {
        schoolId: ctx.school.id,
        employeeId: emp.id,
        type,
        startDate: start,
        endDate: end,
        days,
        reason: type === "SICK" ? "Medical appointment and rest." : "Personal leave as scheduled.",
        status: chance(0.7) ? "APPROVED" : "PENDING",
        approvedById: ctx.superAdminId,
        approvedAt: chance(0.7) ? new Date() : null,
      },
    });
    count++;
  }
  console.log(`✓ ${count} leave requests`);
}

export async function seedStaffAttendance() {
  const allIds = [...ctx.teacherIds];
  const staffIds = ctx.staffIds;
  const employees = await db.employee.findMany({ where: { schoolId: ctx.school.id }, select: { id: true } });
  const employeeMap = new Map<string, { teacherId?: string; staffId?: string }>();
  // map employees that correspond to teachers / staff
  for (const e of employees) {
    if (allIds.length && employeeMap.size < allIds.length) {
      employeeMap.set(e.id, { teacherId: allIds[Math.min(employeeMap.size, allIds.length - 1)] });
    } else if (employeeMap.size < allIds.length + staffIds.length) {
      employeeMap.set(e.id, { staffId: staffIds[Math.min(employeeMap.size - allIds.length, staffIds.length - 1)] });
    }
  }
  const dates: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 30);
  while (d <= new Date()) {
    if (d.getDay() >= 1 && d.getDay() <= 5) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  let count = 0;
  for (const emp of employees) {
    const link = employeeMap.get(emp.id);
    if (!link) continue;
    for (const date of dates) {
      const r = Math.random();
      let status: "PRESENT" | "ABSENT" | "LATE" = "PRESENT";
      if (r > 0.95) status = "ABSENT";
      else if (r > 0.9) status = "LATE";
      count++;
      await db.staffAttendance.create({
        data: {
          schoolId: ctx.school.id,
          teacherId: link.teacherId,
          staffId: link.staffId,
          date,
          status,
        },
      });
    }
  }
  console.log(`✓ ${count} staff attendance records`);
}
