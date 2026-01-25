"use client";

import { Button } from "@/components/ui/button";
import { EditPurchaseOrderDialog } from "./edit-po-dialog";
import { deletePurchaseOrder } from "@/app/actions/procurement";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface POActionsProps {
    order: any;
}

export function POActions({ order }: POActionsProps) {
    const router = useRouter();

    async function handleDelete() {
        if (confirm("Are you sure you want to delete this Purchase Order?")) {
            const result = await deletePurchaseOrder(order.id);
            if (result.success) {
                toast.success("Purchase Order deleted");
                router.push("/purchase-orders");
            } else {
                toast.error("Failed to delete purchase order");
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <EditPurchaseOrderDialog order={order} />
            <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                title="Delete Purchase Order"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
