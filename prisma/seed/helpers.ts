import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const db = new PrismaClient();
export const PASSWORD = "Mazikor2026!";

export const SCHOOL_INFO = {
  name: "Mazikor Secondary School",
  code: "MAZIKOR",
  slug: "mazikor",
  address: "Box 1234, Lilongwe, Malawi",
  phone: "+265 999 123 456",
  email: "info@mazikor.mw",
  website: "https://mazikor.mw",
  registrationNumber: "MSS/REG/2001/014",
  motto: "Knowledge, Integrity, Excellence",
  currency: "MWK",
  currencySymbol: "MK",
  primaryColor: "#1d4ed8",
};

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = mulberry32(20260101);
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
export const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
export const chance = (p: number) => rand() < p;

export const FIRST_M = [
  "Chimwemwe", "Kondwani", "Blessings", "Thoko", "Limbani", "Madalitso", "Chikondi", "Yamikani",
  "Tawonga", "Dumisani", "Tamanda", "Wongani", "Mphatso", "Gift", "James", "Peter", "John",
  "David", "Samuel", "Daniel", "Emmanuel", "Wisdom", "Lusekero", "Enock", "Fatsani", "Charles",
  "Isaac", "Osman", "Tadala", "Gomeza",
];
export const FIRST_F = [
  "Chisomo", "Thandiwe", "Grace", "Mary", "Mwai", "Linda", "Ruth", "Memory", "Amina", "Precious",
  "Patricia", "Chimwemwe", "Mwabvuto", "Rebecca", "Sarah", "Esther", "Norah", "Catherine",
  "Alinafe", "Maureen", "Ethel", "Glory", "Salome", "Takondwa", "Tawina", "Wezi", "Vitumbiko",
  "Rita", "Blessings", "Mwape",
];
export const LAST = [
  "Banda", "Phiri", "Moyo", "Mwale", "Chirwa", "Mbewe", "Kachale", "Ngwira", "Gondwe", "Tembo",
  "Nyirenda", "Zulu", "Kumwenda", "Chimwaza", "Mhango", "Jere", "Chavula", "Kapanda", "Mulenga",
  "Mkandawire", "Msowoya", "Kamanga", "Chiwale", "Bandawe", "Soko", "Nkhoma", "Maziko", "Kalombo",
  "Lunga", "Kanyenda",
];
export const MALAWI_TOWNS = [
  "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu", "Dedza", "Salima", "Mangochi", "Karonga",
  "Nkhata Bay", "Balaka", "Mchinji", "Ntcheu", "Rumphi", "Mzimba",
];

export const SUBJECT_DEFS = [
  { code: "ENG", name: "English", dept: "Languages", passMark: 50 },
  { code: "CHI", name: "Chichewa", dept: "Languages", passMark: 50 },
  { code: "FRN", name: "French", dept: "Languages", passMark: 40 },
  { code: "MTH", name: "Mathematics", dept: "Mathematics", passMark: 50 },
  { code: "PSC", name: "Physical Science", dept: "Sciences", passMark: 40 },
  { code: "BIO", name: "Biology", dept: "Sciences", passMark: 40 },
  { code: "HIS", name: "History", dept: "Humanities", passMark: 40 },
  { code: "GEO", name: "Geography", dept: "Humanities", passMark: 40 },
  { code: "AGR", name: "Agriculture", dept: "Agriculture", passMark: 40 },
  { code: "CMP", name: "Computer Studies", dept: "Sciences", passMark: 40 },
  { code: "LSC", name: "Life Skills", dept: "Humanities", passMark: 40 },
  { code: "RST", name: "Religious Studies", dept: "Humanities", passMark: 40 },
  { code: "BUS", name: "Business Studies", dept: "Business", passMark: 40 },
  { code: "ACC", name: "Accounting", dept: "Business", passMark: 40 },
  { code: "SOC", name: "Social Studies", dept: "Humanities", passMark: 40 },
] as const;

export const FORM_SUBJECTS: Record<number, string[]> = {
  1: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
  2: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
  3: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
  4: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
};

export const TEACHER_NAMES = [
  { first: "Chisomo", last: "Banda", spec: "Mathematics" },
  { first: "Grace", last: "Phiri", spec: "English" },
  { first: "Kondwani", last: "Mwale", spec: "Physical Science" },
  { first: "Thandiwe", last: "Moyo", spec: "Biology" },
  { first: "Mphatso", last: "Chirwa", spec: "History" },
  { first: "Limbani", last: "Mbewe", spec: "Geography" },
  { first: "Ruth", last: "Kachale", spec: "Chichewa" },
  { first: "Blessings", last: "Ngwira", spec: "Computer Studies" },
  { first: "Patricia", last: "Gondwe", spec: "Accounting" },
  { first: "Yamikani", last: "Tembo", spec: "Agriculture" },
  { first: "Mary", last: "Nyirenda", spec: "Life Skills" },
  { first: "Daniel", last: "Zulu", spec: "French" },
];

export const SUBJECT_SPEC: Record<string, string[]> = {
  Mathematics: ["MTH"],
  English: ["ENG"],
  "Physical Science": ["PSC"],
  Biology: ["BIO"],
  History: ["HIS"],
  Geography: ["GEO"],
  Chichewa: ["CHI"],
  "Computer Studies": ["CMP"],
  Accounting: ["ACC", "BUS"],
  Agriculture: ["AGR"],
  "Life Skills": ["LSC", "SOC", "RST"],
  French: ["FRN"],
};

export const STAFF_DEFS = [
  { first: "Rebecca", last: "Kamanga", position: "School Secretary", dept: "Administration" },
  { first: "Emmanuel", last: "Msowoya", position: "Groundskeeper", dept: "Operations" },
  { first: "Tadala", last: "Kalombo", position: "Kitchen Supervisor", dept: "Catering" },
  { first: "Charles", last: "Bandawe", position: "Security Officer", dept: "Operations" },
  { first: "Rita", last: "Soko", position: "Administrative Officer", dept: "Administration" },
];

export const HOUSES = ["Lilongwe House", "Mulanje House", "Zomba House", "Nyika House"];

export interface SeedCtx {
  year: number;
  school: { id: string; name: string };
  roles: Record<string, string>;
  plans: Record<string, string>;
  terms: Record<string, string>;
  academicYear: { id: string; name: string };
  gradeScale: { id: string };
  departments: Record<string, string>;
  subjects: Record<string, string>;
  classes: Record<string, { id: string; streams: Record<string, string> }>;
  teacherIds: string[];
  staffIds: string[];
  employeeIds: string[];
  studentIds: string[];
  students: { id: string; first: string; last: string; gender: string; streamId: string; className: string; level: number }[];
  parentIds: string[];
  superAdminId: string;
}

export const ctx: SeedCtx = {
  year: new Date().getFullYear(),
  school: { id: "", name: "" },
  roles: {},
  plans: {},
  terms: {},
  academicYear: { id: "", name: "" },
  gradeScale: { id: "" },
  departments: {},
  subjects: {},
  classes: {},
  teacherIds: [],
  staffIds: [],
  employeeIds: [],
  studentIds: [],
  students: [],
  parentIds: [],
  superAdminId: "",
};

export async function hashPassword(): Promise<string> {
  return bcrypt.hash(PASSWORD, 10);
}

export function deptForSpec(spec: string, departments: Record<string, string>): string | null {
  const code = SUBJECT_SPEC[spec]?.[0];
  if (!code) return null;
  if (code === "MTH") return departments.Mathematics;
  if (code === "ENG" || code === "CHI" || code === "FRN") return departments.Languages;
  if (code === "ACC" || code === "BUS") return departments.Business;
  if (code === "AGR") return departments.Agriculture;
  return departments.Sciences;
}

export async function wipeSchoolData() {
  const t = [
    db.auditLog.deleteMany({}),
    db.notification.deleteMany({}),
    db.document.deleteMany({}),
    db.payroll.deleteMany({}),
    db.leave.deleteMany({}),
    db.employee.deleteMany({}),
    db.staffAttendance.deleteMany({}),
    db.inventoryItem.deleteMany({}),
    db.route.deleteMany({}),
    db.vehicle.deleteMany({}),
    db.bookLoan.deleteMany({}),
    db.book.deleteMany({}),
    db.event.deleteMany({}),
    db.notice.deleteMany({}),
    db.assignmentSubmission.deleteMany({}),
    db.assignment.deleteMany({}),
    db.timetableEntry.deleteMany({}),
    db.expense.deleteMany({}),
    db.payment.deleteMany({}),
    db.invoiceItem.deleteMany({}),
    db.invoice.deleteMany({}),
    db.feeStructure.deleteMany({}),
    db.result.deleteMany({}),
    db.examSubject.deleteMany({}),
    db.exam.deleteMany({}),
    db.gradeBand.deleteMany({}),
    db.gradeScale.deleteMany({}),
    db.attendance.deleteMany({}),
    db.subjectTeacher.deleteMany({}),
    db.classSubject.deleteMany({}),
    db.studentParent.deleteMany({}),
    db.parent.deleteMany({}),
    db.enrollment.deleteMany({}),
    db.studentNote.deleteMany({}),
    db.student.deleteMany({}),
    db.teacher.deleteMany({}),
    db.staff.deleteMany({}),
    db.stream.deleteMany({}),
    db.class.deleteMany({}),
    db.subject.deleteMany({}),
    db.department.deleteMany({}),
    db.term.deleteMany({}),
    db.academicYear.deleteMany({}),
    db.subscription.deleteMany({}),
    db.user.deleteMany({}),
    db.school.deleteMany({}),
    db.plan.deleteMany({}),
    db.rolePermission.deleteMany({}),
    db.role.deleteMany({}),
  ];
  await db.$transaction(t);
  console.log("✓ wiped previous demo data");
}
