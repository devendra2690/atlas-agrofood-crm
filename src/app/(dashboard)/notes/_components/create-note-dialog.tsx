"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { createTodo } from "@/app/actions/notes";
import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { TodoPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

export function CreateNoteDialog() {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<TodoPriority>("MEDIUM");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    // Tagging state
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    // Fetch users on dialog open
    // We import getTeamMembers dynamically or use a separate effect
    // Since getTeamMembers is a server action, we can call it here.
    const { getTeamMembers } = require("@/app/actions/invitation");

    const fetchUsers = async () => {
        try {
            const team = await getTeamMembers();
            setUsers(team);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers(current =>
            current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;

        console.log("Submitting note:", { content, priority, dueDate, selectedUsers });
        setLoading(true);

        try {
            const res = await createTodo({
                content,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                taggedUserIds: selectedUsers
            });
            console.log("Create note response:", res);

            if (res.success) {
                toast.success("Note created successfully");
                setOpen(false);
                setContent("");
                setPriority("MEDIUM");
                setDueDate("");
                setSelectedUsers([]);
            } else {
                toast.error(res.error || "Failed to create note");
            }
        } catch (err) {
            console.error("Error creating note:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) fetchUsers();
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Activity Note
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Activity Note</DialogTitle>
                        <DialogDescription>
                            Add a new todo or shared note for the team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                placeholder="What needs to be done?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="col-span-3 min-h-[100px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tag Team Members</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        {selectedUsers.length > 0
                                            ? `${selectedUsers.length} selected`
                                            : "Select team members..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search team..." />
                                        <CommandList>
                                            <CommandEmpty>No team member found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={user.name || user.email}
                                                        onSelect={() => {
                                                            toggleUser(user.id);
                                                            // Keep open for multi-select
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUsers.includes(user.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {user.name} ({user.email})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedUsers.map(id => {
                                        const user = users.find(u => u.id === id);
                                        return (
                                            <Badge key={id} variant="secondary" className="mr-1">
                                                {user?.name || "Unknown"}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleUser(id)}
                                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
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
                            <div className="grid gap-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Note"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
