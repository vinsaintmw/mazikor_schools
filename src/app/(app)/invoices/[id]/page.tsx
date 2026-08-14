import { notFound, redirect } from "next/navigation";
import { WalletIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatMoney, formatDate, fullName } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { StatusBadge } from "@/components/status-badge";
import { recordPayment } from "@/lib/actions/finance";
import { todayISO } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Invoice details" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "invoices.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id, schoolId },
    include: {
      student: true,
      term: true,
      items: true,
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!invoice) notFound();

  const total = invoice.items.reduce((s, i) => s + Number(i.amount), 0) - Number(invoice.discount);
  const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(0, total - paid);
  const canRecord = can(session, "payments.record");

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.number}
        description={`${fullName(invoice.student.firstName, invoice.student.middleName, invoice.student.lastName)} · ${invoice.term?.name ?? "—"} · Due ${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}`}
      >
        <StatusBadge status={invoice.status} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-medium">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-mono">{formatMoney(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-mono text-emerald-600">{formatMoney(paid)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Balance</span>
              <span className={`font-mono font-semibold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {formatMoney(balance)}
              </span>
            </div>
            {invoice.notes ? <p className="pt-2 text-muted-foreground">{invoice.notes}</p> : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.description}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(i.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatMoney(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {invoice.payments.length ? (
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="font-mono text-xs font-medium">{p.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.method.replace(/_/g, " ").toLowerCase()} · {formatDate(p.date)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{formatMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded.</p>
            )}
          </CardContent>
        </Card>

        {canRecord ? (
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="size-4" />
                Record payment
              </CardTitle>
              <CardDescription>Balance due: {formatMoney(balance)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ActionForm action={recordPayment} className="grid gap-3 sm:grid-cols-2" successLabel="Payment recorded">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <TextInput name="amount" label="Amount (MK)" type="number" min={1} step="0.01" required placeholder="0.00" />
                <NativeSelect
                  name="method"
                  label="Payment method"
                  required
                  options={PAYMENT_METHODS}
                  placeholder="Select method"
                />
                <TextInput name="date" label="Date" type="date" defaultValue={todayISO()} />
                <TextInput name="reference" label="Reference" placeholder="Optional reference" />
                <TextInput name="notes" label="Notes" className="sm:col-span-2" />
                <div className="flex items-end justify-end sm:col-span-2">
                  <SubmitButton>Record payment</SubmitButton>
                </div>
              </ActionForm>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
