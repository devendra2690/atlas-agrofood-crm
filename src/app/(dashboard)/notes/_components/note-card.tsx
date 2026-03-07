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

import { useEffect, useRef } from "react"; // Add hooks
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NoteCardProps {
    note: any;
    isHighlighted?: boolean;
}

export function NoteCard({ note, isHighlighted }: NoteCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isHighlighted]);

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
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-lg flex items-center gap-3">
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
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="flex gap-4">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={note.user?.image} />
                                <AvatarFallback>{note.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm">{note.user?.name}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap text-slate-700">{note.content}</p>
                            </div>
                        </div>

                        {note.replies && note.replies.length > 0 && (
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="text-sm font-medium text-slate-500">Replies ({note.replies.length})</h4>
                                {note.replies.map((reply: any) => (
                                    <div key={reply.id} className="flex gap-4">
                                        <Avatar className="h-6 w-6 mt-1">
                                            <AvatarImage src={reply.user?.image} />
                                            <AvatarFallback className="text-[10px]">{reply.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-slate-50 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-sm text-slate-700">{reply.user?.name}</span>
                                                <span className="text-[10px] text-slate-400">{format(new Date(reply.createdAt), "MMM d, h:mm a")}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{reply.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t shrink-0 bg-slate-50 border-t-slate-100">
                        <ReplyForm
                            noteId={note.id}
                            onCancel={() => { }}
                            onSuccess={() => { }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Card
                ref={cardRef}
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                    "flex flex-col h-full transition-all duration-300 cursor-pointer hover:shadow-md hover:border-slate-300",
                    note.status === 'COMPLETED' && "opacity-60",
                    isHighlighted && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]"
                )}
            >
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
                <CardContent className="p-4 flex-1 space-y-4 relative overflow-hidden max-h-[240px]">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>

                    {note.replies && note.replies.length > 0 && (
                        <div className="pl-3 border-l-2 border-slate-100 space-y-3 pt-2">
                            {note.replies.map((reply: any) => (
                                <div key={reply.id} className="text-xs group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={reply.user?.image} />
                                            <AvatarFallback className="text-[8px]">{reply.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-slate-700">{reply.user?.name}</span>
                                        <span className="text-slate-400 text-[10px]">{format(new Date(reply.createdAt), "MMM d, h:mm a")}</span>
                                    </div>
                                    <p className="text-slate-600 pl-6 line-clamp-2">{reply.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-slate-50/50 mt-auto z-10 relative">
                    <div className="flex items-center gap-2 pt-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={note.user?.image} />
                            <AvatarFallback className="text-[9px]">{note.user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{note.user?.name} &bull; {format(new Date(note.createdAt), "MMM d")}</span>
                    </div>
                    <div className="flex gap-1 pt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}>
                            {note.replies && note.replies.length > 0 ? `${note.replies.length} Replies` : "Reply"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleStatus(); }} disabled={isUpdating}>
                            {note.status === 'COMPLETED' ? (
                                <Clock className="h-3 w-3 text-orange-500" />
                            ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={isUpdating}>
                            <Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}

import { createReply } from "@/app/actions/notes";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown, X } from "lucide-react";
// @ts-ignore
import { getTeamMembers } from "@/app/actions/invitation";

function ReplyForm({ noteId, onCancel, onSuccess }: { noteId: string, onCancel: () => void, onSuccess: () => void }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    useEffect(() => {
        getTeamMembers().then(setUsers).catch(console.error);
    }, []);

    const toggleUser = (userId: string) => {
        setSelectedUsers(current =>
            current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId]
        );
    };

    const handleSubmit = async () => {
        if (!content) return;
        setLoading(true);
        await createReply(noteId, content, selectedUsers);
        setLoading(false);
        setContent("");
        setSelectedUsers([]);
        onSuccess();
    };

    return (
        <div className="space-y-2 bg-white rounded-md border p-2 shadow-sm">
            <Textarea
                placeholder="Write a reply..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[60px] text-xs resize-none border-0 focus-visible:ring-0 p-0 shadow-none"
            />

            <div className="flex justify-between items-center pt-2 border-t">
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] text-muted-foreground">
                            {selectedUsers.length > 0 ? `${selectedUsers.length} tagged` : "@ Tag"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search team..." className="h-8 text-xs" />
                            <CommandList>
                                <CommandEmpty>No one found.</CommandEmpty>
                                <CommandGroup>
                                    {users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.name || user.email}
                                            onSelect={() => toggleUser(user.id)}
                                            className="text-xs"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3 w-3",
                                                    selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {user.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 px-2 text-[10px]">Cancel</Button>
                    <Button size="sm" onClick={handleSubmit} disabled={loading || !content} className="h-6 px-2 text-[10px]">
                        {loading ? "..." : "Reply"}
                    </Button>
                </div>
            </div>
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedUsers.map(id => {
                        const user = users.find(u => u.id === id);
                        return (
                            <Badge key={id} variant="secondary" className="px-1 py-0 text-[9px] h-4">
                                {user?.name}
                                <X className="h-2 w-2 ml-1 cursor-pointer" onClick={() => toggleUser(id)} />
                            </Badge>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
