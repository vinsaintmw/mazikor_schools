"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { auditor } from "@/lib/audit";
import { assertPermission, enumOf, getSchoolId, toBool, toDate, toInt, isValidHttpUrl, toStr } from "@/lib/server-helpers";
import { error } from "@/lib/action-result";

// ------------------------------------------------------------------
// Notices
// ------------------------------------------------------------------

export async function createNotice(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "notices.manage");
  const schoolId = getSchoolId(session);

  const title = toStr(formData.get("title"));
  const content = toStr(formData.get("content"));
  if (!title || !content) return error("Title and content are required");

  const notice = await db.notice.create({
    data: {
      schoolId,
      title,
      content,
      audience: enumOf(toStr(formData.get("audience")), ["EVERYONE", "TEACHERS", "STUDENTS", "PARENTS", "CLASS"] as const, "EVERYONE"),
      classId: toStr(formData.get("classId")) || null,
      publishDate: toDate(toStr(formData.get("publishDate"))) ?? new Date(),
      expiryDate: toDate(toStr(formData.get("expiryDate"))),
      createdById: session.user.id,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "notice", entityId: notice.id });
  revalidatePath("/notices");
}

export async function updateNotice(noticeId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "notices.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.notice.findFirst({ where: { id: noticeId, schoolId } });
  if (!existing) return error("Notice not found");

  await db.notice.update({
    where: { id: noticeId },
    data: {
      title: toStr(formData.get("title")) || existing.title,
      content: toStr(formData.get("content")) || existing.content,
      audience: enumOf(toStr(formData.get("audience")), ["EVERYONE", "TEACHERS", "STUDENTS", "PARENTS", "CLASS"] as const, existing.audience),
      classId: toStr(formData.get("classId")) || null,
      publishDate: toDate(toStr(formData.get("publishDate"))) ?? existing.publishDate,
      expiryDate: toDate(toStr(formData.get("expiryDate"))),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "notice", entityId: noticeId });
  revalidatePath("/notices");
}

export async function deleteNotice(noticeId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "notices.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.notice.findFirst({ where: { id: noticeId, schoolId } });
  if (!existing) return error("Notice not found");
  await db.notice.delete({ where: { id: noticeId } });
  await auditor(session).log({ action: "DELETE", entity: "notice", entityId: noticeId });
  revalidatePath("/notices");
}

// ------------------------------------------------------------------
// Events
// ------------------------------------------------------------------

export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "events.manage");
  const schoolId = getSchoolId(session);

  const title = toStr(formData.get("title"));
  const startDate = toDate(toStr(formData.get("startDate")));
  if (!title || !startDate) return error("Title and start date are required");

  const event = await db.event.create({
    data: {
      schoolId,
      title,
      description: toStr(formData.get("description")) || null,
      type: toStr(formData.get("type")) || "OTHER",
      startDate,
      endDate: toDate(toStr(formData.get("endDate"))),
      location: toStr(formData.get("location")) || null,
      color: toStr(formData.get("color")) || null,
      createdById: session.user.id,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "event", entityId: event.id });
  revalidatePath("/events");
}

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "events.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.event.findFirst({ where: { id: eventId, schoolId } });
  if (!existing) return error("Event not found");
  await db.event.delete({ where: { id: eventId } });
  await auditor(session).log({ action: "DELETE", entity: "event", entityId: eventId });
  revalidatePath("/events");
}

// ------------------------------------------------------------------
// Library
// ------------------------------------------------------------------

export async function createBook(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "library.manage");
  const schoolId = getSchoolId(session);

  const title = toStr(formData.get("title"));
  if (!title) return error("Book title is required");

  const quantity = toInt(formData.get("quantity"), 1);
  const book = await db.book.create({
    data: {
      schoolId,
      isbn: toStr(formData.get("isbn")) || null,
      title,
      author: toStr(formData.get("author")) || null,
      category: toStr(formData.get("category")) || null,
      publisher: toStr(formData.get("publisher")) || null,
      year: toInt(formData.get("year")) || null,
      quantity,
      available: quantity,
      shelf: toStr(formData.get("shelf")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "book", entityId: book.id });
  revalidatePath("/library");
}

export async function deleteBook(bookId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "library.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.book.findFirst({ where: { id: bookId, schoolId } });
  if (!existing) return error("Book not found");
  await db.book.delete({ where: { id: bookId } });
  await auditor(session).log({ action: "DELETE", entity: "book", entityId: bookId });
  revalidatePath("/library");
}

export async function issueBook(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "library.manage");
  const schoolId = getSchoolId(session);

  const bookId = toStr(formData.get("bookId"));
  const studentId = toStr(formData.get("studentId"));
  const dueDate = toDate(toStr(formData.get("dueDate")));
  if (!bookId || !studentId || !dueDate) return error("Book, student and due date are required");

  const book = await db.book.findFirst({ where: { id: bookId, schoolId } });
  if (!book) return error("Book not found");
  if (book.available <= 0) return error("No copies available");

  await db.bookLoan.create({
    data: {
      schoolId,
      bookId,
      studentId,
      dueDate,
    },
  });
  await db.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } });
  revalidatePath("/library");
}

export async function returnBook(loanId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "library.manage");
  const schoolId = getSchoolId(session);
  const loan = await db.bookLoan.findFirst({ where: { id: loanId, schoolId } });
  if (!loan) return error("Loan not found");
  await db.bookLoan.update({
    where: { id: loanId },
    data: { returnDate: new Date(), status: "RETURNED" },
  });
  await db.book.update({ where: { id: loan.bookId }, data: { available: { increment: 1 } } });
  revalidatePath("/library");
}

// ------------------------------------------------------------------
// Transport
// ------------------------------------------------------------------

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "transport.manage");
  const schoolId = getSchoolId(session);

  const registration = toStr(formData.get("registration"));
  if (!registration) return error("Registration number is required");

  const vehicle = await db.vehicle.create({
    data: {
      schoolId,
      registration,
      type: toStr(formData.get("type")) || null,
      capacity: toInt(formData.get("capacity"), 30),
      driverName: toStr(formData.get("driverName")) || null,
      status: toStr(formData.get("status")) || "ACTIVE",
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "vehicle", entityId: vehicle.id });
  revalidatePath("/transport");
}

export async function deleteVehicle(vehicleId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "transport.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.vehicle.findFirst({ where: { id: vehicleId, schoolId } });
  if (!existing) return error("Vehicle not found");
  await db.vehicle.delete({ where: { id: vehicleId } });
  await auditor(session).log({ action: "DELETE", entity: "vehicle", entityId: vehicleId });
  revalidatePath("/transport");
}

export async function createRoute(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "transport.manage");
  const schoolId = getSchoolId(session);

  const name = toStr(formData.get("name"));
  if (!name) return error("Route name is required");

  const vehicleId = toStr(formData.get("vehicleId")) || null;
  if (vehicleId) {
    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, schoolId } });
    if (!vehicle) return error("Invalid vehicle");
  }

  const route = await db.route.create({
    data: {
      schoolId,
      name,
      vehicleId,
      driverName: toStr(formData.get("driverName")) || null,
      capacity: toInt(formData.get("capacity"), 30),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "route", entityId: route.id });
  revalidatePath("/transport");
}

export async function deleteRoute(routeId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "transport.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.route.findFirst({ where: { id: routeId, schoolId } });
  if (!existing) return error("Route not found");
  await db.route.delete({ where: { id: routeId } });
  await auditor(session).log({ action: "DELETE", entity: "route", entityId: routeId });
  revalidatePath("/transport");
}

// ------------------------------------------------------------------
// Inventory
// ------------------------------------------------------------------

export async function createInventoryItem(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "inventory.manage");
  const schoolId = getSchoolId(session);

  const name = toStr(formData.get("name"));
  const category = toStr(formData.get("category"));
  if (!name || !category) return error("Name and category are required");

  const item = await db.inventoryItem.create({
    data: {
      schoolId,
      name,
      category,
      quantity: toInt(formData.get("quantity"), 0),
      location: toStr(formData.get("location")) || null,
      condition: toStr(formData.get("condition")) || "GOOD",
      purchaseDate: toDate(toStr(formData.get("purchaseDate"))),
      value: Number(toStr(formData.get("value")) || 0),
      notes: toStr(formData.get("notes")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "inventory_item", entityId: item.id });
  revalidatePath("/inventory");
}

export async function deleteInventoryItem(itemId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "inventory.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.inventoryItem.findFirst({ where: { id: itemId, schoolId } });
  if (!existing) return error("Item not found");
  await db.inventoryItem.delete({ where: { id: itemId } });
  await auditor(session).log({ action: "DELETE", entity: "inventory_item", entityId: itemId });
  revalidatePath("/inventory");
}

// ------------------------------------------------------------------
// School profile / branding
// ------------------------------------------------------------------

export async function updateSchoolProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "settings.manage");
  const schoolId = getSchoolId(session);

  const existing = await db.school.findUnique({ where: { id: schoolId } });
  if (!existing) return error("School not found");

  const name = toStr(formData.get("name"));
  if (!name) return error("School name is required", { name: "School name is required" });

  const logo = toStr(formData.get("logo")) || null;
  if (logo && !isValidHttpUrl(logo)) return error("Logo must be a valid http(s) image URL", { logo: "Enter a valid http(s) URL" });

  await db.school.update({
    where: { id: schoolId },
    data: {
      name,
      motto: toStr(formData.get("motto")) || null,
      address: toStr(formData.get("address")) || null,
      phone: toStr(formData.get("phone")) || null,
      email: toStr(formData.get("email")) || null,
      website: toStr(formData.get("website")) || null,
      registrationNumber: toStr(formData.get("registrationNumber")) || null,
      currency: toStr(formData.get("currency")) || existing.currency,
      currencySymbol: toStr(formData.get("currencySymbol")) || existing.currencySymbol,
      logo,
      primaryColor: toStr(formData.get("primaryColor")) || existing.primaryColor,
      secondaryColor: toStr(formData.get("secondaryColor")) || existing.secondaryColor,
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "school", entityId: schoolId });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
