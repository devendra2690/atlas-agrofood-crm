
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, MoreVertical, User as UserIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog } from "./task-dialog";
import { useState } from "react";
import { updateTodo, deleteTodo } from "@/app/actions/notes";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskListProps {
    tasks: any[];
    currentUser?: any;
}

export function TaskList({ tasks, currentUser }: TaskListProps) {
    const [editingTask, setEditingTask] = useState<any>(null);

    const handleStatusToggle = async (task: any) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        const res = await updateTodo(task.id, { status: newStatus });
        if (res.success) {
            toast.success(`Task marked as ${newStatus.toLowerCase()}`);
        } else {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        const res = await deleteTodo(taskId);
        if (res.success) {
            toast.success("Task deleted");
        } else {
            toast.error("Failed to delete task");
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No tasks found in this view.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="group flex items-start justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-card">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => handleStatusToggle(task)}
                                className="mt-1 text-muted-foreground hover:text-primary transition-colors"
                            >
                                {task.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5" />
                                )}
                            </button>

                            <div className="space-y-1">
                                <p className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.content}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <Badge variant={getPriorityVariant(task.priority)} className="text-[10px] h-5 px-1.5">
                                        {task.priority}
                                    </Badge>

                                    {task.dueDate && (
                                        <span className={`flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-red-500 font-medium' : ''}`}>
                                            <Clock className="h-3 w-3" />
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}

                                    {task.assignedTo && (
                                        <div className="flex items-center gap-1" title={`Assigned to ${task.assignedTo.name}`}>
                                            <Avatar className="h-4 w-4">
                                                <AvatarImage src={task.assignedTo.image} />
                                                <AvatarFallback className="text-[9px]">{task.assignedTo.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span>{task.assignedTo.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-red-600">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            {editingTask && (
                <TaskDialog
                    task={editingTask}
                    open={!!editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                />
            )}
        </>
    );
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'HIGH': return 'destructive';
        case 'MEDIUM': return 'secondary';
        case 'LOW': return 'outline';
        default: return 'outline';
    }
}

function isOverdue(dateString: string, status: string) {
    if (status === 'COMPLETED') return false;
    const due = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
}
