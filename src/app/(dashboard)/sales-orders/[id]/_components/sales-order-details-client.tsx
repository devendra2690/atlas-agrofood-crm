"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesOrderStatus } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateSalesOrderStatus } from "@/app/actions/order";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link as LinkIcon, ExternalLink, Loader2, FilePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Added Dialog import

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrderFinancials } from "./sales-order-financials";
import { generateInvoiceFromSalesOrder } from "@/app/actions/finance";
import { RecordPaymentDialog } from "./record-payment-dialog";

interface SalesOrderDetailsClientProps {
    order: any;
    financials: any;
    transactions: any[];
}

const statusOptions: { value: SalesOrderStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'Pending', color: 'bg-slate-100 text-slate-800' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'SHIPPED', label: 'Shipped', color: 'bg-orange-100 text-orange-800' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-teal-100 text-teal-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export function SalesOrderDetailsClient({ order, financials, transactions }: SalesOrderDetailsClientProps) {
    const [status, setStatus] = useState<SalesOrderStatus>(order.status);
    const [updating, setUpdating] = useState(false);

    // Strict Validation State
    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [validationNotes, setValidationNotes] = useState("");
    const [pendingStatus, setPendingStatus] = useState<SalesOrderStatus | null>(null);

    async function updateStatus(value: SalesOrderStatus, notes?: string) {
        setUpdating(true);
        // setStatus(value); // Optimistic - actually lets wait for server for strict actions
        try {
            const result = await updateSalesOrderStatus(order.id, value, notes);
            if (result.success) {
                toast.success("Order status updated");
                setStatus(value);
                setValidationDialogOpen(false);
                setValidationNotes("");
            } else {
                toast.error(result.error || "Failed to update status");
                // setStatus(order.status); // Revert
            }
        } catch (e) {
            toast.error("Failed to update status");
            // setStatus(order.status);
        } finally {
            setUpdating(false);
        }
    }

    async function handleStatusChange(value: SalesOrderStatus) {
        // STRICT CHECK Logic
        if (value === 'DELIVERED' || value === 'COMPLETED') {
            const totalPaid = order.invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount - inv.pendingAmount), 0);
            const totalShipped = order.shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

            const isFullPaid = Math.abs(totalPaid - order.totalAmount) < 1.0;
            const isFullQty = Math.abs(totalShipped - order.opportunity.quantity) < 0.01;

            if (!isFullPaid || !isFullQty) {
                setPendingStatus(value);
                setValidationDialogOpen(true);
                return; // Stop here, wait for dialog
            }
        }

        // CANCELLATION CHECK Logic
        if (value === 'CANCELLED') {
            const totalPaid = order.invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount - inv.pendingAmount), 0);
            const totalShipped = order.shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

            if (totalPaid > 0 || totalShipped > 0) {
                setPendingStatus(value);
                setValidationDialogOpen(true); // Re-use the same dialog for remarks
                return;
            }
        }

        // If checks pass (or not Delivered status), proceed normally
        updateStatus(value);
    }

    const confirmStatusChange = () => {
        if (pendingStatus) {
            updateStatus(pendingStatus, validationNotes);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
    }

    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="procurement">Procurement</TabsTrigger>
                <TabsTrigger value="financials">Financials & Profitability</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Order Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Client</p>
                                    <p className="text-lg font-semibold">{order.client.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Product</p>
                                    <p className="text-lg font-semibold">{order.opportunity.productName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Quantity</p>
                                    <p className="text-lg">{order.opportunity.quantity} MT</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Potential Opportunity Value</p>
                                    <p className="text-lg font-mono font-bold">₹{order.totalAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Created At</p>
                                    <p>{format(new Date(order.createdAt), "PPP")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Current Status</label>
                                <Select
                                    value={status}
                                    onValueChange={handleStatusChange}
                                    disabled={updating}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {updating && <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Updating...</div>}
                            </div>

                            {/* Fulfillment Notes Display */}
                            {order.fulfillmentNotes && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                                    <p className="font-semibold text-amber-800 mb-1">Fulfillment / Closure Notes:</p>
                                    <p className="text-amber-700">{order.fulfillmentNotes}</p>
                                </div>
                            )}

                            {/* Validation Dialog */}
                            <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Incomplete Fulfillment Detected</DialogTitle>
                                        <DialogDescription>
                                            This order is not fully paid or fully shipped. To mark it as {pendingStatus}, you must provide closure remarks.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-2 space-y-2">
                                        <div className="text-sm border p-2 rounded bg-slate-50">
                                            <div className="flex justify-between">
                                                <span>Total Amount:</span>
                                                <span className="font-mono">₹{order.totalAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-yellow-600">
                                                <span>Paid Received:</span>
                                                <span className="font-mono">
                                                    ₹{order.invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount - inv.pendingAmount), 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="border-t my-1"></div>
                                            <div className="flex justify-between">
                                                <span>Order Quantity:</span>
                                                <span>{order.opportunity.quantity} MT</span>
                                            </div>
                                            <div className="flex justify-between text-yellow-600">
                                                <span>Total Shipped:</span>
                                                <span>
                                                    {order.shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0)} MT
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Closure Remarks / Notes <span className="text-red-500">*</span></label>
                                            <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={validationNotes}
                                                onChange={(e) => setValidationNotes(e.target.value)}
                                                placeholder="Explain why this order is being closed with outstanding items..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={confirmStatusChange} disabled={!validationNotes}>Confirm & Update</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                        </CardContent>
                    </Card>

                    {/* Invoices Section - Moved to Overview for visibility */}
                    <Card className="col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Invoices</CardTitle>
                            {(!order.invoices || order.invoices.length === 0) && ["CONFIRMED", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status) && (
                                <GenerateInvoiceAction orderId={order.id} />
                            )}
                        </CardHeader>
                        <CardContent>
                            {(!order.invoices || order.invoices.length === 0) ? (
                                <div className="text-sm text-slate-500 text-center py-4">
                                    No invoices generated yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {order.invoices.map((inf: any) => (
                                        <div key={inf.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{inf.id.slice(0, 8).toUpperCase()}</p>
                                                    <Badge variant={inf.status === 'PAID' ? 'default' : 'outline'}>{inf.status}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Due: {inf.dueDate ? format(new Date(inf.dueDate), "MMM d") : "-"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-bold">₹{inf.totalAmount.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">
                                                    {inf.pendingAmount > 0 ? `Pending: ₹${inf.pendingAmount.toLocaleString()}` : "Paid"}
                                                </p>
                                                {inf.pendingAmount > 0 && (
                                                    <div className="mt-2">
                                                        <RecordPaymentDialog invoice={inf} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="procurement" className="space-y-4">
                {order.opportunity.procurementProject && (
                    <div className="flex justify-end">
                        <Link href={`/procurement/${order.opportunity.procurementProject.id}`}>
                            <Button variant="outline" className="gap-2">
                                Manage Sourcing (Add Vendor / Split Order)
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="space-y-4">
                        {order.opportunity.sampleSubmissions && order.opportunity.sampleSubmissions.length > 0 ? (
                            order.opportunity.sampleSubmissions.map((submission: any) => (
                                <Card key={submission.id} className={submission.status === 'CLIENT_APPROVED' ? "border-green-500 ring-1 ring-green-500" : ""}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium">
                                            Sample - {submission.sample.vendor?.name}
                                        </CardTitle>
                                        <Badge variant={submission.status === 'CLIENT_APPROVED' ? 'default' : 'secondary'}>
                                            {submission.status.replace('CLIENT_', '')}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex gap-6">
                                            <div className="aspect-video w-64 relative bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                                                {submission.sample.images?.[0] ? (
                                                    <img src={submission.sample.images[0]} alt="Sample" className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No Image</div>
                                                )}
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</p>
                                                    <p className="font-medium">{submission.sample.vendor?.name}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Buy Price</p>
                                                        <p className="font-mono text-sm">₹{submission.sample.priceQuoted?.toLocaleString() ?? '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">My Notes</p>
                                                        <p className="text-sm">{submission.sample.qualityNotes || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Samples</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-slate-500">No samples linked to this order yet.</div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {order.purchaseOrders && order.purchaseOrders.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Purchase Orders</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {order.purchaseOrders.map((po: any, index: number) => (
                                    <div key={po.id} className={index > 0 ? "pt-6 border-t" : ""}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Status</p>
                                                <Badge variant="outline">{po.status}</Badge>
                                            </div>
                                            <Link href={`/purchase-orders/${po.id}`}>
                                                <Button variant="ghost" size="sm" className="gap-1">
                                                    View PO <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-slate-500">Vendor</p>
                                            <p className="text-lg font-semibold">{po.vendor?.name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Total Amount</p>
                                                <p className="text-lg font-semibold">₹{po.totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            No purchase orders linked to this sales order yet.
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="financials">
                <SalesOrderFinancials
                    salesOrderId={order.id}
                    financials={financials}
                    transactions={transactions}
                />
            </TabsContent>
        </Tabs>
    );
}



function GenerateInvoiceAction({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        try {
            const result = await generateInvoiceFromSalesOrder(orderId);
            if (result.success) {
                toast.success("Invoice generated successfully");
            } else {
                toast.error(result.error || "Failed to generate invoice");
            }
        } catch (e) {
            toast.error("Failed to generate invoice");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
            Generate Invoice
        </Button>
    );
}
