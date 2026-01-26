"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CheckCircle2, Trash2, Clock, CheckCircle } from "lucide-react";
import { updateTodo, deleteTodo } from "@/app/actions/notes";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
    note: any;
}

export function NoteCard({ note }: NoteCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleStatus = async () => {
        setIsUpdating(true);
        const newStatus = note.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await updateTodo(note.id, { status: newStatus });
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this note?")) {
            await deleteTodo(note.id);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return "bg-red-100 text-red-800 border-red-200";
            case 'MEDIUM': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'LOW': return "bg-green-100 text-green-800 border-green-200";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    return (
        <Card className={cn("flex flex-col h-full", note.status === 'COMPLETED' && "opacity-60")}>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <Badge variant="outline" className={cn("font-mono text-[10px]", getPriorityColor(note.priority))}>
                    {note.priority}
                </Badge>
                {note.status === 'COMPLETED' ? (
                    <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
                        Done
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-slate-500">
                        {note.status}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-slate-50/50 mt-auto">
                <div className="flex items-center gap-2 pt-2">
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={note.user?.image} />
                        <AvatarFallback className="text-[9px]">{note.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{note.user?.name} &bull; {format(new Date(note.createdAt), "MMM d")}</span>
                </div>
                <div className="flex gap-1 pt-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleStatus} disabled={isUpdating}>
                        {note.status === 'COMPLETED' ? (
                            <Clock className="h-3 w-3 text-orange-500" />
                        ) : (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDelete} disabled={isUpdating}>
                        <Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
