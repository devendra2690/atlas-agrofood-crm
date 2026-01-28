"use client";

import { HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";

// ... existing imports

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    opportunities: any[];
    onCardClick?: (opportunity: any) => void;
    onAttachSample?: (opportunity: any) => void;
}

const COLUMN_DESCRIPTIONS: Record<string, string> = {
    "New / Open": "Leads that have just entered the system and need initial contact.",
    "Qualification": "Determining if the lead has budget, authority, need, and timeline (BANT).",
    "Proposal": "A formal quote or proposal has been sent to the prospect.",
    "Negotiation": "Discussing terms, pricing, and contract details.",
    "Closed Won": "Deal successfully closed and signed.",
    "Closed Lost": "Deal lost to competition or abandoned.",
};

export function KanbanColumn({ id, title, count, opportunities, onCardClick, onAttachSample }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="p-3 border-b border-slate-100 bg-white rounded-t-lg sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="w-[200px] text-xs">{COLUMN_DESCRIPTIONS[title] || "Manage opportunities in this stage."}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
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
