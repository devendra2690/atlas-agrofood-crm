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

interface CompanyActionsProps {
    company: any;
}

export function CompanyActions({ company }: CompanyActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
            setIsLoading(true);
            try {
                await deleteCompany(company.id);
            } catch (error) {
                console.error("Failed to delete company", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
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
                        {/* We use select logic to intercept the click and prevent dropdown close if needed, but for dialog trigger we usually want it to stay or let component handle it. 
                            However, trigger inside item can be weird. Let's try putting the Dialog completely outside but controlled? 
                            Actually, CompanyDialog takes a trigger. We can put the trigger inside the item? No, that's nested button.
                            
                            Better pattern: 
                            Make CompanyDialog "controlled" or just use it as the item?
                            If we put <CompanyDialog trigger={<DropdownMenuItem>Edit</DropdownMenuItem>} /> it might work?
                            Let's try:
                        */}
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
