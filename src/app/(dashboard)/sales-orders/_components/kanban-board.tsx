"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    closestCorners,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { SalesOrderKanbanCard } from "./kanban-card";
import { updateSalesOrderStatus } from "@/app/actions/order";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SalesOrderStatus } from "@prisma/client";

// Define columns/statuses in order
const COLUMNS = [
    { id: "PENDING", title: "Pending" },
    { id: "CONFIRMED", title: "Confirmed" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "SHIPPED", title: "Shipped" },
    { id: "DELIVERED", title: "Delivered" },
    { id: "COMPLETED", title: "Completed" },
    { id: "CANCELLED", title: "Cancelled" },
];

interface SalesOrderBoardProps {
    orders: any[];
}

export function SalesOrderBoard({ orders: initialOrders }: SalesOrderBoardProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [activeId, setActiveId] = useState<string | null>(null);
    const router = useRouter();

    // Sync local state when server data changes
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Group orders by status
    const columns = COLUMNS.map((col) => ({
        ...col,
        orders: orders.filter((o) => o.status === col.id),
    }));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Only visual updates, handled by DndKit overlay usually
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the new status
        let newStatus = "";

        // Check if dropped on a column directly
        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId;
        } else {
            // Dropped on another card, find that card's status
            const overCard = orders.find(o => o.id === overId);
            if (overCard) newStatus = overCard.status;
        }

        if (newStatus) {
            // VALIDATION: Business Rules for Confirming Orders
            const activeOrder = orders.find(o => o.id === activeId);
            if (activeOrder && (newStatus === 'CONFIRMED' || newStatus === 'IN_PROGRESS')) {
                if (!activeOrder.totalAmount || activeOrder.totalAmount <= 0) {
                    toast.error(`Cannot Confirm Order: Invalid Total Amount`);
                    setActiveId(null);
                    return;
                }
            }

            const oldStatus = orders.find(o => o.id === activeId)?.status;

            if (oldStatus !== newStatus) {
                // Optimistic update
                setOrders((items) =>
                    items.map((item) =>
                        item.id === activeId ? { ...item, status: newStatus } : item
                    )
                );

                const toastId = toast.loading(`Moving to ${newStatus.replace('_', ' ')}...`);

                // Server Action
                const result = await updateSalesOrderStatus(activeId, newStatus as SalesOrderStatus);

                if (result.success) {
                    toast.success(`Moved to ${newStatus.replace('_', ' ')}`, { id: toastId });
                    router.refresh();
                } else {
                    console.error("Server Action Failed:", result.error);
                    toast.error(`Failed: ${result.error}`, { id: toastId });
                    // Revert
                    setOrders((items) =>
                        items.map((item) =>
                            item.id === activeId ? { ...item, status: oldStatus } : item
                        )
                    );
                }
            }
        }

        setActiveId(null);
    };

    const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-220px)] flex gap-4 overflow-x-auto pb-4 items-start">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={col.orders.length}
                        orders={col.orders}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeOrder ? <SalesOrderKanbanCard order={activeOrder} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
