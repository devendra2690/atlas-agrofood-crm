"use client";

import { toast } from "sonner";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Briefcase, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

interface KanbanCardProps {
    opportunity: any;
    onClick?: () => void;
    onAttachSample?: () => void;
}

export function KanbanCard({ opportunity, onClick, onAttachSample }: KanbanCardProps) {
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
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            onClick={onClick}
        >
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative">
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
                    {/* Add Sample Action on Hover/Always */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Attach Sample"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAttachSample?.();
                            }}
                        >
                            <FlaskConical className="h-3 w-3" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
