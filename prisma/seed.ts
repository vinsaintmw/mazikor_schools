import { db, wipeSchoolData } from "./seed/helpers";
import { seedRoles, seedPlans, seedSchool, seedAcademicStructure } from "./seed/core";
import { seedSuperAdmin, seedTeachers, seedStaff, seedStudents, seedParents, seedEmployees } from "./seed/people";
import { seedAttendance, seedExams, computePositions } from "./seed/academics";
import { seedFinance, seedExpenses } from "./seed/finance";
import { seedTimetable, seedAssignments, seedNotices, seedEvents, seedLibrary, seedTransport, seedInventory } from "./seed/school-life";
import { seedPayroll, seedLeave, seedStaffAttendance } from "./seed/hr";
import { seedDemoUsers, seedNotificationsAndAudit, seedDocuments } from "./seed/users";

async function main() {
  console.log("Seeding Mazikor Schools…");
  await wipeSchoolData();

  await seedRoles();
  await seedPlans();
  await seedSchool();
  await seedAcademicStructure();
  await seedSuperAdmin();
  await seedTeachers();
  await seedStaff();
  await seedStudents();
  await seedParents();
  await seedEmployees();
  await seedAttendance();
  await seedExams();
  await computePositions();
  await seedFinance();
  await seedExpenses();
  await seedTimetable();
  await seedAssignments();
  await seedNotices();
  await seedEvents();
  await seedLibrary();
  await seedTransport();
  await seedInventory();
  await seedPayroll();
  await seedLeave();
  await seedStaffAttendance();
  await seedDemoUsers();
  await seedNotificationsAndAudit();
  await seedDocuments();

  console.log("\n✓ Seed complete");
  console.log("Demo accounts (password: Mazikor2026!)");
  console.log("  Super Admin : superadmin@mazikor.mw");
  console.log("  School Admin: admin@mazikor.mw");
  console.log("  Principal   : principal@mazikor.mw");
  console.log("  Accountant  : accountant@mazikor.mw");
  console.log("  HR          : hr@mazikor.mw");
  console.log("  Librarian   : librarian@mazikor.mw");
  console.log("  Parent      : parent@mazikor.mw");
  console.log("  Student     : student@mazikor.mw");
  console.log("  Teacher     : chisomo.banda@mazikor.mw");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
