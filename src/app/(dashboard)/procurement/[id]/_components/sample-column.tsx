"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SampleCard } from "./sample-card";
import { cn } from "@/lib/utils";

interface SampleColumnProps {
    id: string; // This is the status (e.g., "REQUESTED")
    title: string;
    count: number;
    samples: any[];
    onCardClick?: (sample: any) => void;
}

export function SampleColumn({ id, title, count, samples, onCardClick }: SampleColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className={cn(
            "flex flex-col h-full min-w-[280px] w-[280px] rounded-lg border transition-colors",
            isOver ? "bg-slate-100 border-slate-300" : "bg-slate-50/50 border-slate-200"
        )}>
            <div className="p-3 border-b border-slate-100 bg-white rounded-t-lg sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px]">
                <SortableContext items={samples.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {samples.map((sample) => (
                        <SampleCard
                            key={sample.id}
                            sample={sample}
                            onClick={() => onCardClick?.(sample)}
                        />
                    ))}
                </SortableContext>
                {samples.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-100 rounded-lg">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}
