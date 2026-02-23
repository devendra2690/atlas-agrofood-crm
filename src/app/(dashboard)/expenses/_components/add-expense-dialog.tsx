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
import { createExpense } from "@/app/actions/expense";
import { toast } from "sonner";
import { Loader2, Plus, Receipt } from "lucide-react";

export function AddExpenseDialog({ users, currentUserId }: { users: any[]; currentUserId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [description, setDescription] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [category, setCategory] = useState("General");
    const [paidById, setPaidById] = useState(currentUserId);

    // We will do an Equal Split by default for selected users
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([currentUserId]);

    const handleUserToggle = (id: string) => {
        if (selectedUserIds.includes(id)) {
            setSelectedUserIds(selectedUserIds.filter(uid => uid !== id));
        } else {
            setSelectedUserIds([...selectedUserIds, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !totalAmount) {
            toast.error("Description and Amount are required.");
            return;
        }

        const amt = parseFloat(totalAmount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (selectedUserIds.length === 0) {
            toast.error("Please select at least one person to split with.");
            return;
        }

        setLoading(true);

        // Calculate Equal Split
        const splitAmount = amt / selectedUserIds.length;
        const splits = selectedUserIds.map(uid => ({
            userId: uid,
            owedAmount: splitAmount
        }));

        try {
            const res = await createExpense({
                description,
                totalAmount: amt,
                category,
                paidById,
                date: new Date(),
                splits
            });

            if (res.success) {
                toast.success("Expense added successfully!");
                setOpen(false);
                // Reset form
                setDescription("");
                setTotalAmount("");
                setSelectedUserIds([currentUserId]);
            } else {
                toast.error(res.error || "Failed to add expense");
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add a Shared Expense</DialogTitle>
                        <DialogDescription>
                            Log a new expense. It will be split equally among selected members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Description (e.g., Team Lunch)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What was this for?"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="amount">Total Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Who Paid?</Label>
                            <Select value={paidById} onValueChange={setPaidById}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select who paid" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.id === currentUserId ? "You" : (u.name || u.email)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Split Equally Between</Label>
                            <div className="flex flex-col gap-1 border rounded-md p-2 max-h-40 overflow-y-auto">
                                {users.map(u => (
                                    <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(u.id)}
                                            onChange={() => handleUserToggle(u.id)}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">
                                            {u.id === currentUserId ? "You" : (u.name || u.email)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Expense"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
