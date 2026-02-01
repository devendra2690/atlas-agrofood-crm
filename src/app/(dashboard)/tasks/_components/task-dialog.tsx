
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { createTodo, updateTodo } from "@/app/actions/notes";
import { getUsers } from "@/app/actions/user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TaskDialogProps {
    children?: React.ReactNode;
    task?: any; // If provided, strictly edit mode
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TaskDialog({ children, task, open: controlledOpen, onOpenChange }: TaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Controlled vs Uncontrolled logic
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState(task?.content || "");
    const [priority, setPriority] = useState(task?.priority || "MEDIUM");
    const [status, setStatus] = useState(task?.status || "PENDING"); // Only for edit
    const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    const [assignedToId, setAssignedToId] = useState(task?.assignedToId || "");

    const [users, setUsers] = useState<{ id: string; name: string | null }[]>([]);

    useEffect(() => {
        if (open) {
            async function loadUsers() {
                const res = await getUsers();
                if (res.success && res.data) {
                    setUsers(res.data);
                }
            }
            loadUsers();
        }
    }, [open]);

    // Reset form on open if creating new
    useEffect(() => {
        if (open && !task) {
            setContent("");
            setPriority("MEDIUM");
            setDueDate("");
            setAssignedToId("");
            setStatus("PENDING");
        }
    }, [open, task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (task) {
                // UPDATE
                const res = await updateTodo(task.id, {
                    content,
                    priority,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status
                    // Note: Re-assignment not explicitly supported in updateTodo yet, assume purely content/status update for now or add it later
                });

                if (res.success) {
                    toast.success("Task updated");
                    setOpen && setOpen(false);
                } else {
                    toast.error(res.error || "Failed to update task");
                }
            } else {
                // CREATE
                const res = await createTodo({
                    content,
                    priority,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    assignedToId: assignedToId || undefined,
                    type: "TASK" // NEW
                });

                if (res.success) {
                    toast.success("Task created");
                    setOpen && setOpen(false);
                } else {
                    toast.error(res.error || "Failed to create task");
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Update task details." : "Add a new task assignment for yourself or your team."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="content">Task Description</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What needs to be done?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {!task && (
                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Assign To (Optional)</Label>
                            <Select value={assignedToId} onValueChange={setAssignedToId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name || "Unknown User"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {task && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {task ? "Save Changes" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
