"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseOrderStatus } from "@prisma/client";

interface ProjectPOListProps {
    purchaseOrders: any[];
}

export function ProjectPOList({ purchaseOrders }: ProjectPOListProps) {
    if (purchaseOrders.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50/50">
                No purchase orders created for this project yet.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                        <TableCell className="font-mono text-xs">
                            {po.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                            <span className="font-medium text-slate-800">{po.vendor.name}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(po.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                            {po.quantity ? `${po.quantity} ${po.quantityUnit || 'MT'}` : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                            ₹{po.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{po.status}</Badge>
                        </TableCell>
                        <TableCell>
                            <Link href={`/purchase-orders/${po.id}`}>
                                <Button size="sm" variant="ghost">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
