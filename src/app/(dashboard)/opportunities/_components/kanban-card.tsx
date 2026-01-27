"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Briefcase, Calendar } from "lucide-react";

interface KanbanCardProps {
    opportunity: any;
}

export function KanbanCard({ opportunity }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id, data: { status: opportunity.status } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardHeader className="p-3 pb-0 space-y-0">
                    <CardTitle className="text-sm font-medium leading-none">
                        {opportunity.productName}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground pt-1 truncate">
                        {opportunity.company.name}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-green-600">
                            {opportunity.targetPrice ? `₹${opportunity.targetPrice}` : '-'}
                        </div>
                        {opportunity.deadline && (
                            <div className="flex items-center text-[10px] text-muted-foreground">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(opportunity.deadline), "MMM d")}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
