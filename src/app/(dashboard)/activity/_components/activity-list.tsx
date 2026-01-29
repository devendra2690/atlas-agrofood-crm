"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, FileText, ShoppingCart, Truck, CreditCard, ShoppingBag } from "lucide-react";

interface ActivityListProps {
    activities: any[];
}

export function ActivityList({ activities }: ActivityListProps) {

    const getIcon = (type: string) => {
        switch (type) {
            case 'SalesOrder': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
            case 'PurchaseOrder': return <ShoppingBag className="h-4 w-4 text-amber-500" />;
            case 'Invoice': return <FileText className="h-4 w-4 text-green-500" />;
            case 'Bill': return <CreditCard className="h-4 w-4 text-red-500" />;
            case 'Shipment': return <Truck className="h-4 w-4 text-slate-500" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    // Helper to get fallback icon since ShoppingBag might not be imported or available in my lucide set check
    // I used ShoppingCart for SalesOrder. Let's use Package for PurchaseOrder.
    const getIconSafe = (type: string) => {
        switch (type) {
            case 'SalesOrder': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
            case 'PurchaseOrder': return <Activity className="h-4 w-4 text-amber-500" />; // Fallback
            case 'Invoice': return <FileText className="h-4 w-4 text-green-500" />;
            case 'Bill': return <CreditCard className="h-4 w-4 text-red-500" />;
            case 'Shipment': return <Truck className="h-4 w-4 text-slate-500" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No activity recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            activities.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={log.user?.image || ""} />
                                                <AvatarFallback className="text-[10px]">
                                                    {log.user?.name?.slice(0, 2).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{log.user?.name || "System"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getIconSafe(log.entityType)}
                                            <span className="text-sm">{log.entityTitle || log.entityId.slice(0, 8)}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{log.entityType}</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.details}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, h:mm a")}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
