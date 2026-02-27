
import { Suspense } from "react";
import { getPurchaseOrder } from "@/app/actions/procurement";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { POStatusSelector } from "./_components/po-status-selector";
import { BillManager } from "./_components/bill-manager";
import { POPrintAction } from "./_components/po-print-action";
import { POAttachment } from "./_components/po-attachment";
import { POActions } from "../_components/po-actions";
import { ShipmentManager } from "./_components/shipment-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const { data: order, error } = await getPurchaseOrder(id);

    if (error || !order) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col gap-4">
                <Link href="/purchase-orders">
                    <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground w-fit">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Purchase Orders
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">PO {order.id.slice(0, 8)}</h2>
                        <p className="text-sm text-muted-foreground">Vendor: {order.vendor.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <POAttachment poId={order.id} initialUrl={(order as any).pdfUrl} />
                        <POPrintAction poId={order.id} />
                        <POStatusSelector poId={order.id} currentStatus={order.status} />
                        <POActions order={order} />
                    </div>
                </div>
            </div>
            <Separator className="my-4" />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Project</p>
                                    <p className="text-base font-semibold">{order.project.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Items Count</p>
                                    <p className="text-base font-semibold">
                                        {(order as any).items?.length || 0} items
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Amount</p>
                                    <p className="text-xl font-mono font-bold">₹{order.totalAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Date</p>
                                    <p>{format(new Date(order.createdAt), "PPP")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {((order as any).items && (order as any).items.length > 0) ? (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 font-medium text-slate-500">Item</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Quantity (MT)</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Rate (₹/kg)</th>
                                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(order as any).items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium">
                                                        {item.commodity?.name || 'Unknown Item'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {Number(item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        ₹{Number(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        ₹{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t bg-slate-50/50">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 font-semibold text-right">Total</td>
                                                <td className="px-4 py-3 font-bold text-right text-base">
                                                    ₹{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-muted-foreground border rounded-md border-dashed">
                                    No items found in this order.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <BillManager
                    poId={order.id}
                    vendorId={order.vendorId}
                    totalAmount={order.totalAmount}
                    bills={(order.bills as any[]).map(b => ({
                        ...b,
                        createdAt: new Date(b.createdAt)
                    }))}
                />
            </div>

            {/* Logistics Section */}
            <Separator className="my-6" />
            <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Logistics & Receiving</h3>
                <ShipmentManager
                    poId={order.id}
                    poStatus={order.status}
                    shipments={(order as any).shipments || []}
                    grn={(order as any).grn}
                    orderedQuantity={(order as any).items?.reduce((s: number, it: any) => s + Number(it.quantity), 0) || 0}
                />
            </div>
        </div>
    );
}
