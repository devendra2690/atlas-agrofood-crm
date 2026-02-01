"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RecordBillPaymentDialog } from "./record-bill-payment-dialog";
import { ViewPaymentsDialog } from "../../finance/_components/view-payments-dialog";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { deleteBill } from "@/app/actions/finance";
import { DeleteWithConfirmation } from "@/components/common/delete-with-confirmation";

interface BillListProps {
    bills: any[];
    isAdmin?: boolean;
}

export function BillList({ bills, isAdmin }: BillListProps) {
    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-slate-50 text-slate-500">
                <p>No bills found.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bills.map((bill) => (
                <Card key={bill.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center justify-between w-full">
                            <CardTitle className="text-sm font-medium">
                                {bill.invoiceNumber ? `Inv #${bill.invoiceNumber}` : "Bill"}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant={bill.status === "PAID" ? "default" : "outline"}>
                                    {bill.status}
                                </Badge>
                                {isAdmin && (
                                    <DeleteWithConfirmation
                                        id={bill.id}
                                        onDelete={deleteBill}
                                        itemType="Bill"
                                    />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-2xl font-bold">₹{bill.totalAmount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(bill.createdAt), "MMM d, yyyy")}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {bill.pendingAmount > 0 ? (
                                        <p className="text-sm font-medium text-amber-600">
                                            Due: ₹{bill.pendingAmount.toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-emerald-600">Paid</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Vendor</span>
                                    <span className="font-medium">{bill.vendor.name}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Created By</span>
                                    <span>{bill.createdBy?.name || "-"}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                                    <span>Updated By</span>
                                    <span>{bill.updatedBy?.name || "-"}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-3">
                                    <Link href={`/purchase-orders/${bill.purchaseOrderId}`} className="flex items-center hover:underline text-blue-600">
                                        {bill.purchaseOrderId.slice(0, 8)} <ExternalLink className="h-3 w-3 ml-1" />
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-3">
                                    <span className="text-muted-foreground">Payments</span>
                                    <ViewPaymentsDialog
                                        transactions={bill.transactions}
                                        title={`Payments for Bill #${bill.invoiceNumber}`}
                                        trigger={
                                            <Button variant="link" className="h-auto p-0 text-blue-600">
                                                View ({bill.transactions?.length || 0})
                                            </Button>
                                        }
                                    />
                                </div>

                                {bill.pendingAmount > 0 && (
                                    <div className="mt-4">
                                        <RecordBillPaymentDialog bill={bill} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
