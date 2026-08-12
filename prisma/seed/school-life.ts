import { db, ctx, randInt, chance, pick, FORM_SUBJECTS } from "./helpers";

export async function seedTimetable() {
  const periods = [
    { p: 1, start: "07:30", end: "08:30" },
    { p: 2, start: "08:35", end: "09:35" },
    { p: 3, start: "09:40", end: "10:40" },
    { p: 4, start: "10:45", end: "11:45" },
    { p: 5, start: "12:30", end: "13:30" },
    { p: 6, start: "13:35", end: "14:35" },
  ];
  let ttCount = 0;
  for (const [className, cls] of Object.entries(ctx.classes)) {
    const level = Number(className.split(" ")[1]);
    const codes = FORM_SUBJECTS[level];
    for (const streamKey of ["A", "B"]) {
      const streamId = cls.streams[streamKey];
      for (let day = 0; day < 5; day++) {
        const daySubjects = [...codes].sort(() => Math.random() - 0.5).slice(0, 6);
        const teacherIdx = randInt(0, ctx.teacherIds.length - 1);
        for (let pi = 0; pi < daySubjects.length; pi++) {
          ttCount++;
          await db.timetableEntry.create({
            data: {
              schoolId: ctx.school.id,
              streamId,
              classId: cls.id,
              teacherId: ctx.teacherIds[(teacherIdx + pi) % ctx.teacherIds.length],
              subjectId: ctx.subjects[daySubjects[pi]],
              dayOfWeek: day + 1,
              period: periods[pi].p,
              startTime: periods[pi].start,
              endTime: periods[pi].end,
              room: `R-${10 + level}`,
            },
          });
        }
      }
    }
  }
  console.log(`✓ ${ttCount} timetable entries`);
}

export async function seedAssignments() {
  const titles = [
    "Essay: Modern Life",
    "Problem Set 4",
    "Lab Report — Photosynthesis",
    "Map Work Exercise",
    "Chapter 3 Comprehension",
    "Revision Worksheet",
    "Group Project: Health",
    "Short Story Writing",
  ];
  for (let i = 0; i < 8; i++) {
    const className = `Form ${randInt(1, 4)}`;
    const codes = FORM_SUBJECTS[Number(className.split(" ")[1])];
    const code = pick(codes);
    const assignment = await db.assignment.create({
      data: {
        schoolId: ctx.school.id,
        title: pick(titles),
        description: "Complete the task and submit before the due date. Answer all questions and show your working where required.",
        instructions: "Write your answers clearly. Use the given template where provided.",
        subjectId: ctx.subjects[code],
        classId: ctx.classes[className].id,
        teacherId: ctx.teacherIds[randInt(0, ctx.teacherIds.length - 1)],
        dueDate: new Date(`${ctx.year}-${randInt(6, 8)}-${randInt(1, 25)}`),
      },
    });
    const classStudents = ctx.students.filter((s) => s.className === className);
    const subs = classStudents.slice(0, randInt(5, classStudents.length));
    for (const st of subs) {
      await db.assignmentSubmission.create({
        data: {
          schoolId: ctx.school.id,
          assignmentId: assignment.id,
          studentId: st.id,
          content: "Please find my completed submission attached. I have answered all questions.",
          submittedAt: new Date(`${ctx.year}-${randInt(6, 8)}-${randInt(1, 20)}`),
          grade: randInt(40, 100),
          feedback: chance(0.5) ? pick(["Good work!", "Well done, keep it up.", "Please work on showing your working.", "Excellent effort!"]) : null,
        },
      });
    }
  }
  console.log("✓ assignments");
}

export async function seedNotices() {
  const noticeDefs = [
    { title: "Term 2 Mid-Year Examinations", audience: "STUDENTS", content: "Mid-year examinations begin on 22 June. Revision timetable has been shared with class teachers. Please report to the exam room 15 minutes early." },
    { title: "Parents' Meeting — Fee Collection", audience: "PARENTS", content: "There will be a parents meeting on 15 August to discuss term 2 fee collection and the upcoming end of year events. All parents are encouraged to attend." },
    { title: "Staff Meeting: Examination Guidelines", audience: "TEACHERS", content: "All staff are required to attend a briefing on examination guidelines on Friday at 14:00 in the staff room." },
    { title: "Sports Day Announced", audience: "EVERYONE", content: "Annual Sports Day will be held on 12 September. All students should register for their events with their class teacher by 25 August." },
    { title: "Library Orientation Week", audience: "STUDENTS", content: "New students are invited to a library orientation session. The library is open 08:00–17:00 weekdays." },
  ];
  for (const n of noticeDefs) {
    await db.notice.create({
      data: {
        schoolId: ctx.school.id,
        title: n.title,
        content: n.content,
        audience: n.audience as never,
        publishDate: new Date(`${ctx.year}-${randInt(5, 7)}-${randInt(1, 28)}`),
        expiryDate: new Date(`${ctx.year}-12-01`),
        createdById: ctx.superAdminId,
      },
    });
  }
  console.log(`✓ ${noticeDefs.length} notices`);
}

export async function seedEvents() {
  const eventDefs = [
    { title: "Sports Day", type: "SPORTS", start: `${ctx.year}-09-12`, end: `${ctx.year}-09-12`, color: "#16a34a", description: "Annual athletics and sports day. All houses participate." },
    { title: "Parents Meeting", type: "MEETING", start: `${ctx.year}-08-15`, end: `${ctx.year}-08-15`, color: "#2563eb", description: "Term 2 parent meeting and fee collection." },
    { title: "Mid-Year Examinations", type: "EXAM", start: `${ctx.year}-06-22`, end: `${ctx.year}-07-02`, color: "#dc2626", description: "Mid-year examinations for all forms." },
    { title: "Graduation & Prize Giving", type: "GRADUATION", start: `${ctx.year}-11-28`, end: `${ctx.year}-11-28`, color: "#7c3aed", description: "Annual graduation and prize giving ceremony." },
    { title: "School Trip — Lake Malawi", type: "TRIP", start: `${ctx.year}-10-09`, end: `${ctx.year}-10-11`, color: "#0d9488", description: "Educational trip to Lake Malawi for Form 2 students." },
    { title: "Staff Meeting", type: "MEETING", start: `${ctx.year}-08-07`, end: `${ctx.year}-08-07`, color: "#475569", description: "Monthly staff meeting in the staff room." },
  ];
  for (const e of eventDefs) {
    await db.event.create({
      data: {
        schoolId: ctx.school.id,
        title: e.title,
        description: e.description,
        type: e.type,
        startDate: new Date(e.start),
        endDate: new Date(e.end),
        location: e.type === "TRIP" ? "Mangochi" : "Mazikor Secondary School",
        color: e.color,
        createdById: ctx.superAdminId,
      },
    });
  }
  console.log(`✓ ${eventDefs.length} events`);
}

export async function seedLibrary() {
  const books = [
    { title: "Things Fall Apart", author: "Chinua Achebe", cat: "Literature" },
    { title: "Weep Not, Child", author: "Ngugi wa Thiong'o", cat: "Literature" },
    { title: "The River Between", author: "Ngugi wa Thiong'o", cat: "Literature" },
    { title: "Sunrise on the Lake", author: "Edwin W. Smith", cat: "Literature" },
    { title: "Mathematics for Secondary Schools", author: "C. Banda", cat: "Mathematics" },
    { title: "Physics in Action", author: "J. Kamanga", cat: "Science" },
    { title: "Chemistry Matters", author: "R. Phiri", cat: "Science" },
    { title: "Biology for Everyone", author: "T. Moyo", cat: "Science" },
    { title: "Understanding History", author: "M. Chirwa", cat: "History" },
    { title: "Geography of Malawi", author: "L. Mbewe", cat: "Geography" },
    { title: "English Grammar Made Easy", author: "G. Phiri", cat: "Languages" },
    { title: "Chichewa Literature", author: "R. Kachale", cat: "Languages" },
    { title: "Business Studies in Malawi", author: "P. Gondwe", cat: "Business" },
    { title: "Agriculture for Life", author: "Y. Tembo", cat: "Agriculture" },
    { title: "Computer Studies Basics", author: "B. Ngwira", cat: "Technology" },
    { title: "Life Skills Handbook", author: "M. Nyirenda", cat: "Guidance" },
  ];
  for (const b of books) {
    const book = await db.book.create({
      data: {
        schoolId: ctx.school.id,
        title: b.title,
        author: b.author,
        category: b.cat,
        isbn: `978${randInt(1000000000, 9999999999)}`,
        publisher: pick(["Macmillan", "Oxford University Press", "Longman Malawi", "Chanco Press", "Heinemann"]),
        year: randInt(1990, 2023),
        quantity: randInt(2, 12),
        shelf: pick(["A1", "A2", "B1", "B2", "C1", "D1", "D2"]),
      },
    });
    await db.book.update({ where: { id: book.id }, data: { available: book.quantity } });
  }

  // borrowings
  const allBooks = await db.book.findMany({ where: { schoolId: ctx.school.id } });
  for (let i = 0; i < 25; i++) {
    const book = pick(allBooks);
    const student = pick(ctx.students);
    const due = new Date();
    due.setDate(due.getDate() + randInt(-10, 14));
    await db.bookLoan.create({
      data: {
        schoolId: ctx.school.id,
        bookId: book.id,
        studentId: student.id,
        borrowDate: new Date(ctx.year, randInt(4, 7), randInt(1, 28)),
        dueDate: due,
        status: chance(0.4) ? "RETURNED" : "BORROWED",
        returnDate: chance(0.4) ? new Date() : null,
      },
    });
  }
  console.log(`✓ ${allBooks.length} books + loans`);
}

export async function seedTransport() {
  const vehicles = [
    { registration: "BL 4321", type: "Bus", capacity: 60, driver: "Mr. J. Chimwaza" },
    { registration: "BL 5567", type: "Bus", capacity: 45, driver: "Mr. A. Lungu" },
    { registration: "LL 9012", type: "Minibus", capacity: 15, driver: "Mr. K. Mwale" },
  ];
  const vehicleIds: string[] = [];
  for (const v of vehicles) {
    const vehicle = await db.vehicle.create({
      data: { schoolId: ctx.school.id, registration: v.registration, type: v.type, capacity: v.capacity, driverName: v.driver },
    });
    vehicleIds.push(vehicle.id);
  }
  const routes = [
    { name: "Area 25 — City Centre", pickup: ["Area 25", "Area 24", "Bwaila"], vehicle: vehicleIds[0] },
    { name: "Kanengo — Town", pickup: ["Kanengo", "Kawale", "Mgona"], vehicle: vehicleIds[1] },
    { name: "Mtsiriza — Malingunde", pickup: ["Mtsiriza", "Chinsapo", "Malingunde"], vehicle: vehicleIds[2] },
  ];
  for (const r of routes) {
    await db.route.create({
      data: {
        schoolId: ctx.school.id,
        name: r.name,
        pickupPoints: r.pickup,
        vehicleId: r.vehicle,
        driverName: vehicles[routes.indexOf(r)].driver,
        capacity: vehicles[routes.indexOf(r)].capacity,
      },
    });
  }
  console.log(`✓ ${vehicleIds.length} vehicles, ${routes.length} routes`);
}

export async function seedInventory() {
  const items = [
    { name: "Classroom desks", category: "Furniture", quantity: 120, location: "Storage A", condition: "GOOD", value: 3600000 },
    { name: "Laboratory microscopes", category: "Laboratory equipment", quantity: 12, location: "Science Lab", condition: "GOOD", value: 1800000 },
    { name: "Computer desktops", category: "Computers", quantity: 25, location: "Computer Lab", condition: "GOOD", value: 4500000 },
    { name: "Projector", category: "Computers", quantity: 3, location: "ICT Office", condition: "FAIR", value: 900000 },
    { name: "Chalk & board markers", category: "Stationery", quantity: 200, location: "Store Room", condition: "NEW", value: 120000 },
    { name: "Footballs", category: "Sports equipment", quantity: 15, location: "Sports Store", condition: "GOOD", value: 90000 },
    { name: "Volleyball nets", category: "Sports equipment", quantity: 6, location: "Sports Store", condition: "FAIR", value: 75000 },
    { name: "Physics force tables", category: "Laboratory equipment", quantity: 8, location: "Science Lab", condition: "GOOD", value: 400000 },
    { name: "Pupil lockers", category: "Furniture", quantity: 60, location: "Dormitory A", condition: "GOOD", value: 900000 },
    { name: "Beakers & glassware", category: "Laboratory equipment", quantity: 300, location: "Science Lab", condition: "GOOD", value: 250000 },
  ];
  for (const it of items) {
    await db.inventoryItem.create({
      data: {
        schoolId: ctx.school.id,
        name: it.name,
        category: it.category,
        quantity: it.quantity,
        location: it.location,
        condition: it.condition,
        purchaseDate: new Date(ctx.year - randInt(0, 5), randInt(1, 12), randInt(1, 28)),
        value: it.value,
      },
    });
  }
  console.log(`✓ ${items.length} inventory items`);
}
