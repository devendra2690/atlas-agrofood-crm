"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText } from "lucide-react";
import { createBill } from "@/app/actions/procurement";
import { toast } from "sonner";
import { format } from "date-fns";

interface Bill {
    id: string;
    totalAmount: number;
    invoiceNumber?: string | null;
    status: string;
    createdAt: Date | string;
}

interface BillManagerProps {
    poId: string;
    vendorId: string;
    bills: Bill[];
    totalAmount: number;
}

export function BillManager({ poId, vendorId, bills, totalAmount }: BillManagerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        invoiceNumber: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const amount = parseFloat(formData.amount);

        // Validation 1: Amount mandatory
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            setLoading(false);
            return;
        }

        // Validation 2: Notes required if mismatch
        if (amount !== totalAmount && (!formData.notes || formData.notes.trim() === "")) {
            toast.error(`Amount mismatch! Expected ₹${totalAmount.toLocaleString()}. Please add notes explaining the difference.`);
            setLoading(false);
            return;
        }

        try {
            const result = await createBill({
                purchaseOrderId: poId,
                vendorId: vendorId,
                totalAmount: amount,
                invoiceNumber: formData.invoiceNumber || undefined,
                date: new Date(formData.date),
                notes: formData.notes // Ensure backend accepts this
            });

            if (result.success) {
                toast.success("Bill added successfully");
                setOpen(false);
                setFormData({
                    amount: "",
                    invoiceNumber: "",
                    date: new Date().toISOString().split('T')[0],
                    notes: ""
                });
            } else {
                toast.error(result.error || "Failed to add bill");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Bills & Payment</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Bill
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Bill</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice">Invoice Number (Auto-generated if empty)</Label>
                                <Input
                                    id="invoice"
                                    placeholder="INV-..."
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes {parseFloat(formData.amount) !== totalAmount && parseFloat(formData.amount) > 0 && <span className="text-red-500">* (Required due to amount mismatch)</span>}</Label>
                                <Input
                                    id="notes"
                                    placeholder="Explain amount difference (e.g. Partial Payment)"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Adding..." : "Add Bill"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No bills generated yet.</p>
                    </div>
                ) : (
                    <ul className="space-y-3 pt-2">
                        {bills.map((bill) => (
                            <li key={bill.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">
                                        {bill.invoiceNumber ? `Invoice #${bill.invoiceNumber}` : "Bill"}
                                    </p>
                                    <p className="text-xs text-slate-500">{format(new Date(bill.createdAt), "MMM d, yyyy")}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-medium">₹{bill.totalAmount.toLocaleString()}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{bill.status}</p>
                                </div>
                            </li>
                        ))}
                        {bills.length > 0 && (
                            <div className="pt-2 mt-2 border-t flex justify-between font-bold text-sm">
                                <span>Total</span>
                                <span>₹{bills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</span>
                            </div>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
