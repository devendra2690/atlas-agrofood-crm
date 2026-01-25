"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updatePurchaseOrder } from "@/app/actions/procurement";
import { Pencil } from "lucide-react";
import { PurchaseOrderStatus } from "@prisma/client";

interface EditPurchaseOrderDialogProps {
    order: {
        id: string;
        totalAmount: number;
        quantity?: number | null;
        quantityUnit?: string | null;
        status: PurchaseOrderStatus;
    };
}

export function EditPurchaseOrderDialog({ order }: EditPurchaseOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [amount, setAmount] = useState(order.totalAmount.toString());
    const [quantity, setQuantity] = useState(order.quantity?.toString() || "");

    // Derived initial rate
    const initialRate = (order.quantity && order.totalAmount)
        ? (order.totalAmount / order.quantity).toFixed(2)
        : "";
    const [rate, setRate] = useState(initialRate);

    async function handleUpdate() {
        if (!amount) return;
        setLoading(true);
        try {
            const result = await updatePurchaseOrder(order.id, {
                totalAmount: parseFloat(amount),
                quantity: quantity ? parseFloat(quantity) : undefined,
                quantityUnit: "MT", // Defaulting to MT for now as per schema default
            });

            if (result.success) {
                toast.success("Purchase Order updated successfully");
                setOpen(false);
            } else {
                toast.error("Failed to update purchase order");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Purchase Order</DialogTitle>
                    <DialogDescription>
                        Update purchase order details.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Quantity (MT)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                if (e.target.value && rate) {
                                    setAmount((parseFloat(e.target.value) * parseFloat(rate)).toFixed(2));
                                }
                            }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Rate (per MT)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={rate}
                            onChange={(e) => {
                                setRate(e.target.value);
                                if (quantity && e.target.value) {
                                    setAmount((parseFloat(quantity) * parseFloat(e.target.value)).toFixed(2));
                                }
                            }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Total Amount</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        // readOnly
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={loading || !amount}>
                        {loading ? "Updating..." : "Update Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
