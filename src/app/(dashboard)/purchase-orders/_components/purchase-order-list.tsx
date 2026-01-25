"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditPurchaseOrderDialog } from "./edit-po-dialog";
import { deletePurchaseOrder } from "@/app/actions/procurement";

interface PurchaseOrderListProps {
    orders: any[];
}

export function PurchaseOrderList({ orders }: PurchaseOrderListProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>PO ID</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-48 text-center text-muted-foreground p-8">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <p className="text-lg font-medium text-slate-900">No purchase orders found</p>
                                    <p className="max-w-sm text-sm text-slate-500">
                                        Purchase orders are generated from Procurement Projects once a vendor is selected and a deal is active.
                                    </p>
                                    <div className="flex gap-4 pt-4">
                                        <Link href="/procurement">
                                            <Button variant="outline">Go to Projects</Button>
                                        </Link>
                                        <Link href="/opportunities">
                                            <Button>Manage Opportunities</Button>
                                        </Link>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium font-mono text-xs">
                                    {order.id.substring(0, 8)}...
                                </TableCell>
                                <TableCell>
                                    <Link href={`/vendors/${order.vendor.id}`} className="hover:underline text-blue-600 font-medium">
                                        {order.vendor.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/procurement/${order.project.id}`} className="hover:underline text-muted-foreground text-sm">
                                        {order.project.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-700">
                                    ₹{order.totalAmount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/purchase-orders/${order.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </Link>
                                        <EditPurchaseOrderDialog order={order} />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:text-red-500"
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to delete this Purchase Order?")) {
                                                    await deletePurchaseOrder(order.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
