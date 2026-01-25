"use client";

import { useState } from "react";
import { PurchaseOrderStatus } from "@prisma/client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { updatePurchaseOrderStatus } from "@/app/actions/procurement";

interface POStatusSelectorProps {
    poId: string;
    currentStatus: PurchaseOrderStatus;
}

export function POStatusSelector({ poId, currentStatus }: POStatusSelectorProps) {
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (value: string) => {
        const newStatus = value as PurchaseOrderStatus;
        if (newStatus === currentStatus) return;

        setLoading(true);
        try {
            const result = await updatePurchaseOrderStatus(poId, newStatus);
            if (result.success) {
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                toast.error(result.error || "Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Select
            defaultValue={currentStatus}
            onValueChange={handleStatusChange}
            disabled={loading}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
            </SelectContent>
        </Select>
    );
}
