import { WalletIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { PaymentsTable, type PaymentRow } from "@/components/finance/payments-table";
import { recordPayment } from "@/lib/actions/finance";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  async function loadMorePayments(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.payment.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { receiptNumber: { contains: search, mode: "insensitive" as const } },
                { student: { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }] } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        method: true,
        date: true,
        student: { select: { firstName: true, lastName: true } },
        invoice: { select: { number: true, status: true } },
      },
      orderBy: { date: "desc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as PaymentRow[];
  }

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { receiptNumber: { contains: search, mode: "insensitive" as const } },
            { student: { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }] } },
          ],
        }
      : {}),
  };

  const [payments, total, invoices] = await Promise.all([
    db.payment.findMany({
      where,
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        method: true,
        date: true,
        student: { select: { firstName: true, lastName: true } },
        invoice: { select: { number: true, status: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    db.payment.count({ where }),
    db.invoice.findMany({
      where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } },
      select: {
        id: true,
        number: true,
        discount: true,
        student: { select: { firstName: true, lastName: true } },
        items: { select: { amount: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const canRecord = can(session, "payments.record");
  const canDelete = can(session, "payments.record");

  return (
    <div className="space-y-4">
      <PageHeader title="Payments" description="Recorded payments and receipts">
        {canRecord ? (
          <RecordPaymentDialog
            action={recordPayment}
            invoices={invoices.map((inv) => ({
              id: inv.id,
              number: inv.number,
              studentName: `${inv.student.firstName} ${inv.student.lastName}`,
              amount: inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount),
              paid: inv.payments.reduce((s, p) => s + Number(p.amount), 0),
            }))}
          />
        ) : null}
      </PageHeader>

      <SearchInput placeholder="Search receipt or student…" />

      {payments.length ? (
        <PaymentsTable
          initialRows={serialize(payments) as PaymentRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMorePayments}
          canDelete={canDelete}
        />
      ) : (
        <EmptyState
          title="No payments found"
          description="Record a payment against an invoice."
          action={canRecord ? { label: "Record payment", href: "/payments" } : undefined}
          icon={<WalletIcon className="size-6" />}
        />
      )}
    </div>
  );
}
