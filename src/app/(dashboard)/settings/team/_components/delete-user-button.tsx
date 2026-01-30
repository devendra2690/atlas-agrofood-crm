"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteUser } from "@/app/actions/user";
import { toast } from "sonner";
import { useTransition } from "react";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
    currentUserEmail: string; // To prevent deleting self (though server protects it too)
    targetUserEmail: string;
}

export function DeleteUserButton({ userId, userName, currentUserEmail, targetUserEmail }: DeleteUserButtonProps) {
    const [isPending, startTransition] = useTransition();
    const isSelf = currentUserEmail === targetUserEmail;

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.success) {
                toast.success(`User ${userName} deleted successfully`);
            } else {
                toast.error(result.error || "Failed to delete user");
            }
        });
    };

    if (isSelf) {
        return null;
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete <b>{userName}</b> and remove their access to the system.
                        <br /><br />
                        Note: If they have created active records (Companies, Orders, etc.), deletion might fail to preserve data integrity.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-white hover:bg-destructive/90"
                        disabled={isPending}
                    >
                        {isPending ? "Deleting..." : "Delete User"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
