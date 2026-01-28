"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SalesOrderKanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    orders: any[];
}

export function KanbanColumn({ id, title, count, orders }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="p-3 border-b border-slate-100 bg-white rounded-t-lg sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px] transition-colors",
                    isOver && "bg-slate-100/50"
                )}
            >
                <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                    {orders.map((order) => (
                        <SalesOrderKanbanCard
                            key={order.id}
                            order={order}
                        />
                    ))}
                </SortableContext>
                {orders.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-100 rounded-lg">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}
