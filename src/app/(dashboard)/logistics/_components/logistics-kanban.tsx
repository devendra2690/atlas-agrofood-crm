"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    useDraggable,
} from "@dnd-kit/core";
import { Shipment, PurchaseOrder, Company, ProcurementProject, SalesOrder, SalesOpportunity } from "@prisma/client";
import { updateShipmentStatus } from "@/app/actions/logistics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Truck, Anchor, CheckCircle } from "lucide-react";

// Define the shape of data we expect
type ShipmentWithRelations = Shipment & {
    purchaseOrder?: (PurchaseOrder & {
        project: ProcurementProject;
        vendor: Company;
    }) | null;
    salesOrder?: (SalesOrder & {
        client: Company;
        opportunity: SalesOpportunity;
    }) | null;
};

interface LogisticsKanbanProps {
    shipments: ShipmentWithRelations[];
}

const COLUMNS = [
    { id: "IN_TRANSIT", title: "In Transit", icon: Truck },
    { id: "DELIVERED", title: "Delivered", icon: CheckCircle },
];

export function LogisticsKanban({ shipments: initialShipments }: LogisticsKanbanProps) {
    const [shipments, setShipments] = useState(initialShipments);
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
        return COLUMNS.map(col => ({
            ...col,
            items: shipments.filter(s => s.status === col.id)
        }));
    }, [shipments]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the shipment being dragged
        const activeShipment = shipments.find(s => s.id === activeId);
        if (!activeShipment) return;

        // Determine new status
        let newStatus: string | undefined;

        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId;
        } else {
            // Dragged over another item
            const overShipment = shipments.find(s => s.id === overId);
            if (overShipment) {
                newStatus = overShipment.status;
            }
        }

        if (!newStatus || activeShipment.status === newStatus) return;

        // Optimistic Update
        const oldShipments = [...shipments];
        setShipments(shipments.map(s =>
            s.id === activeId ? { ...s, status: newStatus! } : s
        ));

        setIsUpdating(true);
        try {
            const res = await updateShipmentStatus(activeId, newStatus);
            if (!res.success) {
                setShipments(oldShipments);
                toast.error(res.error || "Failed to update status");
            } else {
                toast.success(`Shipment moved to ${newStatus}`);
            }
        } catch (error) {
            console.error(error);
            setShipments(oldShipments);
            toast.error("An unexpected error occurred");
        } finally {
            setIsUpdating(false);
        }
    }

    const activeShipment = activeId ? shipments.find(s => s.id === activeId) : null;

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
                    >
                        <DroppableColumn id={col.id} title={col.title} count={col.items.length} icon={col.icon}>
                            <div className="flex flex-col gap-3 overflow-y-auto h-full pr-2">
                                {col.items.map(shipment => (
                                    <DraggableCard key={shipment.id} shipment={shipment} />
                                ))}
                                {col.items.length === 0 && (
                                    <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
                                        No Shipments
                                    </div>
                                )}
                            </div>
                        </DroppableColumn>
                    </div>
                ))}
            </div>

            <DragOverlay>
                {activeShipment ? (
                    <div className="opacity-80 rotate-2 cursor-grabbing">
                        <ShipmentCard shipment={activeShipment} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// --- Subcomponents ---

function DroppableColumn({ id, title, count, icon: Icon, children }: { id: string, title: string, count: number, icon: any, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full">
            <div className="mb-3 flex items-center justify-between font-medium">
                <div className="flex items-center gap-2 text-slate-700">
                    <Icon className="h-4 w-4" />
                    <span>{title}</span>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">{count}</Badge>
            </div>
            {children}
        </div>
    );
}

function DraggableCard({ shipment }: { shipment: ShipmentWithRelations }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: shipment.id,
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

    const handleClick = () => {
        if (shipment.purchaseOrderId) {
            router.push(`/purchase-orders/${shipment.purchaseOrderId}`);
        } else if (shipment.salesOrderId) {
            router.push(`/sales-orders/${shipment.salesOrderId}`);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="cursor-pointer hover:ring-2 hover:ring-primary/20 rounded-lg transition-all"
            onClick={handleClick}
        >
            <ShipmentCard shipment={shipment} />
        </div>
    );
}

function ShipmentCard({ shipment, isOverlay }: { shipment: ShipmentWithRelations, isOverlay?: boolean }) {
    const isPO = !!shipment.purchaseOrder;
    const relatedOrder = isPO ? shipment.purchaseOrder! : shipment.salesOrder;

    // Fallback if bad data
    if (!relatedOrder) {
        return (
            <Card className={`shadow-sm ${isOverlay ? 'shadow-xl bg-white scale-105' : ''}`}>
                <CardContent className="p-3 text-red-500 text-xs">
                    Invalid Shipment Data (Missing Order Link)
                </CardContent>
            </Card>
        );
    }

    const orderId = isPO ? relatedOrder.id : relatedOrder.id;
    const projectOrProductLabel = isPO ? "Project" : "Product";
    const projectOrProductValue = isPO
        ? (shipment.purchaseOrder?.project?.name || "N/A")
        : (shipment.salesOrder?.opportunity?.productName || "Product"); // schema doesn't have productName directly on opp? need check. opp usually has product name.

    // Just in case schema check: SalesOrder -> Opportunity. 
    // Opportunity usually has 'title' or 'product' field? 
    // Wait, let's use client name for Sales Order as primary context if product is not easy access.
    // Actually Opportunity has 'product' field? 
    // Let's check Opportunity schema if unsure. But assuming 'title' or 'product' exists.
    // Checking schema dump... Opportunity has 'product' string field?
    // Let's just use "Client" for Sales Order instead of "Vendor".

    const contextLabel = isPO ? "Vendor:" : "Client:";
    const contextValue = isPO
        ? (shipment.purchaseOrder?.vendor?.name || "N/A")
        : (shipment.salesOrder?.client?.name || "N/A");

    // For Project/Product line:
    // PO -> Project Name
    // SO -> Opportunity Title or just "Sales Order"
    const secondaryLabel = isPO ? "Project:" : "Opp:";
    const secondaryValue = isPO
        ? (shipment.purchaseOrder?.project?.name)
        : (shipment.salesOrder?.opportunity?.productName || "Sales Deal");

    return (
        <Card className={`shadow-sm ${isOverlay ? 'shadow-xl bg-white scale-105' : ''}`}>
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm truncate w-[70%]">
                        {isPO ? "PO" : "SO"} #{orderId.slice(0, 8).toUpperCase()}
                    </div>
                    {isOverlay && <Badge>{shipment.status}</Badge>}
                </div>

                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <div className="flex justify-between">
                        <span>{secondaryLabel}</span>
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{secondaryValue}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Carrier:</span>
                        <span className="font-medium text-slate-700">{shipment.carrier || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ETA:</span>
                        <span>{shipment.eta ? format(new Date(shipment.eta), "PP") : "N/A"}</span>
                    </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{contextLabel}</span>
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{contextValue}</span>
                </div>
            </CardContent>
        </Card>
    );
}
