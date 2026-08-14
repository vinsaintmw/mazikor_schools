import { ChartColumnIcon, WalletIcon, ReceiptIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatMoney, formatNumber } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
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
  if (!can(session, "finance.reports")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const [revenueAgg, expenseAgg, expenseGroups, monthRevenue, invoiceAgg, invoiceCount, outstandingInvoices] =
    await Promise.all([
      db.payment.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      db.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      db.expense.groupBy({ by: ["category"], where: { schoolId }, _sum: { amount: true } }),
      db.$queryRaw<Array<{ month: string; revenue: number }>>`
        SELECT to_char(date_trunc('month', "date"), 'Mon') AS month,
               COALESCE(SUM(amount), 0)::float8 AS revenue
        FROM payment
        WHERE "schoolId" = ${schoolId}
        GROUP BY 1
      `,
      Promise.all([
        db.invoiceItem.aggregate({ where: { schoolId }, _sum: { amount: true } }),
        db.invoice.aggregate({ where: { schoolId }, _sum: { discount: true } }),
        db.payment.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      ]),
      db.invoice.count({ where: { schoolId } }),
      db.invoice.findMany({
        where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } },
        select: {
          id: true,
          number: true,
          status: true,
          discount: true,
          items: { select: { amount: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const net = totalRevenue - totalExpenses;

  const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthTotals = new Map(monthRevenue.map((m) => [m.month, Number(m.revenue)]));
  const chart = monthsOrder.map((m) => ({ month: m, revenue: monthTotals.get(m) ?? 0 }));

  const byCategory = new Map(expenseGroups.map((e) => [e.category, Number(e._sum.amount ?? 0)]));
  const expenseByCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c.label,
    total: byCategory.get(c.value) ?? 0,
  })).filter((e) => e.total > 0);

  const [itemsAgg, discountAgg, paidAgg] = invoiceAgg;
  const invoiceTotal = Number(itemsAgg._sum.amount ?? 0) - Number(discountAgg._sum.discount ?? 0);
  const invoicePaid = Number(paidAgg._sum.amount ?? 0);
  const invoiceStats = {
    total: invoiceTotal,
    paid: invoicePaid,
    outstanding: Math.max(0, invoiceTotal - invoicePaid),
  };

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
          {outstandingInvoices.length ? (
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
                  {outstandingInvoices.map((inv) => {
                    const total = inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
                    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
                    const balance = Math.max(0, total - paid);
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
          ) : invoiceCount === 0 ? (
            <EmptyState title="No invoices" description="No invoices have been created yet." icon={<ChartColumnIcon className="size-6" />} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">All invoices are paid up.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
