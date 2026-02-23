"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSettlement } from "@/app/actions/expense";
import { toast } from "sonner";
import { Loader2, HandCoins } from "lucide-react";

export function SettleUpDialog({ users, currentUserId }: { users: any[]; currentUserId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [amount, setAmount] = useState("");
    const [payeeId, setPayeeId] = useState("");
    const [method, setMethod] = useState("Cash");

    // Derived state: the payer is usually the logged-in user settling their own debt
    const payerId = currentUserId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!payeeId) {
            toast.error("Please select who you are paying.");
            return;
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        setLoading(true);

        try {
            const res = await createSettlement({
                payerId,
                payeeId,
                amount: amt,
                date: new Date(),
                method,
                notes: "Settled up"
            });

            if (res.success) {
                toast.success("Settlement recorded successfully!");
                setOpen(false);
                // Reset form
                setAmount("");
                setPayeeId("");
            } else {
                toast.error(res.error || "Failed to record settlement");
            }
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                    <HandCoins className="mr-2 h-4 w-4" />
                    Settle Up
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Settle Up</DialogTitle>
                        <DialogDescription>
                            Record a payment you made to a colleague to clear your debt.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Who did you pay?</Label>
                            <Select value={payeeId} onValueChange={setPayeeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select colleague" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.filter(u => u.id !== currentUserId).map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="amount">Amount Paid ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Venmo">Venmo</SelectItem>
                                    <SelectItem value="PayPal">PayPal</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Record Payment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
