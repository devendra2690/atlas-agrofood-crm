"use client";

import { useState } from "react";
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
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateOpportunityStatus } from "@/app/actions/opportunity";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define columns/statuses in order
const COLUMNS = [
    { id: "OPEN", title: "New / Open" },
    { id: "QUALIFICATION", title: "Qualification" },
    { id: "PROPOSAL", title: "Proposal" },
    { id: "NEGOTIATION", title: "Negotiation" },
    { id: "CLOSED_WON", title: "Closed Won" },
    { id: "CLOSED_LOST", title: "Closed Lost" },
];

interface OpportunityBoardProps {
    opportunities: any[];
}

export function OpportunityBoard({ opportunities: initialOpportunities }: OpportunityBoardProps) {
    const [opportunities, setOpportunities] = useState(initialOpportunities);
    const [activeId, setActiveId] = useState<string | null>(null);
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        })
    );

    // Group opportunities by status
    const columns = COLUMNS.map((col) => ({
        ...col,
        opportunities: opportunities.filter((o) => o.status === col.id),
    }));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        // We only visually move cards, actual logic is in dragEnd
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string; // This could be a card ID or a column ID

        // Find the new status
        let newStatus = "";

        // Check if dropped on a column directly
        if (COLUMNS.some(c => c.id === overId)) {
            newStatus = overId;
        } else {
            // Dropped on another card, find that card's status
            const overCard = opportunities.find(o => o.id === overId);
            if (overCard) newStatus = overCard.status;
        }

        if (newStatus) {
            // Optimistic update
            const oldStatus = opportunities.find(o => o.id === activeId)?.status;

            if (oldStatus !== newStatus) {
                setOpportunities((items) =>
                    items.map((item) =>
                        item.id === activeId ? { ...item, status: newStatus } : item
                    )
                );

                // Server Action
                const result = await updateOpportunityStatus(activeId, newStatus as any);
                if (result.success) {
                    toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
                    router.refresh();
                } else {
                    console.error("Server Action Failed:", result.error);
                    toast.error(`Failed: ${result.error}`);
                    // Revert
                    setOpportunities((items) =>
                        items.map((item) =>
                            item.id === activeId ? { ...item, status: oldStatus } : item
                        )
                    );
                }
            }
        }

        setActiveId(null);
    };

    const activeOpportunity = activeId ? opportunities.find((o) => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-220px)] flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={col.opportunities.length}
                        opportunities={col.opportunities}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeOpportunity ? <KanbanCard opportunity={activeOpportunity} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
