
import { getInvoices, getOtherIncomeTransactions, getSalesOrdersForSelection } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTransactionDialog } from "../finance/_components/add-transaction-dialog";

export default async function InvoicesPage() {
    const { data: invoices, success } = await getInvoices();
    const otherIncome = await getOtherIncomeTransactions();
    const salesOrders = await getSalesOrdersForSelection();

    if (!success || !invoices) {
        return <div className="p-8">Failed to load invoices.</div>;
    }

    const totalReceivable = invoices
        .filter((inv: any) => inv.status !== 'PAID')
        .reduce((sum: number, inv: any) => sum + inv.pendingAmount, 0);

    const totalOtherIncome = otherIncome.reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Invoices & Income</h2>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Invoices (AR)</TabsTrigger>
                    <TabsTrigger value="other-income">Other Income</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Receivable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ₹{totalReceivable.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Pending payments</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Pending</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24">
                                                No invoices found. Generate one from a Sales Order.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((invoice: any) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">
                                                    {invoice.id.slice(0, 8).toUpperCase()}
                                                </TableCell>
                                                <TableCell>{invoice.salesOrder.client.name}</TableCell>
                                                <TableCell>{format(new Date(invoice.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell className={new Date(invoice.dueDate || "") < new Date() && invoice.status !== 'PAID' ? "text-red-500 font-medium" : ""}>
                                                    {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">₹{invoice.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">₹{invoice.pendingAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        invoice.status === 'PAID' ? 'default' :
                                                            invoice.status === 'PARTIAL' ? 'secondary' : 'outline'
                                                    } className={
                                                        invoice.status === 'PAID' ? 'bg-green-600' :
                                                            invoice.status === 'UNPAID' ? 'text-red-600 border-red-200 bg-red-50' : ''
                                                    }>
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/sales-orders/${invoice.salesOrderId}`} className="text-blue-600 hover:underline text-sm">
                                                        View Order
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="other-income" className="space-y-4">
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-100">
                        <div>
                            <h3 className="font-medium text-green-900">Total Other Income</h3>
                            <p className="text-2xl font-bold text-green-700">₹{totalOtherIncome.toLocaleString()}</p>
                        </div>
                        <AddTransactionDialog type="CREDIT" salesOrders={salesOrders} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manual Income Transactions</CardTitle>
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
                                    {otherIncome.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No manual income recorded.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        otherIncome.map((tx: any) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                                                <TableCell className="font-medium">{tx.description}</TableCell>
                                                <TableCell><Badge variant="outline">{tx.category}</Badge></TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{tx.linkedTo || "-"}</TableCell>
                                                <TableCell className="text-right font-medium text-emerald-600">
                                                    +₹{tx.amount.toLocaleString()}
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
