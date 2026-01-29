"use client";

import { useState, useEffect } from "react";
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

export function POStatusSelector({ poId, currentStatus: initialStatus }: POStatusSelectorProps) {
    const [status, setStatus] = useState<PurchaseOrderStatus>(initialStatus);
    const [loading, setLoading] = useState(false);

    // Sync prop changes (e.g. from server revalidation)
    useEffect(() => {
        setStatus(initialStatus);
    }, [initialStatus]);

    const handleStatusChange = async (value: string) => {
        const newStatus = value as PurchaseOrderStatus;
        if (newStatus === status) return;

        setLoading(true);
        try {
            // Optimistically update? No, user wants fallback on error.
            // So we wait for server response.
            const result = await updatePurchaseOrderStatus(poId, newStatus);
            if (result.success) {
                setStatus(newStatus); // Update local state only on success
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                // Do NOT update local state, so UI reverts/stays at old value
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
            value={status}
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
