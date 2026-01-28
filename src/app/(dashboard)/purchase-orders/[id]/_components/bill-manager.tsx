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
import { Plus, FileText, Banknote } from "lucide-react";
import { createBill, recordBillPayment } from "@/app/actions/procurement"; // Import new action
import { toast } from "sonner";
import { format } from "date-fns";

interface Bill {
    id: string;
    totalAmount: number;
    pendingAmount: number; // Added
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
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(false);

    // Create Bill Form Data
    const [formData, setFormData] = useState({
        amount: "",
        invoiceNumber: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
    });

    // Payment Form Data
    const [paymentData, setPaymentData] = useState({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
    });

    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const amount = parseFloat(formData.amount);
        // ... (Existing Validation) ...
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
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
                notes: formData.notes
            });

            if (result.success) {
                toast.success("Bill added successfully");
                setOpen(false);
                setFormData({ amount: "", invoiceNumber: "", date: new Date().toISOString().split('T')[0], notes: "" });
            } else {
                toast.error(result.error || "Failed to add bill");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;
        setLoading(true);

        const amount = parseFloat(paymentData.amount);
        if (!amount || amount <= 0) {
            toast.error("Invalid amount");
            setLoading(false);
            return;
        }

        try {
            const result = await recordBillPayment(selectedBill.id, amount, new Date(paymentData.date), paymentData.notes);
            if (result.success) {
                toast.success("Payment recorded");
                setPaymentOpen(false);
                setSelectedBill(null);
                setPaymentData({ amount: "", date: new Date().toISOString().split('T')[0], notes: "" });
            } else {
                toast.error(result.error || "Failed to record payment");
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
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Bill</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateBill} className="space-y-4">
                            {/* Existing Form Fields for Create Bill */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                                <Input id="amount" type="number" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice">Invoice Number</Label>
                                <Input id="invoice" placeholder="INV-..." value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input id="notes" placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Bill"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Payment Dialog */}
                <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Record Payment for {selectedBill?.invoiceNumber || 'Bill'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pending Amount: <span className="font-bold">₹{selectedBill?.pendingAmount?.toLocaleString()}</span></Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pAmount">Payment Amount <span className="text-red-500">*</span></Label>
                                <Input id="pAmount" type="number" required placeholder="0.00" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pDate">Payment Date</Label>
                                <Input id="pDate" type="date" required value={paymentData.date} onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pNotes">Notes</Label>
                                <Input id="pNotes" placeholder="Transaction ref, etc." value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>{loading ? "Recording..." : "Record Payment"}</Button>
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
                                    {bill.pendingAmount > 0 && bill.pendingAmount < bill.totalAmount && (
                                        <p className="text-xs text-orange-500 font-medium mt-1">Due: ₹{bill.pendingAmount.toLocaleString()}</p>
                                    )}
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <div>
                                        <p className="font-mono font-medium">₹{bill.totalAmount.toLocaleString()}</p>
                                        <p className={`text-[10px] uppercase tracking-wider ${bill.status === 'PAID' ? 'text-green-600' : 'text-slate-500'}`}>{bill.status}</p>
                                    </div>
                                    {bill.status !== 'PAID' && (
                                        <Button size="sm" variant="outline" className="h-7 gap-1 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800" onClick={() => {
                                            setSelectedBill(bill);
                                            setPaymentData({ ...paymentData, amount: bill.pendingAmount.toString() });
                                            setPaymentOpen(true);
                                        }}>
                                            <Banknote className="h-3 w-3" />
                                            Pay
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                        {bills.length > 0 && (
                            <div className="pt-2 mt-2 border-t flex justify-between font-bold text-sm">
                                <span>Total Pending</span>
                                <span className="text-orange-600">₹{bills.reduce((sum, b) => sum + (b.pendingAmount || 0), 0).toLocaleString()}</span>
                            </div>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
