import { db, ctx, randInt, chance, pick } from "./helpers";
import { Prisma } from "@prisma/client";

export async function seedFinance() {
  const feeDefs = [
    { name: "Tuition Fee", category: "Tuition", amount: 120000 },
    { name: "Boarding Fee", category: "Boarding", amount: 185000 },
    { name: "Examination Fee", category: "Examination", amount: 15000 },
    { name: "Library Fee", category: "Library", amount: 8000 },
    { name: "Transport Fee", category: "Transport", amount: 35000 },
    { name: "Meals Fee", category: "Meals", amount: 90000 },
    { name: "Sports & Activities", category: "Activities", amount: 12000 },
  ];
  const feeStructureIds: string[] = [];
  for (const f of feeDefs) {
    const fs = await db.feeStructure.create({
      data: { schoolId: ctx.school.id, name: f.name, category: f.category, amount: f.amount, termId: ctx.terms["Term 2"] },
    });
    feeStructureIds.push(fs.id);
  }

  const amounts = feeDefs.map((f) => f.amount);
  let invoiceCounter = 0;
  let paymentCounter = 0;
  let invoiceCount = 0;
  let paymentCount = 0;

  for (const st of ctx.students) {
    const total = amounts.reduce((a, b) => a + b, 0);
    invoiceCounter++;
    const invoice = await db.invoice.create({
      data: {
        schoolId: ctx.school.id,
        number: `INV-${ctx.year}-${String(invoiceCounter).padStart(5, "0")}`,
        studentId: st.id,
        termId: ctx.terms["Term 2"],
        academicYearId: ctx.academicYear.id,
        dueDate: new Date(`${ctx.year}-05-25`),
        notes: `Term 2 fees for ${st.first} ${st.last}`,
        status: "UNPAID",
        items: {
          create: amounts.map((amt, i) => ({
            schoolId: ctx.school.id,
            feeStructureId: feeStructureIds[i],
            description: feeDefs[i].name,
            amount: amt,
          })),
        },
      },
    });
    invoiceCount++;

    if (chance(0.72)) {
      const payRatio = randInt(40, 100);
      const paid = Math.round((total * payRatio) / 100);
      const split = payRatio > 60 ? 2 : 1;
      let remaining = paid;
      for (let i = 0; i < split && remaining > 0; i++) {
        const amount = i === split - 1 ? remaining : Math.round(remaining / (split - i));
        remaining -= amount;
        paymentCounter++;
        await db.payment.create({
          data: {
            schoolId: ctx.school.id,
            receiptNumber: `RCT-${ctx.year}-${String(paymentCounter).padStart(5, "0")}`,
            invoiceId: invoice.id,
            studentId: st.id,
            amount,
            method: pick(["CASH", "CASH", "MOBILE_MONEY", "MOBILE_MONEY", "BANK", "CHEQUE"] as const),
            date: new Date(`${ctx.year}-${randInt(1, 7)}-${randInt(2, 27)}`),
            reference: chance(0.6) ? pickRef() : null,
          },
        });
        paymentCount++;
      }
      const sum = await db.payment.aggregate({ where: { invoiceId: invoice.id }, _sum: { amount: true } });
      const received = (sum._sum.amount ?? new Prisma.Decimal(0)).toNumber();
      if (received >= total) {
        await db.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
      } else if (received > 0) {
        await db.invoice.update({ where: { id: invoice.id }, data: { status: "PARTIALLY_PAID" } });
      }
    } else {
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: chance(0.6) ? "UNPAID" : "OVERDUE" },
      });
    }
  }
  console.log(`✓ ${invoiceCount} invoices, ${paymentCount} payments`);
}

function pickMethod() {
  return pick(["CASH", "CASH", "MOBILE_MONEY", "MOBILE_MONEY", "BANK", "CHEQUE"] as const);
}

function pickRef(): string | null {
  const refs = ["Airtel Money", "TNM Mpamba", "Standard Bank", "NBS Bank"];
  return refs[randInt(0, refs.length - 1)];
}

export async function seedExpenses() {
  const expenseDefs = [
    { category: "SALARIES", description: "Staff salaries — monthly payroll", amount: 3800000, vendor: "Payroll" },
    { category: "UTILITIES", description: "ESCOM electricity bill", amount: 145000, vendor: "ESCOM" },
    { category: "UTILITIES", description: "Water supply charges", amount: 42000, vendor: "Lilongwe Water Board" },
    { category: "MAINTENANCE", description: "Classroom roof repairs — Block C", amount: 280000, vendor: "Kamuzu Builders" },
    { category: "SUPPLIES", description: "Chalk, exercise books & stationery", amount: 185000, vendor: "Bookers Stationery" },
    { category: "SUPPLIES", description: "Laboratory chemicals", amount: 220000, vendor: "SciLab Supplies" },
    { category: "TRANSPORT", description: "Bus fuel & maintenance", amount: 190000, vendor: "TotalEnergies" },
    { category: "FOOD", description: "Maize & ingredients for boarding meals", amount: 650000, vendor: "ADMARC" },
    { category: "OTHER", description: "Internet & school software", amount: 75000, vendor: "TNMT Internet" },
  ];
  let counter = 0;
  for (const e of expenseDefs) {
    counter++;
    await db.expense.create({
      data: {
        schoolId: ctx.school.id,
        number: `EXP-${ctx.year}-${String(counter).padStart(5, "0")}`,
        category: e.category as never,
        description: e.description,
        amount: e.amount,
        date: new Date(`${ctx.year}-${randInt(1, 7)}-${randInt(2, 28)}`),
        vendor: e.vendor,
        method: pick(["BANK", "CASH", "MOBILE_MONEY"] as const),
      },
    });
  }
  console.log(`✓ ${counter} expenses`);
}
