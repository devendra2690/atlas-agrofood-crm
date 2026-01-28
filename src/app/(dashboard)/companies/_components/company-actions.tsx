"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyDialog } from "./company-dialog";
import { deleteCompany } from "@/app/actions/company";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompanyActionsProps {
    company: any;
}

export function CompanyActions({ company }: CompanyActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
            setIsLoading(true);
            try {
                const res = await deleteCompany(company.id);
                if (!res.success) {
                    setError(res.error || "Failed to delete company");
                }
            } catch (error) {
                console.error("Failed to delete company", error);
                setError("An unexpected error occurred");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <AlertDialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Deletion Failed</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setError(null)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <CompanyDialog
                            company={company}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
