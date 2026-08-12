import { ChartColumnIcon, WalletIcon, ReceiptIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatMoney, formatNumber } from "@/lib/format";
import { EXPENSE_CATEGORIES, getLabel } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RevenueChart } from "@/app/(app)/dashboard/revenue-chart";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Financial reports" };

export default async function FinanceReportsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);

  const [payments, expenses, invoices] = await Promise.all([
    db.payment.findMany({ where: { schoolId }, select: { amount: true, date: true } }),
    db.expense.findMany({ where: { schoolId }, select: { amount: true, category: true, date: true } }),
    db.invoice.findMany({
      where: { schoolId },
      include: { items: true, payments: true },
    }),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net = totalRevenue - totalExpenses;

  const monthTotals = new Map<string, number>();
  for (const p of payments) {
    const key = new Date(p.date).toLocaleString("en", { month: "short" });
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(p.amount));
  }
  const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chart = monthsOrder.map((m) => ({ month: m, revenue: monthTotals.get(m) ?? 0 }));

  const expenseByCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c.label,
    total: expenses.filter((e) => e.category === c.value).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((e) => e.total > 0);

  const invoiceStats = invoices.reduce(
    (acc, inv) => {
      const total = inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      acc.total += total;
      acc.paid += paid;
      acc.outstanding += Math.max(0, total - paid);
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0 }
  );

  const stats = [
    { icon: <WalletIcon className="size-4" />, label: "Total revenue", value: formatMoney(totalRevenue), tone: "text-emerald-600" },
    { icon: <ReceiptIcon className="size-4" />, label: "Total expenses", value: formatMoney(totalExpenses), tone: "text-rose-600" },
    { icon: <TrendingUpIcon className="size-4" />, label: "Net position", value: formatMoney(net), tone: net >= 0 ? "text-emerald-600" : "text-rose-600" },
    { icon: <TrendingDownIcon className="size-4" />, label: "Outstanding fees", value: formatMoney(invoiceStats.outstanding), tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Financial reports" description="Revenue, spending and outstanding fees" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {s.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue collections</CardTitle>
            <CardDescription>Payments received per month</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {expenseByCategory.length ? (
              <div className="space-y-3">
                {expenseByCategory.map((e) => {
                  const max = Math.max(...expenseByCategory.map((x) => x.total), 1);
                  return (
                    <div key={e.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{e.category}</span>
                        <span className="font-mono text-muted-foreground">{formatMoney(e.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-rose-500/70" style={{ width: `${(e.total / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Outstanding invoices</CardTitle>
          <CardDescription>
            {formatNumber(invoiceStats.outstanding === 0 ? 0 : Math.ceil(invoiceStats.outstanding / 1))} in unpaid balances
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {invoices.length ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const total = inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
                    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
                    const balance = Math.max(0, total - paid);
                    if (balance <= 0) return null;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                        <TableCell className="font-mono">{formatMoney(total)}</TableCell>
                        <TableCell className="font-mono">{formatMoney(paid)}</TableCell>
                        <TableCell className="font-mono font-medium text-destructive">{formatMoney(balance)}</TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No invoices" description="No invoices have been created yet." icon={<ChartColumnIcon className="size-6" />} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
