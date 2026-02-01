"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteWithConfirmationProps {
    id: string;
    onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
    itemType: string; // e.g., "Invoice", "Bill"
    trigger?: React.ReactNode;
}

export function DeleteWithConfirmation({ id, onDelete, itemType, trigger }: DeleteWithConfirmationProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await onDelete(id);
            if (result.success) {
                toast.success(`${itemType} deleted successfully`);
                setOpen(false);
            } else {
                toast.error(result.error || `Failed to delete ${itemType}`);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {itemType.toLowerCase()}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
