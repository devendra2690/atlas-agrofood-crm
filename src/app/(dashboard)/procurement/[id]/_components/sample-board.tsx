"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    defaultDropAnimationSideEffects,
    closestCorners,
} from "@dnd-kit/core";
import { SampleColumn } from "./sample-column";
import { SampleCard } from "./sample-card";
import { UpdateSampleDialog } from "../../_components/update-sample-dialog";
import { RequestSampleBoardDialog } from "./request-sample-board-dialog";
import { updateSampleStatus } from "@/app/actions/sample";
import { toast } from "sonner";
import { SampleStatus } from "@prisma/client";

// Define the columns based on SampleStatus enum
const COLUMNS = [
    { id: "REQUESTED", title: "Requested" },
    { id: "SENT", title: "Sent" },
    { id: "RECEIVED", title: "Received" },
    { id: "UNDER_REVIEW", title: "Under Review" },
    { id: "Result_APPROVED_INTERNAL", title: "Internal Approved" },
    { id: "Result_REJECTED", title: "Rejected (Internal)" },
];

interface SampleBoardProps {
    initialSamples: any[];
    projectId: string;
    projectVendors: any[];
}

export function SampleBoard({ initialSamples, projectId, projectVendors }: SampleBoardProps) {
    const [samples, setSamples] = useState(initialSamples);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedSample, setSelectedSample] = useState<any>(null); // For Dialog

    // Sync with server revalidation
    useEffect(() => {
        setSamples(initialSamples);
    }, [initialSamples]);

    const handleSampleUpdate = (updatedSample: any) => {
        setSamples(prev => prev.map(s => s.id === updatedSample.id ? updatedSample : s));
        setSelectedSample((prev: any) => prev?.id === updatedSample.id ? updatedSample : prev);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const activeSample = activeId ? samples.find((s) => s.id === activeId) : null;

    async function handleDragEnd(event: any) {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const sampleId = active.id;
        const newStatus = over.id as SampleStatus;
        const currentSample = samples.find((s) => s.id === sampleId);

        if (currentSample && currentSample.status !== newStatus) {
            // Optimistic Update
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId ? { ...s, status: newStatus } : s
                )
            );

            try {
                const result = await updateSampleStatus(sampleId, newStatus);
                if (!result.success) {
                    throw new Error(result.error);
                }
                toast.success(`Sample moved to ${newStatus.replace("_", " ")}`);
            } catch (error) {
                toast.error("Failed to update status");
                // Revert
                setSamples((prev) =>
                    prev.map((s) =>
                        s.id === sampleId ? { ...s, status: currentSample.status } : s
                    )
                );
            }
        }

        setActiveId(null);
    }

    function handleDragStart(event: any) {
        setActiveId(event.active.id);
    }

    // Helper to filter samples for columns
    const getSamplesForColumn = (colId: string) => {
        if (colId === "Result_APPROVED_INTERNAL") {
            // Include SENT_TO_CLIENT here if necessary, or give it its own place. 
            // For now, let's group SENT_TO_CLIENT with Internal Approved as it's the next step.
            return samples.filter(s =>
                s.status === "Result_APPROVED_INTERNAL" ||
                s.status === "SENT_TO_CLIENT" ||
                s.status === "CLIENT_APPROVED" ||
                s.status === "CLIENT_REJECTED"
            );
        }
        return samples.filter((s) => s.status === colId);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex justify-end mb-4">
                <RequestSampleBoardDialog
                    projectId={projectId}
                    projectVendors={projectVendors}
                />
            </div>
            <div className="flex h-[calc(100vh-220px)] overflow-x-auto pb-4 gap-4">
                {COLUMNS.map((col) => (
                    <SampleColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={getSamplesForColumn(col.id).length}
                        samples={getSamplesForColumn(col.id)}
                        onCardClick={(sample) => {
                            setSelectedSample(sample);
                        }}
                    />
                ))}
            </div>

            <DragOverlay
                dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: "0.5",
                            },
                        },
                    }),
                }}
            >
                {activeSample ? <SampleCard sample={activeSample} /> : null}
            </DragOverlay>

            {selectedSample && (
                <UpdateSampleDialog
                    sample={selectedSample}
                    open={!!selectedSample}
                    onOpenChange={(open: boolean) => !open && setSelectedSample(null)}
                    onUpdate={handleSampleUpdate}
                />
            )}
        </DndContext>
    );
}
