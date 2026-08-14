// ============================================================
// Mazikor Schools — application constants
// Roles, permissions, navigation, status labels
// ============================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Mazikor Schools";
export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE || "Smart School Management, Made Simple.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://schools.mazikor.com";

export const BRAND_COLORS = {
  primary: "#1d4ed8",
  secondary: "#059669",
  accent: "#d97706",
  danger: "#dc2626",
  info: "#7c3aed",
  success: "#0891b2",
} as const;

export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  PRINCIPAL: "principal",
  TEACHER: "teacher",
  ACCOUNTANT: "accountant",
  PARENT: "parent",
  STUDENT: "student",
  LIBRARIAN: "librarian",
  HR: "hr",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

// Every permission used in the application.
export const PERMISSIONS = {
  // students
  "students.view": "View students",
  "students.create": "Create students",
  "students.edit": "Edit students",
  "students.delete": "Delete students",
  "students.import": "Import students",
  "students.export": "Export students",
  // parents
  "parents.view": "View parents",
  "parents.create": "Create parents",
  "parents.edit": "Edit parents",
  "parents.delete": "Delete parents",
  // teachers
  "teachers.view": "View teachers",
  "teachers.create": "Create teachers",
  "teachers.edit": "Edit teachers",
  "teachers.delete": "Delete teachers",
  // staff
  "staff.view": "View staff",
  "staff.create": "Create staff",
  "staff.edit": "Edit staff",
  "staff.delete": "Delete staff",
  // classes & subjects
  "classes.view": "View classes",
  "classes.create": "Create classes",
  "classes.edit": "Edit classes",
  "classes.delete": "Delete classes",
  "subjects.view": "View subjects",
  "subjects.create": "Create subjects",
  "subjects.edit": "Edit subjects",
  "subjects.delete": "Delete subjects",
  // attendance
  "attendance.view": "View attendance",
  "attendance.manage": "Manage attendance",
  // exams & results
  "exams.view": "View exams",
  "exams.create": "Create exams",
  "exams.edit": "Edit exams",
  "exams.delete": "Delete exams",
  "exams.publish": "Publish results",
  "results.enter": "Enter results",
  "results.view": "View results",
  "results.approve": "Approve results",
  "reportcards.view": "View report cards",
  "reportcards.print": "Print report cards",
  // timetable & assignments
  "timetable.view": "View timetable",
  "timetable.manage": "Manage timetable",
  "assignments.view": "View assignments",
  "assignments.create": "Create assignments",
  "assignments.grade": "Grade submissions",
  // notices & events
  "notices.view": "View notices",
  "notices.manage": "Manage notices",
  "events.view": "View events",
  "events.manage": "Manage events",
  // finance
  "fees.view": "View fees",
  "fees.manage": "Manage fee structures",
  "invoices.view": "View invoices",
  "invoices.create": "Create invoices",
  "payments.view": "View payments",
  "payments.record": "Record payments",
  "expenses.view": "View expenses",
  "expenses.manage": "Manage expenses",
  "finance.reports": "View financial reports",
  // library / transport / inventory
  "library.view": "View library",
  "library.manage": "Manage library",
  "transport.view": "View transport",
  "transport.manage": "Manage transport",
  "inventory.view": "View inventory",
  "inventory.manage": "Manage inventory",
  // HR
  "hr.view": "View HR",
  "hr.manage": "Manage HR",
  "leave.view": "View leave",
  "leave.manage": "Manage leave",
  "payroll.view": "View payroll",
  "payroll.manage": "Manage payroll",
  // reports & settings
  "reports.view": "View reports",
  "settings.view": "View settings",
  "settings.manage": "Manage settings",
  "users.manage": "Manage users",
  "documents.view": "View documents",
  "documents.manage": "Manage documents",
  "audit.view": "View audit logs",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = string;

const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

const can = (...perms: string[]) => {
  const set = new Set(perms);
  return ALL_PERMISSIONS.filter((p) => set.has(p));
};

// Default permission sets per built-in role.
export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  school_admin: ALL_PERMISSIONS,
  principal: can(
    "students.view", "students.create", "students.edit", "students.import", "students.export",
    "parents.view", "parents.create", "parents.edit",
    "teachers.view", "teachers.create", "teachers.edit",
    "staff.view",
    "classes.view", "classes.create", "classes.edit",
    "subjects.view", "subjects.create", "subjects.edit",
    "attendance.view", "attendance.manage",
    "exams.view", "exams.create", "exams.edit", "exams.publish",
    "results.enter", "results.view", "results.approve",
    "reportcards.view", "reportcards.print",
    "timetable.view", "timetable.manage",
    "assignments.view",
    "notices.view", "notices.manage",
    "events.view", "events.manage",
    "fees.view", "invoices.view", "payments.view", "expenses.view", "finance.reports",
    "library.view", "transport.view", "inventory.view",
    "hr.view", "leave.view",
    "reports.view", "settings.view", "documents.view", "audit.view",
  ),
  teacher: can(
    "students.view",
    "attendance.view", "attendance.manage",
    "exams.view", "results.enter", "results.view",
    "reportcards.view",
    "timetable.view",
    "assignments.view", "assignments.create", "assignments.grade",
    "notices.view", "events.view",
    "fees.view",
    "documents.view",
  ),
  accountant: can(
    "students.view",
    "fees.view", "fees.manage",
    "invoices.view", "invoices.create",
    "payments.view", "payments.record",
    "expenses.view", "expenses.manage",
    "finance.reports",
    "reports.view",
    "notices.view", "events.view",
  ),
  parent: can(
    "students.view", "attendance.view", "results.view", "reportcards.view",
    "fees.view", "invoices.view",
    "timetable.view", "assignments.view",
    "notices.view", "events.view",
    "documents.view",
  ),
  student: can(
    "students.view", "attendance.view", "results.view", "reportcards.view",
    "fees.view", "timetable.view", "assignments.view",
    "notices.view", "events.view",
  ),
  librarian: can(
    "students.view",
    "library.view", "library.manage",
    "reports.view",
    "notices.view", "events.view",
  ),
  hr: can(
    "staff.view", "staff.create", "staff.edit",
    "teachers.view",
    "hr.view", "hr.manage",
    "leave.view", "leave.manage",
    "payroll.view", "payroll.manage",
    "reports.view",
    "notices.view", "events.view",
  ),
};

export const isSuperAdmin = (roleKey?: string | null) => roleKey === ROLE_KEYS.SUPER_ADMIN;

// ------------------------------------------------------------------
// Navigation
// ------------------------------------------------------------------

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  permission?: string;
  section?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  { title: "Overview", items: [{ title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" }] },
  {
    title: "People",
    items: [
      { title: "Students", href: "/students", icon: "users", permission: "students.view" },
      { title: "Parents", href: "/parents", icon: "user-heart", permission: "parents.view" },
      { title: "Teachers", href: "/teachers", icon: "graduation-cap", permission: "teachers.view" },
      { title: "Staff", href: "/staff", icon: "user-cog", permission: "staff.view" },
    ],
  },
  {
    title: "Academics",
    items: [
      { title: "Classes", href: "/classes", icon: "school", permission: "classes.view" },
      { title: "Subjects", href: "/subjects", icon: "book-open", permission: "subjects.view" },
      { title: "Attendance", href: "/attendance", icon: "calendar-check", permission: "attendance.view" },
      { title: "Examinations", href: "/exams", icon: "file-text", permission: "exams.view" },
      { title: "Results", href: "/results", icon: "award", permission: "results.view" },
      { title: "Report Cards", href: "/report-cards", icon: "file-spreadsheet", permission: "reportcards.view" },
      { title: "Timetable", href: "/timetable", icon: "calendar-clock", permission: "timetable.view" },
      { title: "Assignments", href: "/assignments", icon: "clipboard-list", permission: "assignments.view" },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Fee Structures", href: "/fees", icon: "tags", permission: "fees.view" },
      { title: "Invoices", href: "/invoices", icon: "file-invoice", permission: "invoices.view" },
      { title: "Payments", href: "/payments", icon: "wallet", permission: "payments.view" },
      { title: "Expenses", href: "/expenses", icon: "receipt", permission: "expenses.view" },
      { title: "Financial Reports", href: "/finance", icon: "chart-column", permission: "finance.reports" },
    ],
  },
  {
    title: "School",
    items: [
      { title: "Notices", href: "/notices", icon: "megaphone", permission: "notices.view" },
      { title: "Events", href: "/events", icon: "party-popper", permission: "events.view" },
      { title: "Library", href: "/library", icon: "library", permission: "library.view" },
      { title: "Transport", href: "/transport", icon: "bus", permission: "transport.view" },
      { title: "Inventory", href: "/inventory", icon: "boxes", permission: "inventory.view" },
    ],
  },
  {
    title: "HR",
    items: [
      { title: "Employees", href: "/hr/employees", icon: "briefcase", permission: "hr.view" },
      { title: "Leave", href: "/hr/leave", icon: "calendar-off", permission: "leave.view" },
      { title: "Payroll", href: "/hr/payroll", icon: "banknote", permission: "payroll.view" },
    ],
  },
  { title: "Insights", items: [{ title: "Reports", href: "/reports", icon: "bar-chart-3", permission: "reports.view" }] },
  { title: "System", items: [{ title: "Settings", href: "/settings", icon: "settings", permission: "settings.view" }] },
];

export const ADMIN_NAV: NavSection[] = [
  { title: "Overview", items: [{ title: "Overview", href: "/admin", icon: "layout-dashboard" }] },
  {
    title: "Platform",
    items: [
      { title: "Schools", href: "/admin/schools", icon: "school" },
      { title: "Plans", href: "/admin/plans", icon: "package" },
      { title: "Subscriptions", href: "/admin/subscriptions", icon: "credit-card" },
      { title: "Users", href: "/admin/users", icon: "users" },
      { title: "Activity", href: "/admin/activity", icon: "activity" },
      { title: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

// ------------------------------------------------------------------
// Labels / option maps
// ------------------------------------------------------------------

export const STUDENT_STATUSES = ["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"] as const;
export const SUB_INTERVALS = ["MONTHLY", "YEARLY"] as const;
export const SUB_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED", "INCOMPLETE"] as const;
export const GENDERS = ["MALE", "FEMALE"] as const;
export const EXAM_TYPES = ["TEST", "MID_TERM", "END_OF_TERM", "MOCK", "FINAL"] as const;
export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
] as const;
export const EXPENSE_CATEGORIES = [
  { value: "SALARIES", label: "Salaries" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "FOOD", label: "Food" },
  { value: "OTHER", label: "Other" },
] as const;
export const NOTICE_AUDIENCES = [
  { value: "EVERYONE", label: "Everyone" },
  { value: "TEACHERS", label: "Teachers" },
  { value: "STUDENTS", label: "Students" },
  { value: "PARENTS", label: "Parents" },
  { value: "CLASS", label: "Specific Class" },
] as const;
export const LEAVE_TYPES = ["ANNUAL", "SICK", "MATERNITY", "EMERGENCY", "OTHER"] as const;
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const PERIOD_TIMES = [
  { period: 1, start: "07:30", end: "08:30" },
  { period: 2, start: "08:35", end: "09:35" },
  { period: 3, start: "09:40", end: "10:40" },
  { period: 4, start: "10:45", end: "11:45" },
  { period: 5, start: "12:30", end: "13:30" },
  { period: 6, start: "13:35", end: "14:35" },
  { period: 7, start: "14:40", end: "15:40" },
] as const;

export const GRADE_SCALE_DEFAULT = [
  { min: 80, max: 100, grade: "A", points: 1, remark: "Excellent" },
  { min: 70, max: 79, grade: "B", points: 2, remark: "Very Good" },
  { min: 60, max: 69, grade: "C", points: 3, remark: "Good" },
  { min: 50, max: 59, grade: "D", points: 4, remark: "Fair" },
  { min: 40, max: 49, grade: "E", points: 5, remark: "Pass" },
  { min: 0, max: 39, grade: "F", points: 6, remark: "Fail" },
];

export function getLabel(value: string, list: readonly (string | { value: string; label: string })[]): string {
  for (const item of list) {
    if (typeof item === "string") {
      if (item === value) return item.replace(/_/g, " ");
    } else {
      if (item.value === value) return item.label;
    }
  }
  return value.replace(/_/g, " ");
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
