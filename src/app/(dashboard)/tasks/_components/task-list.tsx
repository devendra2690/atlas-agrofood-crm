
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    const [completingTask, setCompletingTask] = useState<any>(null);
    const [completionNote, setCompletionNote] = useState("");

    const handleStatusToggle = async (task: any) => {
        if (task.status === 'COMPLETED') {
            // Uncheck - no note needed
            const res = await updateTodo(task.id, { status: 'PENDING' });
            if (res.success) {
                toast.success("Task marked as pending");
            } else {
                toast.error("Failed to update status");
            }
        } else {
            // Check - require note
            setCompletingTask(task);
            setCompletionNote("");
        }
    };

    const confirmCompletion = async () => {
        if (!completingTask) return;

        const res = await updateTodo(completingTask.id, {
            status: 'COMPLETED',
            completionNote: completionNote
        });

        if (res.success) {
            toast.success("Task completed");
            setCompletingTask(null);
            setCompletionNote("");
        } else {
            toast.error("Failed to complete task");
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

                                {task.replies && task.replies.length > 0 && (
                                    <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground mt-1">
                                        <p className="font-semibold text-[10px] uppercase mb-0.5">Note:</p>
                                        <p>{task.replies[task.replies.length - 1].content}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
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

            {/* Task Completion Dialog */}
            <AlertDialog open={!!completingTask} onOpenChange={(open) => !open && setCompletingTask(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Complete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a note or summary of the completed work.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter completion note..."
                            value={completionNote}
                            onChange={(e) => setCompletionNote(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setCompletingTask(null)}>Cancel</Button>
                        <Button onClick={confirmCompletion} disabled={!completionNote.trim()}>
                            Complete Task
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
