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
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateOpportunityStatus } from "@/app/actions/opportunity";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { OpportunityDialog } from "./opportunity-dialog";

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
    companies: any[];
    partners: any[];
    commodities: any[];
}

import { AttachSampleDialog } from "./attach-sample-dialog";

export function OpportunityBoard({ opportunities: initialOpportunities, companies, partners, commodities }: OpportunityBoardProps) {
    const [opportunities, setOpportunities] = useState(initialOpportunities);

    // Sync local state when server data changes (e.g. after router.refresh())
    useEffect(() => {
        setOpportunities(initialOpportunities);
    }, [initialOpportunities]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const [attachingOpportunity, setAttachingOpportunity] = useState<any>(null);
    const [attachSampleDialogOpen, setAttachSampleDialogOpen] = useState(false);

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

            // VALIDATION: Business Rules for Closing
            const activeOpp = opportunities.find(o => o.id === activeId);
            if (activeOpp && newStatus === 'CLOSED_WON') {
                const missingFields = [];
                if (!activeOpp.quantity || activeOpp.quantity <= 0) missingFields.push("Quantity");
                if (!activeOpp.targetPrice || activeOpp.targetPrice <= 0) missingFields.push("Target Price");

                // Check for Approved Sample
                const hasApprovedSample = activeOpp.sampleSubmissions?.some((s: any) => s.status === 'CLIENT_APPROVED');
                if (!hasApprovedSample) missingFields.push("Approved Sample");

                if (missingFields.length > 0) {
                    toast.error(`Cannot Close Won: Missing ${missingFields.join(", ")}`);
                    setActiveId(null);
                    return;
                }
            }

            // VALIDATION: Negotiation requires Sample
            if (activeOpp && newStatus === 'NEGOTIATION') {
                const hasSample = activeOpp.sampleSubmissions && activeOpp.sampleSubmissions.length > 0;
                if (!hasSample) {
                    toast.error("Cannot move to Negotiation: Attach a sample first.");
                    setActiveId(null);
                    return;
                }
            }

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
                        companies={companies}
                        partners={partners}
                        onCardClick={(opp) => {
                            setEditingOpportunity(opp);
                            setEditDialogOpen(true);
                        }}
                        onAttachSample={(opp) => {
                            setAttachingOpportunity(opp);
                            setAttachSampleDialogOpen(true);
                        }}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeOpportunity ? <KanbanCard opportunity={activeOpportunity} companies={companies} partners={partners} /> : null}
            </DragOverlay>

            <OpportunityDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                initialData={editingOpportunity}
                companies={companies}
                commodities={commodities}
                trigger={null}
            />

            <AttachSampleDialog
                open={attachSampleDialogOpen}
                onOpenChange={setAttachSampleDialogOpen}
                opportunity={attachingOpportunity}
            />
        </DndContext>
    );
}
