"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SampleCardProps {
    sample: any; // Using any for now to avoid strict type hell, but should be Sample with relations
    onClick?: () => void;
}

export function SampleCard({ sample, onClick }: SampleCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sample.id, data: { status: sample.status } });

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
                    <CardTitle className="text-sm font-medium leading-none flex justify-between">
                        <span className="truncate pr-2">{sample.vendor.name}</span>
                        {/* Status Badge can be redundant with column, but nice for context if list search */}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground pt-1 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {sample.vendor.email || "No contact info"}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-slate-700">
                            {sample.priceQuoted ? `₹${sample.priceQuoted}` : 'No Quote'}
                            {sample.priceUnit && <span className="text-[10px] font-normal text-muted-foreground ml-1">/{sample.priceUnit}</span>}
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                            {sample.createdAt ? format(new Date(sample.createdAt), "MMM d") : ""}
                        </div>
                    </div>
                    {sample.quality && (
                        <Badge variant="outline" className="mt-2 text-[10px] px-1 py-0 h-5">
                            {sample.quality}
                        </Badge>
                    )}

                    {/* Linked Clients Section */}
                    {sample.submissions && sample.submissions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                            <div className="text-[10px] text-muted-foreground font-medium mb-1">Linked Clients:</div>
                            <div className="flex flex-wrap gap-1">
                                {sample.submissions.map((sub: any) => (
                                    <div key={sub.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-full">
                                        {sub.opportunity?.company?.name || "Unknown"}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
