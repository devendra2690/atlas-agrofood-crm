"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, User, Package, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SalesOrderKanbanCardProps {
    order: any;
}

export function SalesOrderKanbanCard({ order }: SalesOrderKanbanCardProps) {
    const router = useRouter();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id, data: { status: order.status } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
        CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
        IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
        SHIPPED: "bg-indigo-100 text-indigo-700 border-indigo-200",
        DELIVERED: "bg-teal-100 text-teal-700 border-teal-200",
        COMPLETED: "bg-green-100 text-green-700 border-green-200",
        CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            onClick={() => router.push(`/sales-orders/${order.id}`)}
            suppressHydrationWarning
        >
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative">
                <CardHeader className="p-3 pb-0 space-y-0">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium leading-none truncate pr-2">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-5 font-normal", statusColors[order.status] || "bg-slate-100")}>
                            {order.status.replace("_", " ")}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground pt-1 truncate flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.client?.name || "Unknown Client"}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-sm font-bold text-slate-800">
                            ₹{order.totalAmount?.toLocaleString()}
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(order.createdAt), "MMM d")}
                        </div>
                    </div>

                    {order.opportunity?.productName && (
                        <div className="text-xs bg-slate-50 p-1.5 rounded border flex items-center gap-1.5 text-slate-600 truncate">
                            <Package className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{order.opportunity.productName}</span>
                        </div>
                    )}

                    {/* Pending Amount Warning */}
                    {order.invoices && order.invoices.some((inv: any) => inv.pendingAmount > 0) && (
                        <div className="mt-2 text-[10px] text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Unpaid Invoices
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
