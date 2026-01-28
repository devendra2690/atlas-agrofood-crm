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
import { deleteCompany } from "@/app/actions/company";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or alert backup

interface DeleteCompanyDialogProps {
    id: string;
    name: string;
    type?: string;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    redirectTo?: string;
}

export function DeleteCompanyDialog({ id, name, type = "Company", trigger, onSuccess, redirectTo }: DeleteCompanyDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        // alert(`Debug: Starting delete for ID: ${id}`);
        setIsDeleting(true);
        try {
            const res = await deleteCompany(id);
            // alert(`Debug: Server response: ${JSON.stringify(res)}`);

            if (res.success) {
                toast.success(`${type} deleted successfully`);
                setOpen(false);
                if (onSuccess) onSuccess();
                if (redirectTo) router.push(redirectTo);
            } else {
                console.log("Delete failed:", res);
                alert(res.error || "Failed to delete: Unknown error");
            }
        } catch (error) {
            console.error(error);
            alert(`An error occurred: ${error}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <strong>{name}</strong>.
                        <br />
                        Note: You cannot delete {type.toLowerCase()}s that have active orders or projects linked to them.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
