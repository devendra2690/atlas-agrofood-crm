"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { recordInvoicePayment } from "@/app/actions/finance";
import { format } from "date-fns";
import { Invoice } from "@prisma/client";

interface RecordPaymentDialogProps {
    invoice: {
        id: string;
        pendingAmount: number;
        totalAmount: number;
    };
}

export function RecordPaymentDialog({ invoice }: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(invoice.pendingAmount.toString());
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await recordInvoicePayment({
                invoiceId: invoice.id,
                amount: parseFloat(amount),
                date: new Date(date),
            });

            if (result.success) {
                toast.success("Payment recorded successfully");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to record payment");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Payment Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            max={invoice.pendingAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Pending: ₹{invoice.pendingAmount.toLocaleString()}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
