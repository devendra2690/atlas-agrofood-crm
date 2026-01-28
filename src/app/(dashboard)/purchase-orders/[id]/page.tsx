
import { Suspense } from "react";
import { getPurchaseOrder } from "@/app/actions/procurement";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SampleSelector } from "./_components/sample-selector";
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
                <Card className="col-span-2">
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
                                <p className="text-sm font-medium text-slate-500">Quantity</p>
                                <p className="text-base font-semibold">
                                    {(order as any).quantity ?? (order.project as any).salesOpportunities?.[0]?.quantity} {(order as any).quantityUnit || "MT"}
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
                    orderedQuantity={(order as any).quantity || 0}
                />
            </div>

            <Separator className="my-6" />

            <SampleSelector
                poId={order.id}
                activeSampleId={order.sample?.id}
                candidateSamples={((order as any).candidateSamples || []).filter((s: any) =>
                    order.vendorId ? s.vendor?.id === order.vendorId || s.vendorId === order.vendorId : true
                )}
            />
        </div>
    );
}
