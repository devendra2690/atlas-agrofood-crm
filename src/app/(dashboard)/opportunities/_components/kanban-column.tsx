"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    opportunities: any[];
    onCardClick?: (opportunity: any) => void;
    onAttachSample?: (opportunity: any) => void;
}

export function KanbanColumn({ id, title, count, opportunities, onCardClick, onAttachSample }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="p-3 border-b border-slate-100 bg-white rounded-t-lg sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px]">
                <SortableContext items={opportunities.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                    {opportunities.map((opportunity) => (
                        <KanbanCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onClick={() => onCardClick?.(opportunity)}
                            onAttachSample={() => onAttachSample?.(opportunity)}
                        />
                    ))}
                </SortableContext>
                {opportunities.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-100 rounded-lg">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}
