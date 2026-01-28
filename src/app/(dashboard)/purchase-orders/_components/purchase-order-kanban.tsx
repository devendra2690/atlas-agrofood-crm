"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { PurchaseOrder, PurchaseOrderStatus } from "@prisma/client";
import { updatePurchaseOrderStatus } from "@/app/actions/procurement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type PurchaseOrderWithRelations = Omit<PurchaseOrder, 'totalAmount' | 'quantity' | 'sample'> & {
    totalAmount: number;
    quantity: number | null;
    vendor: { name: string };
    project: { name: string };
    sample?: any;
};

interface PurchaseOrderKanbanProps {
    orders: PurchaseOrderWithRelations[];
}

const COLUMNS: { id: PurchaseOrderStatus; title: string }[] = [
    { id: "DRAFT", title: "Draft" },
    { id: "PENDING", title: "Pending" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "IN_TRANSIT", title: "In Transit" },
    { id: "RECEIVED", title: "Received" },
];

export function PurchaseOrderKanban({ orders: initialOrders }: PurchaseOrderKanbanProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const columns = useMemo(() => {
        const cols = COLUMNS.map(col => ({
            ...col,
            items: orders.filter(order => order.status === col.id)
        }));
        return cols;
    }, [orders]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the order being dragged
        const activeOrder = orders.find(o => o.id === activeId);
        if (!activeOrder) return;

        // Determine new status
        // overId could be a container (column ID) or another item ID
        let newStatus: PurchaseOrderStatus | undefined;

        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId as PurchaseOrderStatus;
        } else {
            // Dragged over another item, find that item's status
            const overOrder = orders.find(o => o.id === overId);
            if (overOrder) {
                newStatus = overOrder.status;
            }
        }

        if (!newStatus || activeOrder.status === newStatus) return;

        // Optimistic update
        const oldOrders = [...orders];
        setOrders(orders.map(o =>
            o.id === activeId ? { ...o, status: newStatus! } : o
        ));

        setIsUpdating(true);
        try {
            const res = await updatePurchaseOrderStatus(activeId, newStatus);
            if (!res.success) {
                // Revert
                setOrders(oldOrders);
                toast.error(res.error || "Failed to update status");
            } else {
                toast.success(`Order moved to ${newStatus}`);
            }
        } catch (error) {
            console.error(error);
            setOrders(oldOrders);
            toast.error("An unexpected error occurred");
        } finally {
            setIsUpdating(false);
        }
    }

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className="flex h-full min-w-[300px] w-[300px] flex-col rounded-lg bg-slate-100 p-3"
                    // This div acts as a droppable zone if we used useDroppable, 
                    // but dnd-kit core strategy is often simpler by just checking `over.id`.
                    // For empty columns to be droppable, we need to register them as droppable zones.
                    // However, let's keep it simple: We treat the whole column area as the drop target.
                    // We'll use a wrapper `DroppableColumn` component if needed, but `id` matching works on `over` too 
                    // if we make the container droppable.
                    >
                        <DroppableColumn id={col.id} title={col.title} count={col.items.length}>
                            <div className="flex flex-col gap-3 overflow-y-auto h-full pr-2">
                                {col.items.map(order => (
                                    <DraggableCard key={order.id} order={order} />
                                ))}
                                {col.items.length === 0 && (
                                    <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
                                        No Orders
                                    </div>
                                )}
                            </div>
                        </DroppableColumn>
                    </div>
                ))}
            </div>

            <DragOverlay>
                {activeOrder ? (
                    <div className="opacity-80 rotate-2 cursor-grabbing">
                        <OrderCard order={activeOrder} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Subcomponents

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

function DroppableColumn({ id, title, count, children }: { id: string, title: string, count: number, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full">
            <div className="mb-3 flex items-center justify-between font-medium">
                <span className="text-slate-700">{title}</span>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">{count}</Badge>
            </div>
            {children}
        </div>
    );
}

function DraggableCard({ order }: { order: PurchaseOrderWithRelations }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
    });

    const router = useRouter();

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="h-[120px] w-full rounded-lg border bg-slate-50 opacity-50 border-dashed"
                style={style}
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 rounded-lg transition-all"
            onClick={() => router.push(`/purchase-orders/${order.id}`)}
        >
            <OrderCard order={order} />
        </div>
    );
}

function OrderCard({ order, isOverlay }: { order: PurchaseOrderWithRelations, isOverlay?: boolean }) {
    return (
        <Card className={`shadow-sm ${isOverlay ? 'shadow-xl bg-white scale-105' : ''}`}>
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm truncate w-[70%]">
                        {order.project.name}
                    </div>
                    {isOverlay && <Badge>{order.status}</Badge>}
                </div>

                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <div className="flex justify-between">
                        <span>Vendor:</span>
                        <span className="font-medium text-slate-700">{order.vendor.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{order.quantity} {order.quantityUnit}</span>
                    </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center">
                    <div className="font-bold text-sm">
                        {formatCurrency(Number(order.totalAmount))}
                    </div>
                    <div className="bg-slate-100 text-xs px-2 py-0.5 rounded text-slate-600 font-mono">
                        #{order.id.slice(0, 5)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
