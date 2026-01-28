import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { OpportunityDialog } from "./opportunity-dialog";
import { deleteOpportunity } from "@/app/actions/opportunity";
import { createSalesOrder } from "@/app/actions/order";
import { toast } from "sonner";
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

interface OpportunityActionsProps {
    opportunity: any; // Ideally typed
    companies: any[];
    commodities: any[];
}

export function OpportunityActions({ opportunity, companies, commodities }: OpportunityActionsProps) {
    const [open, setOpen] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);

    async function handleDelete() {
        const result = await deleteOpportunity(opportunity.id);
        if (result.success) {
            toast.success("Opportunity deleted");
        } else {
            toast.error("Failed to delete opportunity");
        }
    }

    async function handleCreateOrder() {
        setCreatingOrder(true);
        try {
            const result = await createSalesOrder(opportunity.id);
            if (result.success) {
                toast.success("Sales Order & Procurement Project Created!");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to create order");
            }
        } catch (e) {
            toast.error("Failed to create order");
        } finally {
            setCreatingOrder(false);
        }
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.preventDefault();
                            handleCreateOrder();
                        }}
                        disabled={creatingOrder || opportunity.status !== 'CLOSED_WON'}
                        className="font-medium text-green-700 focus:text-green-800 data-[disabled]:text-muted-foreground"
                    >
                        {creatingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Create Sales Order
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteAlert(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <OpportunityDialog
                trigger={null}
                companies={companies}
                commodities={commodities}
                initialData={opportunity}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the sales
                            opportunity.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
