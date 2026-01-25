
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { BillList } from "./_components/bill-list";
import { Separator } from "@/components/ui/separator";
import { getOtherExpenseTransactions, getSalesOrdersForSelection } from "@/app/actions/finance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTransactionDialog } from "../finance/_components/add-transaction-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

async function getBills() {
    try {
        const bills = await prisma.bill.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                vendor: true
            }
        });

        return bills.map(bill => ({
            ...bill,
            totalAmount: bill.totalAmount.toNumber(),
            pendingAmount: bill.pendingAmount.toNumber()
        }));
    } catch (e) {
        console.error("Failed to fetch bills", e);
        return [];
    }
}

export default async function BillsPage() {
    const bills = await getBills();
    const otherExpenses = await getOtherExpenseTransactions();
    const salesOrders = await getSalesOrdersForSelection();

    const totalOtherExpense = otherExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Bills & Expenses</h2>
            </div>

            <Tabs defaultValue="bills" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="bills">Bills (AP)</TabsTrigger>
                    <TabsTrigger value="other-expenses">Other Expenses</TabsTrigger>
                </TabsList>

                <TabsContent value="bills" className="space-y-4">
                    <Suspense fallback={<div>Loading bills...</div>}>
                        <BillList bills={bills} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="other-expenses" className="space-y-4">
                    <div className="flex justify-between items-center bg-rose-50 p-4 rounded-lg border border-rose-100">
                        <div>
                            <h3 className="font-medium text-rose-900">Total Other Expenses</h3>
                            <p className="text-2xl font-bold text-rose-700">₹{totalOtherExpense.toLocaleString()}</p>
                        </div>
                        <AddTransactionDialog type="DEBIT" salesOrders={salesOrders} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manual Expense Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Linked To</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {otherExpenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No manual expenses recorded.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        otherExpenses.map((tx: any) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                                                <TableCell className="font-medium">{tx.description}</TableCell>
                                                <TableCell><Badge variant="outline">{tx.category}</Badge></TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{tx.linkedTo || "-"}</TableCell>
                                                <TableCell className="text-right font-medium text-rose-600">
                                                    -₹{tx.amount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
